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
const chess_service_1 = require("../services/chess.service");
const game_model_1 = require("../models/game.model");
const chess_service_2 = require("../services/chess.service");
const mongoose_1 = __importDefault(require("mongoose"));
const chess_service_3 = require("../services/chess.service");
const playerGames = new Map();
const setupGameSocket = (io, socket) => {
    // Socket for JoinGame
    socket.on('joinGame', (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        try {
            const { gameId, userId = 'guest', username = 'Guest', rating = 1200, } = data;
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
                socket.data.userId = userId;
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
                    whitePlayer: ((_a = game.whitePlayer) === null || _a === void 0 ? void 0 : _a.toString()) || 'player1',
                    blackPlayer: ((_b = game.blackPlayer) === null || _b === void 0 ? void 0 : _b.toString()) || 'player2',
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
            const isWhite = (validUserId && ((_c = game.whitePlayer) === null || _c === void 0 ? void 0 : _c.toString()) === userId) ||
                (game.whitePlayerName && game.whitePlayerName === username);
            const isBlack = (validUserId && ((_d = game.blackPlayer) === null || _d === void 0 ? void 0 : _d.toString()) === userId) ||
                (game.blackPlayerName && game.blackPlayerName === username);
            let playerColor = 'white';
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
                yield game.save();
                console.log(`[Room] ${username} joined waiting game ${gameId} as ${playerColor}`);
            }
            else {
                // Spectator or read-only view
                playerColor = 'white';
            }
            socket.join(`game:${gameId}`);
            socket.data.userId = userId;
            socket.data.gameId = gameId;
            socket.data.color = playerColor;
            socket.data.username = username;
            playerGames.set(socket.id, gameId);
            const existingGame = (0, chess_service_1.getChessGame)(gameId);
            if (!existingGame) {
                (0, chess_service_2.createChessGame)(gameId, game.currentPosition);
            }
            const gameStatePayload = {
                gameId: game._id.toString(),
                color: playerColor,
                isPassAndPlay: game.isPassAndPlay || false,
                whitePlayer: ((_e = game.whitePlayer) === null || _e === void 0 ? void 0 : _e.toString()) || '',
                blackPlayer: ((_f = game.blackPlayer) === null || _f === void 0 ? void 0 : _f.toString()) || '',
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
                whiteTime: game.whiteTime,
                blackTime: game.blackTime,
                inviteCode: game.inviteCode,
            };
            // Notify this player
            socket.emit('gameState', gameStatePayload);
            // Notify other players in room about updated state / player joined
            socket.to(`game:${gameId}`).emit('playerJoined', {
                gameId,
                joinedColor: playerColor,
                username,
                rating,
                status: game.status,
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
            // Make chess move
            const result = (0, chess_service_3.makeChessMove)(gameId, from, to, promotion);
            if (!result.success) {
                socket.emit('invalidMove', {
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
                game.status = 'completed';
                game.endedAt = new Date();
                if (result.isCheckmate) {
                    game.result = result.turn === 'white' ? 'black' : 'white';
                }
                else {
                    game.result = 'draw';
                }
            }
            yield game.save();
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
            const game = yield game_model_1.gameModel.findById(gameId);
            if (!game || game.status !== 'active')
                return;
            const resigningColor = socket.data.color;
            const winner = resigningColor === 'white' ? 'black' : 'white';
            game.status = 'completed';
            game.result = winner;
            game.endedAt = new Date();
            yield game.save();
            io.to(`game:${gameId}`).emit('gameOver', {
                result: winner,
                reason: 'resignation',
                winner,
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
            if (accept) {
                const game = yield game_model_1.gameModel.findById(gameId);
                if (!game || game.status !== 'active')
                    return;
                game.status = 'completed';
                game.result = 'draw';
                game.endedAt = new Date();
                yield game.save();
                io.to(`game:${gameId}`).emit('gameOver', {
                    result: 'draw',
                    reason: 'agreement',
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
    // ─── TIMEOUT HANDLER ───────────────────────────────────────────────────────
    socket.on('gameTimeout', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { gameId, winner, loser } = data;
            // Make sure this socket belongs to this game
            if (socket.data.gameId !== gameId) {
                return;
            }
            const game = yield game_model_1.gameModel.findById(gameId);
            if (!game || game.status !== 'active') {
                return;
            }
            // Make sure the reported loser is actually the player
            // whose turn it currently is.
            if (game.turn !== loser) {
                return;
            }
            // Set the expired player's clock to zero
            if (loser === 'white') {
                game.whiteTime = 0;
            }
            else {
                game.blackTime = 0;
            }
            // End the game
            game.status = 'completed';
            game.result = winner;
            game.endedAt = new Date();
            yield game.save();
            // Tell both players
            io.to(`game:${gameId}`).emit('gameOver', {
                result: winner,
                reason: 'timeout',
                winner,
            });
            console.log(`[Game] ${loser} ran out of time in game ${gameId}. ${winner} wins.`);
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
                socket.leave(`game:${gameId}`);
                socket.data.gameId = undefined;
                return;
            }
            const winner = leavingColor === 'white' ? 'black' : 'white';
            const loser = leavingColor;
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
