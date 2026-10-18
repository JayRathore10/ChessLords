import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import { getChessGame } from '../services/chess.service';
import { gameModel, GameInterface } from '../models/game.model';
import { createChessGame } from '../services/chess.service';
import mongoose from 'mongoose';
import { makeChessMove } from '../services/chess.service';
import {
  applyElapsedTime,
  applyIncrement,
  clearGameTimeout,
  clockPayload,
  handleAuthoritativeTimeout,
  isTimedOut,
  scheduleGameTimeout,
} from '../services/clock.service';
import {
  clearAllPendingForGame,
  clearPendingDisconnect,
  handlePlayerReconnected,
  startDisconnectGrace,
} from '../services/reconnect.service';
import { recordCompletedGameStats } from '../services/stats.service';

const playerGames = new Map<string, string>();

/** gameId -> set of spectator socket ids */
const gameSpectators = new Map<string, Set<string>>();

function getSpectatorCount(gameId: string): number {
  return gameSpectators.get(gameId)?.size ?? 0;
}

function addSpectator(io: Server, gameId: string, socketId: string) {
  let set = gameSpectators.get(gameId);
  if (!set) {
    set = new Set();
    gameSpectators.set(gameId, set);
  }
  set.add(socketId);
  io.to(`game:${gameId}`).emit('spectatorUpdate', {
    gameId,
    spectatorCount: set.size,
  });
}

function removeSpectator(io: Server, gameId: string, socketId: string) {
  const set = gameSpectators.get(gameId);
  if (!set || !set.has(socketId)) return;
  set.delete(socketId);
  if (set.size === 0) {
    gameSpectators.delete(gameId);
  }
  io.to(`game:${gameId}`).emit('spectatorUpdate', {
    gameId,
    spectatorCount: set.size,
  });
}

function armClock(io: Server, game: GameInterface) {
  scheduleGameTimeout(game, (gameId, loser, winner) => {
    void handleAuthoritativeTimeout(io, gameId, loser, winner);
  });
}

function resolveSeatedColor(
  socket: Socket,
  game: GameInterface
): 'white' | 'black' | null {
  let color = socket.data.color as 'white' | 'black' | undefined;
  if (color === 'white' || color === 'black') return color;

  const userId = socket.data.userId;
  if (userId && game.whitePlayer?.toString() === userId) return 'white';
  if (userId && game.blackPlayer?.toString() === userId) return 'black';

  const username = socket.data.username;
  if (username && game.whitePlayerName === username) return 'white';
  if (username && game.blackPlayerName === username) return 'black';

  return null;
}

/**
 * Unexpected disconnect handler — starts 60s grace period for active online games.
 */
export async function handleGameDisconnect(io: Server, socket: Socket) {
  try {
    if (socket.data.intentionalLeave) return;

    const gameId = socket.data.gameId || playerGames.get(socket.id);
    if (!gameId) return;

    playerGames.delete(socket.id);

    if (socket.data.isSpectator) {
      removeSpectator(io, gameId, socket.id);
      return;
    }

    const game = await gameModel.findById(gameId);
    if (!game || game.status !== 'active' || game.isPassAndPlay) {
      return;
    }

    const color = resolveSeatedColor(socket, game);
    if (!color) return;

    startDisconnectGrace(io, gameId, color, {
      userId: socket.data.userId,
      username: socket.data.username,
    });
  } catch (error) {
    console.error('[Game] disconnect handler error:', error);
  }
}

export const setupGameSocket = (io: Server, socket: Socket) => {
  // Socket for JoinGame
  socket.on(
    'joinGame',
    async (data: {
      gameId: string;
      userId?: string;
      username?: string;
      rating?: number;
    }) => {
      try {
        const { gameId } = data;

        // Prefer verified JWT identity; fall back to payload only for guests
        const userId =
          (socket.data.authenticated && socket.data.userId) ||
          data.userId ||
          'guest';
        const username =
          (socket.data.authenticated && socket.data.username) ||
          data.username ||
          'Guest';
        const rating =
          (socket.data.authenticated && typeof socket.data.rating === 'number'
            ? socket.data.rating
            : undefined) ??
          data.rating ??
          1200;

        const game = await gameModel.findById(gameId);
        if (!game) {
          socket.emit('gameError', {
            message: 'Game not found',
          });
          return;
        }

        // Check if Pass and Play local game
        if (game.isPassAndPlay) {
          socket.join(`game:${gameId}`);
          if (!socket.data.authenticated) {
            socket.data.userId = userId;
          }
          socket.data.gameId = gameId;
          socket.data.color = 'white'; // default view

          playerGames.set(socket.id, gameId);

          const existingGame = getChessGame(gameId);
          if (!existingGame) {
            createChessGame(gameId, game.currentPosition);
          }

          socket.emit('gameState', {
            gameId: game._id.toString(),
            color: 'white',
            isPassAndPlay: true,
            whitePlayer: game.whitePlayer?.toString() || 'player1',
            blackPlayer: game.blackPlayer?.toString() || 'player2',
            whitePlayerName: game.whitePlayerName || 'Player 1 (White)',
            blackPlayerName: game.blackPlayerName || 'Player 2 (Black)',
            whitePlayerRating: game.whitePlayerRating || 1200,
            blackPlayerRating: game.blackPlayerRating || 1200,
            gameType: game.gameType,
            status: game.status,
            result: game.result,
            moves: game.moves,
            currentPosition: game.currentPosition,
            turn: game.turn,
            timeControl: game.timeControl,
            whiteTime: game.whiteTime,
            blackTime: game.blackTime,
            inviteCode: game.inviteCode,
          });
          return;
        }

        // Determine player role / seat
        const validUserId = mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : undefined;

        const isWhite =
          (validUserId && game.whitePlayer?.toString() === userId) ||
          (game.whitePlayerName && game.whitePlayerName === username);

        const isBlack =
          (validUserId && game.blackPlayer?.toString() === userId) ||
          (game.blackPlayerName && game.blackPlayerName === username);

        let playerColor: 'white' | 'black' = 'white';

        let isSpectator = false;

        if (isWhite) {
          playerColor = 'white';
        } else if (isBlack) {
          playerColor = 'black';
        } else if (game.status === 'waiting') {
          // Second player joining waiting room!
          if (
            !game.whitePlayer &&
            (!game.whitePlayerName || game.whitePlayerName === 'White')
          ) {
            game.whitePlayer = validUserId;
            game.whitePlayerName = username;
            game.whitePlayerRating = rating;
            playerColor = 'white';
          } else {
            game.blackPlayer = validUserId;
            game.blackPlayerName = username;
            game.blackPlayerRating = rating;
            playerColor = 'black';
          }

          game.status = 'active';
          game.startedAt = new Date();
          game.lastMoveAt = new Date();
          await game.save();
          armClock(io, game);

          console.log(
            `[Room] ${username} joined waiting game ${gameId} as ${playerColor}`
          );
        } else {
          // Spectator or read-only view
          isSpectator = true;
          playerColor = 'white';
        }

        // Sync remaining time for reconnecting players on an active game
        if (game.status === 'active' && game.lastMoveAt) {
          applyElapsedTime(game);
          await game.save();
          armClock(io, game);
        } else if (game.status === 'active' && !game.lastMoveAt) {
          game.lastMoveAt = new Date();
          await game.save();
          armClock(io, game);
        }

        socket.join(`game:${gameId}`);
        if (!socket.data.authenticated) {
          socket.data.userId = userId;
          socket.data.username = username;
        }
        socket.data.gameId = gameId;
        socket.data.color = playerColor;
        socket.data.isSpectator = isSpectator;
        socket.data.intentionalLeave = false;
        playerGames.set(socket.id, gameId);

        // Clear disconnect grace if this seated player is reconnecting
        if (!isSpectator && (playerColor === 'white' || playerColor === 'black')) {
          handlePlayerReconnected(io, gameId, playerColor, username);
        }

        if (isSpectator) {
          addSpectator(io, gameId, socket.id);
        }

        const existingGame = getChessGame(gameId);
        if (!existingGame) {
          createChessGame(gameId, game.currentPosition);
        }

        const clock = clockPayload(game);
        const spectatorCount = getSpectatorCount(gameId);

        const gameStatePayload = {
          gameId: game._id.toString(),
          color: playerColor,
          isPassAndPlay: game.isPassAndPlay || false,
          whitePlayer: game.whitePlayer?.toString() || '',
          blackPlayer: game.blackPlayer?.toString() || '',
          whitePlayerName: game.whitePlayerName || 'White',
          blackPlayerName: game.blackPlayerName || 'Black',
          whitePlayerRating: game.whitePlayerRating || 1200,
          blackPlayerRating: game.blackPlayerRating || 1200,
          gameType: game.gameType,
          status: game.status,
          result: game.result,
          moves: game.moves,
          currentPosition: game.currentPosition,
          turn: game.turn,
          timeControl: game.timeControl,
          whiteTime: clock.whiteTime,
          blackTime: clock.blackTime,
          lastMoveAt: clock.lastMoveAt,
          serverTime: clock.serverTime,
          inviteCode: game.inviteCode,
          isSpectator,
          spectatorCount,
          reconnect: !isSpectator && game.status === 'active',
        };

        // Notify this player
        socket.emit('gameState', gameStatePayload);
        socket.emit('reconnected', {
          gameId,
          color: playerColor,
          isSpectator,
          spectatorCount,
          status: game.status,
          ...clock,
        });

        // Notify other players in room about updated state / player joined
        socket.to(`game:${gameId}`).emit('playerJoined', {
          gameId,
          joinedColor: playerColor,
          username,
          rating,
          status: game.status,
          whiteTime: clock.whiteTime,
          blackTime: clock.blackTime,
          turn: game.turn,
          serverTime: clock.serverTime,
        });

        console.log(
          `${username} (${userId}) joined game ${gameId} as ${playerColor}`
        );
      } catch (error) {
        console.error('Join game error:', error);
        socket.emit('gameError', {
          message: 'Failed to join game',
        });
      }
    }
  );

  // Socket for MakeMove
  socket.on(
    'makeMove',
    async (data: {
      gameId: string;
      from: string;
      to: string;
      promotion?: 'q' | 'r' | 'b' | 'n';
    }) => {
      try {
        const { gameId, from, to, promotion } = data;

        // Make sure socket belongs to this game
        if (socket.data.gameId !== gameId) {
          socket.emit('invalidMove', {
            message: 'You are not in this game',
          });
          return;
        }

        if (socket.data.isSpectator) {
          socket.emit('invalidMove', {
            message: 'Spectators cannot make moves',
          });
          return;
        }

        const game = await gameModel.findById(gameId);

        if (!game) {
          socket.emit('invalidMove', {
            message: 'Game not found',
          });
          return;
        }

        if (game.status !== 'active') {
          socket.emit('invalidMove', {
            message: 'Game is not active',
          });
          return;
        }

        // Check player's turn
        if (!game.isPassAndPlay && game.turn !== socket.data.color) {
          socket.emit('invalidMove', {
            message: 'It is not your turn',
          });
          return;
        }

        // Deduct elapsed time from the player about to move (authoritative)
        applyElapsedTime(game);

        if (isTimedOut(game)) {
          const loser = game.turn;
          const winner = loser === 'white' ? 'black' : 'white';
          if (loser === 'white') game.whiteTime = 0;
          else game.blackTime = 0;
          game.status = 'completed';
          game.result = winner;
          game.endedAt = new Date();
          await game.save();
          clearGameTimeout(gameId);
          recordCompletedGameStats(game);

          io.to(`game:${gameId}`).emit('gameOver', {
            result: winner,
            reason: 'timeout',
            winner,
            loser,
            whiteTime: game.whiteTime,
            blackTime: game.blackTime,
          });
          return;
        }

        // Make chess move
        const result = makeChessMove(gameId, from, to, promotion);

        if (!result.success) {
          // Persist clock deduction even on illegal move attempt
          await game.save();
          socket.emit('invalidMove', {
            message: result.message,
          });
          return;
        }

        const movedColor = game.turn;
        applyIncrement(game, movedColor);

        // Save move
        game.moves.push(result.move.san);
        game.currentPosition = result.fen;
        game.turn = result.turn;
        game.lastMoveAt = new Date();

        // Check game over
        if (result.isGameOver) {
          game.status = 'completed';
          game.endedAt = new Date();
          clearGameTimeout(gameId);

          if (result.isCheckmate) {
            game.result = result.turn === 'white' ? 'black' : 'white';
          } else {
            game.result = 'draw';
          }
        }

        await game.save();

        if (game.status === 'completed') {
          recordCompletedGameStats(game);
        }

        if (game.status === 'active') {
          armClock(io, game);
        }

        const clock = clockPayload(game);

        // Send updated game state to both players
        io.to(`game:${gameId}`).emit('moveMade', {
          from,
          to,
          promotion,
          move: result.move,
          fen: result.fen,
          turn: result.turn,
          isCheck: result.isCheck,
          isCheckmate: result.isCheckmate,
          isDraw: result.isDraw,
          isGameOver: result.isGameOver,
          status: game.status,
          result: game.result,
          whiteTime: clock.whiteTime,
          blackTime: clock.blackTime,
          serverTime: clock.serverTime,
          lastMoveAt: clock.lastMoveAt,
        });
      } catch (error) {
        console.error('Move error:', error);

        socket.emit('gameError', {
          message: 'Failed to make move',
        });
      }
    }
  );

  // --- RESIGN HANDLER ---
  socket.on('resign', async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      if (socket.data.gameId !== gameId) return;
      if (socket.data.isSpectator) return;

      const game = await gameModel.findById(gameId);
      if (!game || game.status !== 'active') return;

      const resigningColor = socket.data.color as 'white' | 'black';
      const winner = resigningColor === 'white' ? 'black' : 'white';

      applyElapsedTime(game);
      game.status = 'completed';
      game.result = winner;
      game.endedAt = new Date();
      await game.save();
      clearGameTimeout(gameId);
      clearAllPendingForGame(gameId);
      recordCompletedGameStats(game);

      io.to(`game:${gameId}`).emit('gameOver', {
        result: winner,
        reason: 'resignation',
        winner,
        whiteTime: game.whiteTime,
        blackTime: game.blackTime,
      });

      console.log(`[Game] ${resigningColor} resigned in game ${gameId}`);
    } catch (err) {
      console.error('Resign error:', err);
    }
  });

  // --- OFFER DRAW HANDLER ---
  socket.on('offerDraw', (data: { gameId: string }) => {
    const { gameId } = data;
    if (socket.data.gameId !== gameId) return;
    if (socket.data.isSpectator) return;

    // Broadcast draw offer to the opponent
    socket.to(`game:${gameId}`).emit('drawOffered', {
      byColor: socket.data.color,
    });
    console.log(`[Game] ${socket.data.color} offered draw in game ${gameId}`);
  });

  // --- RESPOND TO DRAW HANDLER ---
  socket.on(
    'respondDraw',
    async (data: { gameId: string; accept: boolean }) => {
      try {
        const { gameId, accept } = data;
        if (socket.data.gameId !== gameId) return;
        if (socket.data.isSpectator) return;

        if (accept) {
          const game = await gameModel.findById(gameId);
          if (!game || game.status !== 'active') return;

          applyElapsedTime(game);
          game.status = 'completed';
          game.result = 'draw';
          game.endedAt = new Date();
          await game.save();
          clearGameTimeout(gameId);
          clearAllPendingForGame(gameId);
          recordCompletedGameStats(game);

          io.to(`game:${gameId}`).emit('gameOver', {
            result: 'draw',
            reason: 'agreement',
            whiteTime: game.whiteTime,
            blackTime: game.blackTime,
          });
          console.log(`[Game] Draw agreed in game ${gameId}`);
        } else {
          // Notify the offering player that draw was declined
          socket.to(`game:${gameId}`).emit('drawDeclined');
        }
      } catch (err) {
        console.error('Respond draw error:', err);
      }
    }
  );

  // --- ABORT GAME HANDLER ---
  socket.on('abortGame', async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      if (socket.data.gameId !== gameId) return;
      if (socket.data.isSpectator) return;

      const game = await gameModel.findById(gameId);
      if (!game) return;

      // Can only abort if no moves have been made
      if (game.moves.length > 0) {
        socket.emit('gameError', {
          message: 'Cannot abort a game that has already started',
        });
        return;
      }

      game.status = 'aborted';
      game.endedAt = new Date();
      await game.save();
      clearGameTimeout(gameId);
      clearAllPendingForGame(gameId);

      io.to(`game:${gameId}`).emit('gameOver', {
        result: 'none',
        reason: 'aborted',
      });
      console.log(`[Game] Game ${gameId} aborted by ${socket.data.color}`);
    } catch (err) {
      console.error('Abort game error:', err);
    }
  });

  // ─── TIMEOUT HANDLER (client hint — server re-validates authoritatively) ───
  socket.on(
    'gameTimeout',
    async (data: {
      gameId: string;
      winner: 'white' | 'black';
      loser: 'white' | 'black';
    }) => {
      try {
        const { gameId, winner, loser } = data;

        if (socket.data.gameId !== gameId) {
          return;
        }

        await handleAuthoritativeTimeout(io, gameId, loser, winner);
      } catch (err) {
        console.error('Timeout error:', err);
      }
    }
  );

  // ─── LEAVE GAME HANDLER ──────────────────────────────────────────────────
  socket.on('leaveGame', async (data?: { gameId?: string }) => {
    try {
      const gameId = data?.gameId || socket.data.gameId || playerGames.get(socket.id);

      console.log('[LeaveGame]', {
        socketId: socket.id,
        gameId,
        color: socket.data.color,
      });

      if (!gameId) {
        console.log('[LeaveGame] No game found for socket:', socket.id);
        return;
      }

      // Mark intentional so disconnect handler does not start a grace period
      socket.data.intentionalLeave = true;
      playerGames.delete(socket.id);

      const game = await gameModel.findById(gameId);
      if (!game) {
        socket.leave(`game:${gameId}`);
        socket.data.gameId = undefined;
        return;
      }

      // If already completed or aborted, just leave room
      if (game.status === 'completed' || game.status === 'aborted') {
        socket.leave(`game:${gameId}`);
        socket.data.gameId = undefined;
        return;
      }

      // If player leaves while the game is still waiting for an opponent
      if (game.status === 'waiting') {
        await gameModel.findOneAndUpdate(
          { _id: gameId, status: 'waiting' },
          {
            $set: {
              status: 'aborted',
              result: 'none',
              endedAt: new Date(),
            },
          }
        );

        io.to(`game:${gameId}`).emit('gameLeft', {
          gameId,
          status: 'aborted',
          result: 'none',
          reason: 'player_left',
          leavingColor: socket.data.color,
          message: 'Player left the game.',
        });

        io.to(`game:${gameId}`).emit('gameOver', {
          result: 'none',
          reason: 'player_left',
        });

        socket.leave(`game:${gameId}`);
        socket.data.gameId = undefined;
        return;
      }

      // Pass & Play mode
      if (game.isPassAndPlay) {
        await gameModel.findOneAndUpdate(
          { _id: gameId, status: 'active' },
          {
            $set: {
              status: 'completed',
              endedAt: new Date(),
            },
          }
        );
        socket.leave(`game:${gameId}`);
        socket.data.gameId = undefined;
        return;
      }

      // Identify leaving color
      let leavingColor = socket.data.color as 'white' | 'black' | undefined;
      if (!leavingColor) {
        const userId = socket.data.userId;
        if (userId && game.whitePlayer && game.whitePlayer.toString() === userId) {
          leavingColor = 'white';
        } else if (userId && game.blackPlayer && game.blackPlayer.toString() === userId) {
          leavingColor = 'black';
        } else if (socket.data.username && game.whitePlayerName === socket.data.username) {
          leavingColor = 'white';
        } else if (socket.data.username && game.blackPlayerName === socket.data.username) {
          leavingColor = 'black';
        }
      }

      if (leavingColor !== 'white' && leavingColor !== 'black') {
        // Spectator or unidentified player leaving
        if (socket.data.isSpectator) {
          removeSpectator(io, gameId, socket.id);
        }
        socket.leave(`game:${gameId}`);
        socket.data.gameId = undefined;
        socket.data.isSpectator = false;
        return;
      }

      const winner = leavingColor === 'white' ? 'black' : 'white';
      const loser = leavingColor;

      clearGameTimeout(gameId);
      clearPendingDisconnect(gameId, leavingColor);

      // Atomically update game in MongoDB to prevent race conditions
      const updatedGame = await gameModel.findOneAndUpdate(
        { _id: gameId, status: 'active' },
        {
          $set: {
            status: 'completed',
            result: winner,
            endedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!updatedGame) {
        // Already finished or modified concurrently
        socket.leave(`game:${gameId}`);
        socket.data.gameId = undefined;
        return;
      }

      recordCompletedGameStats(updatedGame);

      // Notify all players in the game room immediately
      io.to(`game:${gameId}`).emit('gameLeft', {
        gameId,
        result: winner,
        winner,
        loser,
        reason: 'player_left',
        leavingColor,
      });

      io.to(`game:${gameId}`).emit('gameOver', {
        result: winner,
        winner,
        loser,
        reason: 'player_left',
      });

      console.log(`[Game] ${leavingColor} left game ${gameId}. ${winner} declared winner.`);

      socket.leave(`game:${gameId}`);
      socket.data.gameId = undefined;
    } catch (error) {
      console.error('[Game] leaveGame error:', error);
    }
  });
};
