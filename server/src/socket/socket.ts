import { Server } from "socket.io";
import { setupMatchmakingSocket } from "./matchmaking.socket";
import { setupGameSocket } from "./game.socket";

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    setupMatchmakingSocket(io, socket);
    setupGameSocket(io, socket);

    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);
    });
  });
};