"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGameSocket = void 0;
exports.handleGameDisconnect = handleGameDisconnect;
const chess_service_1 = require("../services/chess.service");
const game_model_1 = require("../models/game.model");
const chess_service_2 = require("../services/chess.service");
const mongoose_1 = __importDefault(require("mongoose"));
const chess_service_3 = require("../services/chess.service");
const clock_service_1 = require("../services/clock.service");
const reconnect_service_1 = require("../services/reconnect.service");
const stats_service_1 = require("../services/stats.service");
const playerGames = new Map();
/** gameId -> set of spectator socket ids */
const gameSpectators = new Map();
function getSpectatorCount(gameId) {
    var _a, _b;
    return (_b = (_a = gameSpectators.get(gameId)) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0;
}
function addSpectator(io, gameId, socketId) {
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
function removeSpectator(io, gameId, socketId) {
    const set = gameSpectators.get(gameId);
    if (!set || !set.has(socketId))
        return;
    set.delete(socketId);
    if (set.size === 0) {
        gameSpectators.delete(gameId);
    }
    io.to(`game:${gameId}`).emit('spectatorUpdate', {
        gameId,
        spectatorCount: set.size,
    });
}
function armClock(io, game) {
    (0, clock_service_1.scheduleGameTimeout)(game, (gameId, loser, winner) => {
        void (0, clock_service_1.handleAuthoritativeTimeout)(io, gameId, loser, winner);
    });
}
function resolveSeatedColor(socket, game) {
    var _a, _b;
    let color = socket.data.color;
    if (color === 'white' || color === 'black')
        return color;
    const userId = socket.data.userId;
    if (userId && ((_a = game.whitePlayer) === null || _a === void 0 ? void 0 : _a.toString()) === userId)
        return 'white';
    if (userId && ((_b = game.blackPlayer) === null || _b === void 0 ? void 0 : _b.toString()) === userId)
        return 'black';
    const username = socket.data.username;
    if (username && game.whitePlayerName === username)
        return 'white';
    if (username && game.blackPlayerName === username)
        return 'black';
    return null;
}
/**
 * Unexpected disconnect handler — starts 60s grace period for active online games.
 */
function handleGameDisconnect(io, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (socket.data.intentionalLeave)
                return;
            const gameId = socket.data.gameId || playerGames.get(socket.id);
            if (!gameId)
                return;
            playerGames.delete(socket.id);
            if (socket.data.isSpectator) {
                removeSpectator(io, gameId, socket.id);
                return;
            }
            const game = yield game_model_1.gameModel.findById(gameId);
            if (!game || game.status !== 'active' || game.isPassAndPlay) {
                return;
            }
            const color = resolveSeatedColor(socket, game);
            if (!color)
                return;
            (0, reconnect_service_1.startDisconnectGrace)(io, gameId, color, {
                userId: socket.data.userId,
                username: socket.data.username,
            });
        }
        catch (error) {
            console.error('[Game] disconnect handler error:', error);
        }
    });
}
const setupGameSocket = (io, socket) => {
    // Socket for JoinGame
    socket.on('joinGame', (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        try {
            const { gameId } = data;
            // Prefer verified JWT identity; fall back to payload only for guests
            const userId = (socket.data.authenticated && socket.data.userId) ||
                data.userId ||
                'guest';
            const username = (socket.data.authenticated && socket.data.username) ||
                data.username ||
                'Guest';
            const rating = (_b = (_a = (socket.data.authenticated && typeof socket.data.rating === 'number'
                ? socket.data.rating
                : undefined)) !== null && _a !== void 0 ? _a : data.rating) !== null && _b !== void 0 ? _b : 1200;
            const game = yield game_model_1.gameModel.findById(gameId);
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
                const existingGame = (0, chess_service_1.getChessGame)(gameId);
                if (!existingGame) {
                    (0, chess_service_2.createChessGame)(gameId, game.currentPosition);
                }
                socket.emit('gameState', {
                    gameId: game._id.toString(),
                    color: 'white',
                    isPassAndPlay: true,
                    whitePlayer: ((_c = game.whitePlayer) === null || _c === void 0 ? void 0 : _c.toString()) || 'player1',
                    blackPlayer: ((_d = game.blackPlayer) === null || _d === void 0 ? void 0 : _d.toString()) || 'player2',
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
            const validUserId = mongoose_1.default.Types.ObjectId.isValid(userId)
                ? new mongoose_1.default.Types.ObjectId(userId)
                : undefined;
            const isWhite = (validUserId && ((_e = game.whitePlayer) === null || _e === void 0 ? void 0 : _e.toString()) === userId) ||
                (game.whitePlayerName && game.whitePlayerName === username);
            const isBlack = (validUserId && ((_f = game.blackPlayer) === null || _f === void 0 ? void 0 : _f.toString()) === userId) ||
                (game.blackPlayerName && game.blackPlayerName === username);
            let playerColor = 'white';
            let isSpectator = false;
            if (isWhite) {
                playerColor = 'white';
            }
            else if (isBlack) {
                playerColor = 'black';
            }
            else if (game.status === 'waiting') {
                // Second player joining waiting room!
                if (!game.whitePlayer &&
                    (!game.whitePlayerName || game.whitePlayerName === 'White')) {
                    game.whitePlayer = validUserId;
                    game.whitePlayerName = username;
                    game.whitePlayerRating = rating;
                    playerColor = 'white';
                }
                else {
                    game.blackPlayer = validUserId;
                    game.blackPlayerName = username;
                    game.blackPlayerRating = rating;
                    playerColor = 'black';
                }
                game.status = 'active';
                game.startedAt = new Date();
                game.lastMoveAt = new Date();
                yield game.save();
                armClock(io, game);
                console.log(`[Room] ${username} joined waiting game ${gameId} as ${playerColor}`);
            }
            else {
                // Spectator or read-only view
                isSpectator = true;
                playerColor = 'white';
            }
            // Sync remaining time for reconnecting players on an active game
            if (game.status === 'active' && game.lastMoveAt) {
                (0, clock_service_1.applyElapsedTime)(game);
                yield game.save();
                armClock(io, game);
            }
            else if (game.status === 'active' && !game.lastMoveAt) {
                game.lastMoveAt = new Date();
                yield game.save();
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
                (0, reconnect_service_1.handlePlayerReconnected)(io, gameId, playerColor, username);
            }
            if (isSpectator) {
                addSpectator(io, gameId, socket.id);
            }
            const existingGame = (0, chess_service_1.getChessGame)(gameId);
            if (!existingGame) {
                (0, chess_service_2.createChessGame)(gameId, game.currentPosition);
            }
            const clock = (0, clock_service_1.clockPayload)(game);
            const spectatorCount = getSpectatorCount(gameId);
            const gameStatePayload = {
                gameId: game._id.toString(),
                color: playerColor,
                isPassAndPlay: game.isPassAndPlay || false,
                whitePlayer: ((_g = game.whitePlayer) === null || _g === void 0 ? void 0 : _g.toString()) || '',
                blackPlayer: ((_h = game.blackPlayer) === null || _h === void 0 ? void 0 : _h.toString()) || '',
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
            socket.emit('reconnected', Object.assign({ gameId, color: playerColor, isSpectator,
                spectatorCount, status: game.status }, clock));
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
            console.log(`${username} (${userId}) joined game ${gameId} as ${playerColor}`);
        }
        catch (error) {
            console.error('Join game error:', error);
            socket.emit('gameError', {
                message: 'Failed to join game',
            });
        }
    }));
    // Socket for MakeMove
    socket.on('makeMove', (data) => __awaiter(void 0, void 0, void 0, function* () {
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
            const game = yield game_model_1.gameModel.findById(gameId);
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
            (0, clock_service_1.applyElapsedTime)(game);
            if ((0, clock_service_1.isTimedOut)(game)) {
                const loser = game.turn;
                const winner = loser === 'white' ? 'black' : 'white';
                if (loser === 'white')
                    game.whiteTime = 0;
                else
                    game.blackTime = 0;
                game.status = 'completed';
                game.result = winner;
                game.endedAt = new Date();
                yield game.save();
                (0, clock_service_1.clearGameTimeout)(gameId);
                (0, stats_service_1.recordCompletedGameStats)(game);
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
            const result = (0, chess_service_3.makeChessMove)(gameId, from, to, promotion);
            if (!result.success) {
                // Persist clock deduction even on illegal move attempt
                yield game.save();
                socket.emit('invalidMove', {
                    message: result.message,
                });
                return;
            }
            const movedColor = game.turn;
            (0, clock_service_1.applyIncrement)(game, movedColor);
            // Save move
            game.moves.push(result.move.san);
            game.currentPosition = result.fen;
            game.turn = result.turn;
            game.lastMoveAt = new Date();
            // Check game over
            if (result.isGameOver) {
                game.status = 'completed';
                game.endedAt = new Date();
                (0, clock_service_1.clearGameTimeout)(gameId);
                if (result.isCheckmate) {
                    game.result = result.turn === 'white' ? 'black' : 'white';
                }
                else {
                    game.result = 'draw';
                }
            }
            yield game.save();
            if (game.status === 'completed') {
                (0, stats_service_1.recordCompletedGameStats)(game);
            }
            if (game.status === 'active') {
                armClock(io, game);
            }
            const clock = (0, clock_service_1.clockPayload)(game);
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
        }
        catch (error) {
            console.error('Move error:', error);
            socket.emit('gameError', {
                message: 'Failed to make move',
            });
        }
    }));
    // --- RESIGN HANDLER ---
    socket.on('resign', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { gameId } = data;
            if (socket.data.gameId !== gameId)
                return;
            if (socket.data.isSpectator)
                return;
            const game = yield game_model_1.gameModel.findById(gameId);
            if (!game || game.status !== 'active')
                return;
            const resigningColor = socket.data.color;
            const winner = resigningColor === 'white' ? 'black' : 'white';
            (0, clock_service_1.applyElapsedTime)(game);
            game.status = 'completed';
            game.result = winner;
            game.endedAt = new Date();
            yield game.save();
            (0, clock_service_1.clearGameTimeout)(gameId);
            (0, reconnect_service_1.clearAllPendingForGame)(gameId);
            (0, stats_service_1.recordCompletedGameStats)(game);
            io.to(`game:${gameId}`).emit('gameOver', {
                result: winner,
                reason: 'resignation',
                winner,
                whiteTime: game.whiteTime,
                blackTime: game.blackTime,
            });
            console.log(`[Game] ${resigningColor} resigned in game ${gameId}`);
        }
        catch (err) {
            console.error('Resign error:', err);
        }
    }));
    // --- OFFER DRAW HANDLER ---
    socket.on('offerDraw', (data) => {
        const { gameId } = data;
        if (socket.data.gameId !== gameId)
            return;
        if (socket.data.isSpectator)
            return;
        // Broadcast draw offer to the opponent
        socket.to(`game:${gameId}`).emit('drawOffered', {
            byColor: socket.data.color,
        });
        console.log(`[Game] ${socket.data.color} offered draw in game ${gameId}`);
    });
    // --- RESPOND TO DRAW HANDLER ---
    socket.on('respondDraw', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { gameId, accept } = data;
            if (socket.data.gameId !== gameId)
                return;
            if (socket.data.isSpectator)
                return;
            if (accept) {
                const game = yield game_model_1.gameModel.findById(gameId);
                if (!game || game.status !== 'active')
                    return;
                (0, clock_service_1.applyElapsedTime)(game);
                game.status = 'completed';
                game.result = 'draw';
                game.endedAt = new Date();
                yield game.save();
                (0, clock_service_1.clearGameTimeout)(gameId);
                (0, reconnect_service_1.clearAllPendingForGame)(gameId);
                (0, stats_service_1.recordCompletedGameStats)(game);
                io.to(`game:${gameId}`).emit('gameOver', {
                    result: 'draw',
                    reason: 'agreement',
                    whiteTime: game.whiteTime,
                    blackTime: game.blackTime,
                });
                console.log(`[Game] Draw agreed in game ${gameId}`);
            }
            else {
                // Notify the offering player that draw was declined
                socket.to(`game:${gameId}`).emit('drawDeclined');
            }
        }
        catch (err) {
            console.error('Respond draw error:', err);
        }
    }));
    // --- ABORT GAME HANDLER ---
    socket.on('abortGame', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { gameId } = data;
            if (socket.data.gameId !== gameId)
                return;
            if (socket.data.isSpectator)
                return;
            const game = yield game_model_1.gameModel.findById(gameId);
            if (!game)
                return;
            // Can only abort if no moves have been made
            if (game.moves.length > 0) {
                socket.emit('gameError', {
                    message: 'Cannot abort a game that has already started',
                });
                return;
            }
            game.status = 'aborted';
            game.endedAt = new Date();
            yield game.save();
            (0, clock_service_1.clearGameTimeout)(gameId);
            (0, reconnect_service_1.clearAllPendingForGame)(gameId);
            io.to(`game:${gameId}`).emit('gameOver', {
                result: 'none',
                reason: 'aborted',
            });
            console.log(`[Game] Game ${gameId} aborted by ${socket.data.color}`);
        }
        catch (err) {
            console.error('Abort game error:', err);
        }
    }));
    // ─── TIMEOUT HANDLER (client hint — server re-validates authoritatively) ───
    socket.on('gameTimeout', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { gameId, winner, loser } = data;
            if (socket.data.gameId !== gameId) {
                return;
            }
            yield (0, clock_service_1.handleAuthoritativeTimeout)(io, gameId, loser, winner);
        }
        catch (err) {
            console.error('Timeout error:', err);
        }
    }));
    // ─── LEAVE GAME HANDLER ──────────────────────────────────────────────────
    socket.on('leaveGame', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const gameId = (data === null || data === void 0 ? void 0 : data.gameId) || socket.data.gameId || playerGames.get(socket.id);
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
            const game = yield game_model_1.gameModel.findById(gameId);
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
                yield game_model_1.gameModel.findOneAndUpdate({ _id: gameId, status: 'waiting' }, {
                    $set: {
                        status: 'aborted',
                        result: 'none',
                        endedAt: new Date(),
                    },
                });
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
                yield game_model_1.gameModel.findOneAndUpdate({ _id: gameId, status: 'active' }, {
                    $set: {
                        status: 'completed',
                        endedAt: new Date(),
                    },
                });
                socket.leave(`game:${gameId}`);
                socket.data.gameId = undefined;
                return;
            }
            // Identify leaving color
            let leavingColor = socket.data.color;
            if (!leavingColor) {
                const userId = socket.data.userId;
                if (userId && game.whitePlayer && game.whitePlayer.toString() === userId) {
                    leavingColor = 'white';
                }
                else if (userId && game.blackPlayer && game.blackPlayer.toString() === userId) {
                    leavingColor = 'black';
                }
                else if (socket.data.username && game.whitePlayerName === socket.data.username) {
                    leavingColor = 'white';
                }
                else if (socket.data.username && game.blackPlayerName === socket.data.username) {
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
            (0, clock_service_1.clearGameTimeout)(gameId);
            (0, reconnect_service_1.clearPendingDisconnect)(gameId, leavingColor);
            // Atomically update game in MongoDB to prevent race conditions
            const updatedGame = yield game_model_1.gameModel.findOneAndUpdate({ _id: gameId, status: 'active' }, {
                $set: {
                    status: 'completed',
                    result: winner,
                    endedAt: new Date(),
                },
            }, { new: true });
            if (!updatedGame) {
                // Already finished or modified concurrently
                socket.leave(`game:${gameId}`);
                socket.data.gameId = undefined;
                return;
            }
            (0, stats_service_1.recordCompletedGameStats)(updatedGame);
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
        }
        catch (error) {
            console.error('[Game] leaveGame error:', error);
        }
    }));
};
exports.setupGameSocket = setupGameSocket;
