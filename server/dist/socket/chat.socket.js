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
exports.setupChatSocket = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const game_model_1 = require("../models/game.model");
const chatMessage_model_1 = require("../models/chatMessage.model");
const MESSAGE_TYPES = ['quick', 'emoji', 'custom'];
const MAX_MESSAGE_LENGTH = 500;
const CHAT_COOLDOWN_MS = 700;
// Track message cooldowns per socket.
const lastMessageAt = new Map();
const isValidColor = (color) => color === 'white' || color === 'black';
// Verify that the socket belongs to the player assigned to its color.
const isGamePlayer = (socket, game) => {
    const color = socket.data.color;
    const userId = String(socket.data.userId || '');
    const username = String(socket.data.username || '');
    if (!isValidColor(color))
        return false;
    const playerId = color === 'white' ? game.whitePlayer : game.blackPlayer;
    const playerName = color === 'white' ? game.whitePlayerName : game.blackPlayerName;
    const idMatches = !!playerId &&
        mongoose_1.default.Types.ObjectId.isValid(userId) &&
        playerId.toString() === userId;
    const nameMatches = !!playerName &&
        !!username &&
        playerName === username;
    return idMatches || nameMatches;
};
const setupChatSocket = (io, socket) => {
    // SEND CHAT MESSAGE
    socket.on('sendMessage', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { gameId, message, messageType = 'custom' } = data || {};
            if (typeof gameId !== 'string' ||
                !mongoose_1.default.Types.ObjectId.isValid(gameId) ||
                typeof message !== 'string') {
                socket.emit('chatError', {
                    message: 'Invalid chat message',
                });
                return;
            }
            const text = message.trim();
            if (!text) {
                socket.emit('chatError', {
                    message: 'Message cannot be empty',
                });
                return;
            }
            if (text.length > MAX_MESSAGE_LENGTH) {
                socket.emit('chatError', {
                    message: 'Message cannot exceed 500 characters',
                });
                return;
            }
            if (!MESSAGE_TYPES.includes(messageType)) {
                socket.emit('chatError', {
                    message: 'Invalid message type',
                });
                return;
            }
            // The socket must already have joined this game.
            if (socket.data.gameId !== gameId) {
                socket.emit('chatError', {
                    message: 'You are not in this game',
                });
                return;
            }
            const game = yield game_model_1.gameModel.findById(gameId);
            if (!game) {
                socket.emit('chatError', {
                    message: 'Game not found',
                });
                return;
            }
            // Chat is available only during an active online game.
            if (game.status !== 'active') {
                socket.emit('chatError', {
                    message: 'Chat is available only during an active game',
                });
                return;
            }
            // Pass & Play is a single-device mode.
            if (game.isPassAndPlay) {
                socket.emit('chatError', {
                    message: 'Chat is not available in Pass & Play games',
                });
                return;
            }
            const color = socket.data.color;
            if (!isValidColor(color) || !isGamePlayer(socket, game)) {
                socket.emit('chatError', {
                    message: 'You are not a player in this game',
                });
                return;
            }
            // Prevent rapid repeated messages from the same socket.
            const now = Date.now();
            const lastSentAt = lastMessageAt.get(socket.id) || 0;
            if (now - lastSentAt < CHAT_COOLDOWN_MS) {
                socket.emit('chatError', {
                    message: 'Please wait before sending another message',
                });
                return;
            }
            lastMessageAt.set(socket.id, now);
            const senderId = color === 'white' ? game.whitePlayer : game.blackPlayer;
            const senderName = color === 'white'
                ? game.whitePlayerName || 'White'
                : game.blackPlayerName || 'Black';
            // Save the message to MongoDB.
            const chatMessage = yield chatMessage_model_1.chatMessageModel.create({
                gameId: game._id,
                senderId,
                senderColor: color,
                senderName,
                message: text,
                messageType,
            });
            const messagePayload = {
                _id: chatMessage._id.toString(),
                gameId: game._id.toString(),
                senderId: senderId === null || senderId === void 0 ? void 0 : senderId.toString(),
                senderColor: color,
                senderName,
                message: text,
                messageType,
                createdAt: chatMessage.createdAt,
            };
            // Send to both players in the game room.
            io.to(`game:${gameId}`).emit('newMessage', messagePayload);
            console.log(`[Chat] ${senderName} (${color}) sent ${messageType} message in game ${gameId}`);
        }
        catch (error) {
            console.error('[Chat] Send message error:', error);
            socket.emit('chatError', {
                message: 'Failed to send message',
            });
        }
    }));
    // GET CHAT HISTORY
    socket.on('getChatHistory', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { gameId } = data || {};
            if (typeof gameId !== 'string' ||
                !mongoose_1.default.Types.ObjectId.isValid(gameId)) {
                socket.emit('chatError', {
                    message: 'Invalid game ID',
                });
                return;
            }
            if (socket.data.gameId !== gameId) {
                socket.emit('chatError', {
                    message: 'You are not in this game',
                });
                return;
            }
            const game = yield game_model_1.gameModel.findById(gameId);
            if (!game) {
                socket.emit('chatError', {
                    message: 'Game not found',
                });
                return;
            }
            if (game.isPassAndPlay || !isGamePlayer(socket, game)) {
                socket.emit('chatError', {
                    message: 'You are not allowed to view this chat',
                });
                return;
            }
            // Fetch the newest 100 messages, then return them oldest first.
            const messages = yield chatMessage_model_1.chatMessageModel
                .find({ gameId: game._id })
                .sort({ createdAt: -1 })
                .limit(100)
                .lean();
            socket.emit('chatHistory', messages.reverse());
        }
        catch (error) {
            console.error('[Chat] Get history error:', error);
            socket.emit('chatError', {
                message: 'Failed to load chat history',
            });
        }
    }));
    socket.on('disconnect', () => {
        lastMessageAt.delete(socket.id);
    });
};
exports.setupChatSocket = setupChatSocket;
