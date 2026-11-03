import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import { chatMessageModel } from "../models/chatMessage.model"; // Ensure this matches your file name
import { filterProfanity } from "../utils/profanity.util";

export const setupChatSocket = (io: Server, socket: Socket) => {
  
  // 1. Fetch Chat History
  socket.on("getChatHistory", async (data: { gameId: string }) => {
    try {
      if (!data.gameId || !mongoose.Types.ObjectId.isValid(data.gameId)) return;
      
      const history = await chatMessageModel
        .find({ gameId: new mongoose.Types.ObjectId(data.gameId) })
        .sort({ createdAt: 1 })
        .limit(100); // Limit to last 100 messages for performance
        
      socket.emit("chatHistory", history);
    } catch (err) {
      console.error("[Chat] Fetch history error:", err);
    }
  });

  // 2. Send New Message
  socket.on(
    "sendMessage",
    async (data: { gameId: string; message: string; messageType: "quick" | "emoji" | "custom" }) => {
      try {
        const { gameId, message, messageType } = data;

        if (!gameId || !mongoose.Types.ObjectId.isValid(gameId)) {
          socket.emit("chatError", { message: "Invalid game ID." });
          return;
        }

        // Spectators are not allowed to chat in this implementation
        if (socket.data.isSpectator) {
          socket.emit("chatError", { message: "Spectators cannot send messages." });
          return;
        }

        // Apply profanity filter only to custom typed messages
        const cleanMessage = messageType === "custom" ? filterProfanity(message) : message;

        const validSenderId = socket.data.userId && mongoose.Types.ObjectId.isValid(socket.data.userId)
          ? new mongoose.Types.ObjectId(socket.data.userId)
          : undefined;

        const newMessage = await chatMessageModel.create({
          gameId: new mongoose.Types.ObjectId(gameId),
          senderId: validSenderId,
          senderColor: socket.data.color,
          senderName: socket.data.username || "Player",
          message: cleanMessage,
          messageType,
        });

        // Broadcast to everyone else in the game room
        socket.to(`game:${gameId}`).emit("newMessage", newMessage);
      } catch (err) {
        console.error("[Chat] Send message error:", err);
        socket.emit("chatError", { message: "Failed to send message." });
      }
    }
  );
};