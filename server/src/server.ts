import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { getChessGame , createChessGame, makeChessMove } from "./services/chess.service";
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

  socket.on("joinGame", (gameId: string) => {
    socket.join(`game:${gameId}`);

    const existingGame = getChessGame(gameId);

    if (!existingGame) {
      createChessGame(gameId);
    }

    console.log(
      `${socket.id} joined game:${gameId}`
    );

    socket.emit("joinedGame", {
      gameId,
    });
  });

  socket.on("makeMove", (data) => {
    const {
      gameId,
      from,
      to,
    } = data;

    console.log(
      `Move request: ${from} → ${to}`
    );

    const result = makeChessMove(
      gameId,
      from,
      to
    );

    // Illegal move
    if (!result.success) {
      socket.emit("invalidMove", {
        message: result.message,
      });

      return;
    }

    // Legal move
    io.to(`game:${gameId}`).emit(
      "moveMade",
      {
        from,
        to,
        move: result.move,
        fen: result.fen,
        turn: result.turn,
        isCheck: result.isCheck,
        isCheckmate: result.isCheckmate,
        isDraw: result.isDraw,
        isGameOver: result.isGameOver,
      }
    );
  });

  socket.on("disconnect", () => {
    console.log(
      "Player disconnected:",
      socket.id
    );
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