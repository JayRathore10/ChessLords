import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { FRONTEND } from "./configs/env.config";

const app = express();

app.use(
  cors({
    origin: FRONTEND,
    credentials: true,
  })
);

app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Join chess game
  socket.on("joinGame", (gameId: string) => {
    socket.join(`game:${gameId}`);

    console.log(`${socket.id} joined game:${gameId}`);

    socket.emit("joinedGame", {
      gameId,
    });
  });

  // Make chess move
  socket.on("makeMove", (data) => {
    const { gameId, from, to } = data;

    console.log(`Move in ${gameId}: ${from} → ${to}`);

    // Send the move to both players in the game
    io.to(`game:${gameId}`).emit("moveMade", {
      from,
      to,
    });
  });

  // Player disconnected
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "ChessLord server is running",
  });
});

httpServer.listen(5000, () => {
  console.log("ChessLord server running on http://localhost:5000");
});