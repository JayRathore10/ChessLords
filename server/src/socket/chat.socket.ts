
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { gameModel } from '../models/game.model';
import { chatMessageModel } from '../models/chatMessage.model';

type ChatMessageType = 'quick' | 'emoji' | 'custom';
type PlayerColor = 'white' | 'black';

const MESSAGE_TYPES: ChatMessageType[] = ['quick', 'emoji', 'custom'];
const MAX_MESSAGE_LENGTH = 500;
const CHAT_COOLDOWN_MS = 700;

// Track message cooldowns per socket.
const lastMessageAt = new Map<string, number>();

const isValidColor = (color: unknown): color is PlayerColor =>
  color === 'white' || color === 'black';

// Verify that the socket belongs to the player assigned to its color.
const isGamePlayer = (
  socket: Socket,
  game: {
    whitePlayer?: mongoose.Types.ObjectId;
    blackPlayer?: mongoose.Types.ObjectId;
    whitePlayerName?: string;
    blackPlayerName?: string;
  }
): boolean => {
  const color = socket.data.color;
  const userId = String(socket.data.userId || '');
  const username = String(socket.data.username || '');

  if (!isValidColor(color)) return false;

  const playerId =
    color === 'white' ? game.whitePlayer : game.blackPlayer;

  const playerName =
    color === 'white' ? game.whitePlayerName : game.blackPlayerName;

  const idMatches =
    !!playerId &&
    mongoose.Types.ObjectId.isValid(userId) &&
    playerId.toString() === userId;

  const nameMatches =
    !!playerName &&
    !!username &&
    playerName === username;

  return idMatches || nameMatches;
};

export const setupChatSocket = (io: Server, socket: Socket) => {
  // SEND CHAT MESSAGE
  socket.on(
    'sendMessage',
    async (data: {
      gameId: string;
      message: string;
      messageType?: ChatMessageType;
    }) => {
      try {
        const { gameId, message, messageType = 'custom' } = data || {};

        if (
          typeof gameId !== 'string' ||
          !mongoose.Types.ObjectId.isValid(gameId) ||
          typeof message !== 'string'
        ) {
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

        const game = await gameModel.findById(gameId);

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

        const color = socket.data.color as PlayerColor;

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

        const senderId =
          color === 'white' ? game.whitePlayer : game.blackPlayer;

        const senderName =
          color === 'white'
            ? game.whitePlayerName || 'White'
            : game.blackPlayerName || 'Black';

        // Save the message to MongoDB.
        const chatMessage = await chatMessageModel.create({
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
          senderId: senderId?.toString(),
          senderColor: color,
          senderName,
          message: text,
          messageType,
          createdAt: chatMessage.createdAt,
        };

        // Send to both players in the game room.
        io.to(`game:${gameId}`).emit('newMessage', messagePayload);

        console.log(
          `[Chat] ${senderName} (${color}) sent ${messageType} message in game ${gameId}`
        );
      } catch (error) {
        console.error('[Chat] Send message error:', error);

        socket.emit('chatError', {
          message: 'Failed to send message',
        });
      }
    }
  );

  // GET CHAT HISTORY
  socket.on(
    'getChatHistory',
    async (data: { gameId: string }) => {
      try {
        const { gameId } = data || {};

        if (
          typeof gameId !== 'string' ||
          !mongoose.Types.ObjectId.isValid(gameId)
        ) {
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

        const game = await gameModel.findById(gameId);

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
        const messages = await chatMessageModel
          .find({ gameId: game._id })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();

        socket.emit('chatHistory', messages.reverse());
      } catch (error) {
        console.error('[Chat] Get history error:', error);

        socket.emit('chatError', {
          message: 'Failed to load chat history',
        });
      }
    }
  );

  socket.on('disconnect', () => {
    lastMessageAt.delete(socket.id);
  });
};