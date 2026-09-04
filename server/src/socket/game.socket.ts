import { Server } from "socket.io"
import { Socket } from "socket.io"
import { getChessGame } from "../services/chess.service";
import { gameModel } from "../models/game.model";
import { createChessGame } from "../services/chess.service";
import mongoose from "mongoose";
import { makeChessMove } from "../services/chess.service";

export const setupGameSocket = (io: Server, socket: Socket) => {
  socket.on(
    "joinGame",
    async (data: {
      gameId: string;
      userId?: string;
      username?: string;
      rating?: number;
    }) => {
      try {
        const {
          gameId,
          userId = "guest",
          username = "Guest",
          rating = 1200,
        } = data;

        const game = await gameModel.findById(gameId);

        if (!game) {
          socket.emit("gameError", {
            message: "Game not found",
          });
          return;
        }

        // Check if Pass and Play local game
        if (game.isPassAndPlay) {
          socket.join(`game:${gameId}`);
          socket.data.userId = userId;
          socket.data.gameId = gameId;
          socket.data.color = "white"; // default view

          const existingGame = getChessGame(gameId);
          if (!existingGame) {
            createChessGame(gameId, game.currentPosition);
          }

          socket.emit("gameState", {
            gameId: game._id.toString(),
            color: "white",
            isPassAndPlay: true,
            whitePlayer: game.whitePlayer?.toString() || "player1",
            blackPlayer: game.blackPlayer?.toString() || "player2",
            whitePlayerName: game.whitePlayerName || "Player 1 (White)",
            blackPlayerName: game.blackPlayerName || "Player 2 (Black)",
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

        let playerColor: "white" | "black" = "white";

        if (isWhite) {
          playerColor = "white";
        } else if (isBlack) {
          playerColor = "black";
        } else if (game.status === "waiting") {
          // Second player joining waiting room!
          if (!game.whitePlayer && (!game.whitePlayerName || game.whitePlayerName === "White")) {
            game.whitePlayer = validUserId;
            game.whitePlayerName = username;
            game.whitePlayerRating = rating;
            playerColor = "white";
          } else {
            game.blackPlayer = validUserId;
            game.blackPlayerName = username;
            game.blackPlayerRating = rating;
            playerColor = "black";
          }

          game.status = "active";
          game.startedAt = new Date();
          await game.save();

          console.log(`[Room] ${username} joined waiting game ${gameId} as ${playerColor}`);
        } else {
          // Spectator or read-only view
          playerColor = "white";
        }

        socket.join(`game:${gameId}`);
        socket.data.userId = userId;
        socket.data.gameId = gameId;
        socket.data.color = playerColor;

        const existingGame = getChessGame(gameId);
        if (!existingGame) {
          createChessGame(gameId, game.currentPosition);
        }

        const gameStatePayload = {
          gameId: game._id.toString(),
          color: playerColor,
          isPassAndPlay: game.isPassAndPlay || false,
          whitePlayer: game.whitePlayer?.toString() || "",
          blackPlayer: game.blackPlayer?.toString() || "",
          whitePlayerName: game.whitePlayerName || "White",
          blackPlayerName: game.blackPlayerName || "Black",
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
        };

        // Notify this player
        socket.emit("gameState", gameStatePayload);

        // Notify other players in room about updated state / player joined
        socket.to(`game:${gameId}`).emit("playerJoined", {
          gameId,
          joinedColor: playerColor,
          username,
          rating,
          status: game.status,
        });

        console.log(`${username} (${userId}) joined game ${gameId} as ${playerColor}`);
      } catch (error) {
        console.error("Join game error:", error);
        socket.emit("gameError", {
          message: "Failed to join game",
        });
      }
    }
  );

  socket.on(
    "makeMove",
    async (data: {
      gameId: string;
      from: string;
      to: string;
      promotion?: "q" | "r" | "b" | "n";
    }) => {
      try {
        const {
          gameId,
          from,
          to,
          promotion,
        } = data;

        // Make sure socket belongs to this game
        if (socket.data.gameId !== gameId) {
          socket.emit("invalidMove", {
            message: "You are not in this game",
          });
          return;
        }

        const game = await gameModel.findById(gameId);

        if (!game) {
          socket.emit("invalidMove", {
            message: "Game not found",
          });
          return;
        }

        if (game.status !== "active") {
          socket.emit("invalidMove", {
            message: "Game is not active",
          });
          return;
        }

        // Check player's turn
        if (
          !game.isPassAndPlay &&
          game.turn !== socket.data.color
        ) {
          socket.emit("invalidMove", {
            message: "It is not your turn",
          });
          return;
        }

        // Make chess move
        const result = makeChessMove(
          gameId,
          from,
          to,
          promotion
        );

        if (!result.success) {
          socket.emit("invalidMove", {
            message: result.message,
          });
          return;
        }

        // Save move
        game.moves.push(result.move.san);

        game.currentPosition = result.fen;

        game.turn = result.turn;

        // Check game over
        if (result.isGameOver) {
          game.status = "completed";
          game.endedAt = new Date();

          if (result.isCheckmate) {
            game.result =
              result.turn === "white"
                ? "black"
                : "white";
          } else {
            game.result = "draw";
          }
        }

        await game.save();

        // Send updated game state to both players
        io.to(`game:${gameId}`).emit(
          "moveMade",
          {
            from,
            to,
            promotion,

            move: result.move,

            fen: result.fen,

            turn: result.turn,

            isCheck: result.isCheck,

            isCheckmate:
              result.isCheckmate,

            isDraw:
              result.isDraw,

            isGameOver:
              result.isGameOver,

            status:
              game.status,

            result:
              game.result,
          }
        );

      } catch (error) {
        console.error(
          "Move error:",
          error
        );

        socket.emit("gameError", {
          message:
            "Failed to make move",
        });
      }
    }
  );

  // --- RESIGN HANDLER ---
  socket.on("resign", async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      if (socket.data.gameId !== gameId) return;

      const game = await gameModel.findById(gameId);
      if (!game || game.status !== "active") return;

      const resigningColor = socket.data.color as "white" | "black";
      const winner = resigningColor === "white" ? "black" : "white";

      game.status = "completed";
      game.result = winner;
      game.endedAt = new Date();
      await game.save();

      io.to(`game:${gameId}`).emit("gameOver", {
        result: winner,
        reason: "resignation",
        winner,
      });

      console.log(`[Game] ${resigningColor} resigned in game ${gameId}`);
    } catch (err) {
      console.error("Resign error:", err);
    }
  });

  // --- OFFER DRAW HANDLER ---
  socket.on("offerDraw", (data: { gameId: string }) => {
    const { gameId } = data;
    if (socket.data.gameId !== gameId) return;

    // Broadcast draw offer to the opponent
    socket.to(`game:${gameId}`).emit("drawOffered", {
      byColor: socket.data.color,
    });
    console.log(`[Game] ${socket.data.color} offered draw in game ${gameId}`);
  });

  // --- RESPOND TO DRAW HANDLER ---
  socket.on("respondDraw", async (data: { gameId: string; accept: boolean }) => {
    try {
      const { gameId, accept } = data;
      if (socket.data.gameId !== gameId) return;

      if (accept) {
        const game = await gameModel.findById(gameId);
        if (!game || game.status !== "active") return;

        game.status = "completed";
        game.result = "draw";
        game.endedAt = new Date();
        await game.save();

        io.to(`game:${gameId}`).emit("gameOver", {
          result: "draw",
          reason: "agreement",
        });
        console.log(`[Game] Draw agreed in game ${gameId}`);
      } else {
        // Notify the offering player that draw was declined
        socket.to(`game:${gameId}`).emit("drawDeclined");
      }
    } catch (err) {
      console.error("Respond draw error:", err);
    }
  });

  // --- ABORT GAME HANDLER ---
  socket.on("abortGame", async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      if (socket.data.gameId !== gameId) return;

      const game = await gameModel.findById(gameId);
      if (!game) return;

      // Can only abort if no moves have been made
      if (game.moves.length > 0) {
        socket.emit("gameError", { message: "Cannot abort a game that has already started" });
        return;
      }

      game.status = "aborted";
      game.endedAt = new Date();
      await game.save();

      io.to(`game:${gameId}`).emit("gameOver", {
        result: "none",
        reason: "aborted",
      });
      console.log(`[Game] Game ${gameId} aborted by ${socket.data.color}`);
    } catch (err) {
      console.error("Abort game error:", err);
    }
  });

  // ─── TIMEOUT HANDLER ───────────────────────────────────────────────────────
  socket.on(
    "gameTimeout",
    async (data: {
      gameId: string;
      winner: "white" | "black";
      loser: "white" | "black";
    }) => {
      try {
        const { gameId, winner, loser } = data;

        // Make sure this socket belongs to this game
        if (socket.data.gameId !== gameId) {
          return;
        }

        const game = await gameModel.findById(gameId);

        if (!game || game.status !== "active") {
          return;
        }

        // Make sure the reported loser is actually the player
        // whose turn it currently is.
        if (game.turn !== loser) {
          return;
        }

        // Set the expired player's clock to zero
        if (loser === "white") {
          game.whiteTime = 0;
        } else {
          game.blackTime = 0;
        }

        // End the game
        game.status = "completed";
        game.result = winner;
        game.endedAt = new Date();

        await game.save();

        // Tell both players
        io.to(`game:${gameId}`).emit("gameOver", {
          result: winner,
          reason: "timeout",
          winner,
        });

        console.log(
          `[Game] ${loser} ran out of time in game ${gameId}. ${winner} wins.`
        );
      } catch (err) {
        console.error("Timeout error:", err);
      }
    }
  );

}