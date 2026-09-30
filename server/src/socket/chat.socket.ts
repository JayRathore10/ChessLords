import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { gameModel } from '../models/game.model';
import { chatMessageModel } from '../models/chatMessage.model';

export const setupChatSocket = (io: Server, socket: Socket) => {
  // ─────────────────────────────────────────────────────────────
  // SEND CHAT MESSAGE
  // ─────────────────────────────────────────────────────────────
  socket.on(
    'sendMessage',
    async (data: {
      gameId: string;
      message: string;
    }) => {
      try {
        const { gameId, message } = data;

        // Basic validation
        if (!gameId || !message) {
          return;
        }

        const text = message.trim();

        // Don't allow empty messages
        if (!text) {
          return;
        }

        // Maximum message length
        if (text.length > 500) {
          socket.emit('chatError', {
            message: 'Message cannot exceed 500 characters',
          });
          return;
        }

        // Make sure this socket is actually inside this game
        if (socket.data.gameId !== gameId) {
          socket.emit('chatError', {
            message: 'You are not in this game',
          });
          return;
        }

        // Get game
        const game = await gameModel.findById(gameId);

        if (!game) {
          socket.emit('chatError', {
            message: 'Game not found',
          });
          return;
        }

        // Don't allow chat in aborted games
        if (game.status === 'aborted') {
          socket.emit('chatError', {
            message: 'This game has been aborted',
          });
          return;
        }

        // Get player information from socket
        const userId = socket.data.userId;
        const username = socket.data.username || 'Guest';
        const color = socket.data.color as 'white' | 'black';

        // Pass & Play
        // There are two players on the same device,
        // so chat doesn't really make sense.
        if (game.isPassAndPlay) {
          socket.emit('chatError', {
            message: 'Chat is not available in Pass & Play games',
          });
          return;
        }

        // Make sure the player has a valid color
        if (color !== 'white' && color !== 'black') {
          socket.emit('chatError', {
            message: 'You are not a player in this game',
          });
          return;
        }

        // Verify that this player actually belongs to the game
        let isPlayer = false;

        if (
          userId &&
          mongoose.Types.ObjectId.isValid(userId)
        ) {
          if (
            color === 'white' &&
            game.whitePlayer?.toString() === userId
          ) {
            isPlayer = true;
          }

          if (
            color === 'black' &&
            game.blackPlayer?.toString() === userId
          ) {
            isPlayer = true;
          }
        }

        // Also support your username-based player matching
        if (color === 'white' && game.whitePlayerName === username) {
          isPlayer = true;
        }

        if (color === 'black' && game.blackPlayerName === username) {
          isPlayer = true;
        }

        if (!isPlayer) {
          socket.emit('chatError', {
            message: 'You are not a player in this game',
          });
          return;
        }

        // Save message to MongoDB
        const chatMessage = await chatMessageModel.create({
          gameId: game._id,

          senderId:
            userId && mongoose.Types.ObjectId.isValid(userId)
              ? new mongoose.Types.ObjectId(userId)
              : undefined,

          senderColor: color,

          senderName: username,

          message: text,
        });

        // Send the message to everyone in the game room
        io.to(`game:${gameId}`).emit('newMessage', {
          _id: chatMessage._id.toString(),
          gameId: game._id.toString(),
          senderId: userId,
          senderColor: color,
          senderName: username,
          message: text,
          createdAt: chatMessage.createdAt,
        });

        console.log(
          `[Chat] ${username} (${color}) sent message in game ${gameId}`
        );
      } catch (error) {
        console.error('[Chat] Send message error:', error);

        socket.emit('chatError', {
          message: 'Failed to send message',
        });
      }
    }
  );

  // ─────────────────────────────────────────────────────────────
  // GET CHAT HISTORY
  // ─────────────────────────────────────────────────────────────
  socket.on(
    'getChatHistory',
    async (data: { gameId: string }) => {
      try {
        const { gameId } = data;

        if (!gameId) {
          return;
        }

        // Make sure socket belongs to this game
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

        // Get last 100 messages
        const messages = await chatMessageModel
          .find({ gameId: game._id })
          .sort({ createdAt: 1 })
          .limit(100)
          .lean();

        socket.emit('chatHistory', messages);
      } catch (error) {
        console.error('[Chat] Get history error:', error);

        socket.emit('chatError', {
          message: 'Failed to load chat history',
        });
      }
    }
  );
};