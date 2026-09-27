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
exports.setupMatchmakingSocket = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const game_model_1 = require("../models/game.model");
const chess_service_1 = require("../services/chess.service");
const matchmakingQueue = [];
// Helper to remove a socket from matchmaking queue
const removeFromQueue = (socketId) => {
    const index = matchmakingQueue.findIndex((p) => p.socketId === socketId);
    if (index !== -1) {
        const removed = matchmakingQueue.splice(index, 1)[0];
        console.log(`[Queue] Removed ${removed.username} (${socketId}) from queue`);
        return true;
    }
    return false;
};
const setupMatchmakingSocket = (io, socket) => {
    socket.on("joinQueue", (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { userId = socket.id, username = `Player_${socket.id.slice(0, 4)}`, rating = 1200, gameType = "casual", timeControl, } = data;
            // Clean up any existing queue entry for this socket
            removeFromQueue(socket.id);
            console.log(`[Queue] ${username} (${rating}) searching for ${timeControl.initialTime}+${timeControl.increment} (${gameType})`);
            const now = Date.now();
            // Search for a matching opponent in queue
            // Criteria: same time control initialTime & increment, same gameType, not self
            const matchIndex = matchmakingQueue.findIndex((candidate) => {
                if (candidate.socketId === socket.id || candidate.userId === userId) {
                    return false;
                }
                if (candidate.timeControl.initialTime !== timeControl.initialTime ||
                    candidate.timeControl.increment !== timeControl.increment) {
                    return false;
                }
                if (candidate.gameType !== gameType) {
                    return false;
                }
                // Expand rating tolerance over wait duration
                const waitSeconds = (now - candidate.joinedAt) / 1000;
                const ratingTolerance = Math.min(600, 200 + waitSeconds * 20);
                const ratingDiff = Math.abs(candidate.rating - rating);
                return ratingDiff <= ratingTolerance;
            });
            if (matchIndex !== -1) {
                // Found opponent! Pair them up!
                const opponent = matchmakingQueue.splice(matchIndex, 1)[0];
                const opponentSocket = io.sockets.sockets.get(opponent.socketId);
                // Randomize who plays White / Black
                const isCurrentWhite = Math.random() < 0.5;
                const whitePlayerInfo = isCurrentWhite
                    ? { id: userId, name: username, rating, socketId: socket.id }
                    : {
                        id: opponent.userId,
                        name: opponent.username,
                        rating: opponent.rating,
                        socketId: opponent.socketId,
                    };
                const blackPlayerInfo = isCurrentWhite
                    ? {
                        id: opponent.userId,
                        name: opponent.username,
                        rating: opponent.rating,
                        socketId: opponent.socketId,
                    }
                    : { id: userId, name: username, rating, socketId: socket.id };
                const validWhiteId = mongoose_1.default.Types.ObjectId.isValid(whitePlayerInfo.id)
                    ? new mongoose_1.default.Types.ObjectId(whitePlayerInfo.id)
                    : undefined;
                const validBlackId = mongoose_1.default.Types.ObjectId.isValid(blackPlayerInfo.id)
                    ? new mongoose_1.default.Types.ObjectId(blackPlayerInfo.id)
                    : undefined;
                // Create Game in DB
                const newGame = yield game_model_1.gameModel.create({
                    whitePlayer: validWhiteId,
                    blackPlayer: validBlackId,
                    whitePlayerName: whitePlayerInfo.name,
                    blackPlayerName: blackPlayerInfo.name,
                    whitePlayerRating: whitePlayerInfo.rating,
                    blackPlayerRating: blackPlayerInfo.rating,
                    gameType,
                    status: "active",
                    result: "none",
                    moves: [],
                    currentPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    turn: "white",
                    timeControl,
                    whiteTime: timeControl.initialTime,
                    blackTime: timeControl.initialTime,
                    startedAt: new Date(),
                });
                const gameId = newGame._id.toString();
                (0, chess_service_1.createChessGame)(gameId, newGame.currentPosition);
                // Join sockets to game room
                socket.join(`game:${gameId}`);
                socket.data.userId = userId;
                socket.data.gameId = gameId;
                socket.data.color = isCurrentWhite ? "white" : "black";
                if (opponentSocket) {
                    opponentSocket.join(`game:${gameId}`);
                    opponentSocket.data.userId = opponent.userId;
                    opponentSocket.data.gameId = gameId;
                    opponentSocket.data.color = isCurrentWhite ? "black" : "white";
                }
                console.log(`[Matchmaker] Match Found! Game: ${gameId} between ${whitePlayerInfo.name} (W) and ${blackPlayerInfo.name} (B)`);
                // Emit matchFound to both players
                socket.emit("matchFound", {
                    gameId,
                    color: socket.data.color,
                    timeControl,
                    gameType,
                    whitePlayer: {
                        id: whitePlayerInfo.id,
                        name: whitePlayerInfo.name,
                        rating: whitePlayerInfo.rating,
                    },
                    blackPlayer: {
                        id: blackPlayerInfo.id,
                        name: blackPlayerInfo.name,
                        rating: blackPlayerInfo.rating,
                    },
                    opponent: {
                        id: opponent.userId,
                        name: opponent.username,
                        rating: opponent.rating,
                    },
                });
                if (opponentSocket) {
                    opponentSocket.emit("matchFound", {
                        gameId,
                        color: opponentSocket.data.color,
                        timeControl,
                        gameType,
                        whitePlayer: {
                            id: whitePlayerInfo.id,
                            name: whitePlayerInfo.name,
                            rating: whitePlayerInfo.rating,
                        },
                        blackPlayer: {
                            id: blackPlayerInfo.id,
                            name: blackPlayerInfo.name,
                            rating: blackPlayerInfo.rating,
                        },
                        opponent: {
                            id: userId,
                            name: username,
                            rating,
                        },
                    });
                }
            }
            else {
                // No match yet, enqueue player
                matchmakingQueue.push({
                    socketId: socket.id,
                    userId,
                    username,
                    rating,
                    gameType,
                    timeControl,
                    joinedAt: now,
                });
                socket.emit("queueJoined", {
                    success: true,
                    timeControl,
                    gameType,
                    queuePosition: matchmakingQueue.length,
                });
            }
        }
        catch (err) {
            console.error("Matchmaking error:", err);
            socket.emit("queueError", { message: "Error joining matchmaking queue" });
        }
    }));
    socket.on("leaveQueue", () => {
        const removed = removeFromQueue(socket.id);
        if (removed) {
            socket.emit("queueLeft", { success: true });
        }
    });
};
exports.setupMatchmakingSocket = setupMatchmakingSocket;
