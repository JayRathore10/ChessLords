import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { getChessGame, createChessGame, makeChessMove } from "./services/chess.service";
import { FRONTEND } from "./configs/env.config";
import { Request, Response } from "express";
import { gameModel } from "./models/game.model";
import gameRoutes from "./routes/game.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import { connectDB } from "./configs/db.config";
import { setupSocket } from "./socket/socket";

const app = express();

app.use(
  cors({
    origin: FRONTEND || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({extended : true}));
// app.use("/images", express.static("public/images"));
app.use(
  "/images",
  express.static("public/images", {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);
app.use(cookieParser());

app.use("/api/v1/games", gameRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hi, Jexts here!")
})

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND || "http://localhost:3000",
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
});

interface MatchQueuePlayer {
  socketId: string;
  userId: string;
  username: string;
  rating: number;
  gameType: "casual" | "rated";
  timeControl: {
    initialTime: number;
    increment: number;
    name?: string;
  };
  joinedAt: number;
}

const matchmakingQueue: MatchQueuePlayer[] = [];

// Helper to remove a socket from matchmaking queue
const removeFromQueue = (socketId: string) => {
  const index = matchmakingQueue.findIndex((p) => p.socketId === socketId);
  if (index !== -1) {
    const removed = matchmakingQueue.splice(index, 1)[0];
    console.log(`[Queue] Removed ${removed.username} (${socketId}) from queue`);
    return true;
  }
  return false;
};

setupSocket(io); 

app.get("/", (req, res) => {  
  res.json({
    message: "ChessLord server is running",
  });
});

httpServer.listen(5000, () => {
  connectDB();
  console.log("ChessLord server running on http://localhost:5000");
});