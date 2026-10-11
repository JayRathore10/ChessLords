import { Server } from "socket.io";
import { setupMatchmakingSocket } from "./matchmaking.socket";
import { handleGameDisconnect, setupGameSocket } from "./game.socket";
import { setupChatSocket } from "./chat.socket";
import { socketAuthMiddleware } from "../middleware/socketAuth.middleware";

export const setupSocket = (io: Server) => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const identity = socket.data.authenticated
      ? `${socket.data.username} (${socket.data.userId})`
      : "guest";
    console.log(`Player connected: ${socket.id} as ${identity}`);

    setupMatchmakingSocket(io, socket);
    setupGameSocket(io, socket);
    setupChatSocket(io, socket);

    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);
      void handleGameDisconnect(io, socket);
    });
  });
};