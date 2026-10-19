import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
// @ts-ignore
import xss from "xss-clean";
import { Server } from "socket.io";
import { FRONTEND } from "./configs/env.config";
import { Request, Response } from "express";
import gameRoutes from "./routes/game.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import { connectDB } from "./configs/db.config";
import { setupSocket } from "./socket/socket";

const app = express();

// 1. Security HTTP headers
// Disable the strict cross-origin policy so profile images can still be loaded by the frontend
app.use(helmet({
  crossOriginResourcePolicy: false, 
}));

app.use(
  cors({
    origin: FRONTEND || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({extended : true}));

// 2. Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// 3. Data Sanitization against XSS (Cross-Site Scripting)
app.use(xss());

// Static images route
app.use(
  "/images",
  express.static("public/images", {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);
app.use(cookieParser());

// Routes
app.use("/api/v1/games", gameRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

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

app.get("/", (req: Request, res: Response) => {  
  res.json({
    message: "ChessLord server is running",
  });
});

httpServer.listen(5000, () => {
  connectDB();
  console.log("ChessLord server running on http://localhost:5000");
});