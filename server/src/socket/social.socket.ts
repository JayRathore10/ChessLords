import { Server, Socket } from "socket.io";
import { userModel } from "../models/user.model";

// Map to track userId -> socketId for direct messaging
export const onlineUsers = new Map<string, string>();

export const setupSocialSocket = (io: Server, socket: Socket) => {
  const userId = socket.data.userId;

  if (userId) {
    onlineUsers.set(userId, socket.id);
    
    // Broadcast to everyone that this user came online
    socket.broadcast.emit("userStatusChanged", { userId, isOnline: true });
    
    // Optionally update DB status
    userModel.findByIdAndUpdate(userId, { isOnline: true }).catch(() => {});
  }

  // --- FRIEND CHALLENGES ---
  socket.on("challengeFriend", (data: { targetUserId: string; timeControl: any; format: string }) => {
    const targetSocketId = onlineUsers.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incomingChallenge", {
        challengerId: userId,
        challengerName: socket.data.username,
        timeControl: data.timeControl,
        format: data.format,
      });
    } else {
      socket.emit("socialError", { message: "Player is offline." });
    }
  });

  socket.on("respondChallenge", (data: { challengerId: string; accept: boolean; gameId?: string }) => {
    const challengerSocketId = onlineUsers.get(data.challengerId);
    if (challengerSocketId) {
      io.to(challengerSocketId).emit("challengeResponse", {
        responderId: userId,
        responderName: socket.data.username,
        accept: data.accept,
        gameId: data.gameId, // If accepted, the responder creates the game and sends the ID back
      });
    }
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    if (userId) {
      onlineUsers.delete(userId);
      socket.broadcast.emit("userStatusChanged", { userId, isOnline: false });
      userModel.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() }).catch(() => {});
    }
  });
};