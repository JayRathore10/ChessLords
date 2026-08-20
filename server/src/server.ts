import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { getChessGame, createChessGame, makeChessMove } from "./services/chess.service";
import { FRONTEND } from "./configs/env.config";
import { Request, Response } from "express";
import { gameModel } from "./models/game.model";
import gameRoutes from "./routes/game.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(
  cors({
    origin: FRONTEND,
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/v1/games", gameRoutes);
app.use("/api/v1/auth", authRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hi, Jexts here!")
})

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

  socket.on(
    "joinGame",
    async (data: {
      gameId: string;
      userId: string;
    }) => {
      try {
        const {
          gameId,
          userId,
        } = data;

        const game =
          await gameModel.findById(gameId);

        if (!game) {
          socket.emit("gameError", {
            message: "Game not found",
          });

          return;
        }

        const isWhite =
          game.whitePlayer.toString() ===
          userId;

        const isBlack =
          game.blackPlayer.toString() ===
          userId;

        if (!isWhite && !isBlack) {
          socket.emit("gameError", {
            message:
              "You are not a player in this game",
          });

          return;
        }

        socket.join(`game:${gameId}`);

        // Store user information on socket
        socket.data.userId = userId;
        socket.data.gameId = gameId;

        socket.data.color = isWhite
          ? "white"
          : "black";

        const existingGame =
          getChessGame(gameId);

        if (!existingGame) {
          createChessGame(
            gameId,
            game.currentPosition
          );
        }

        socket.emit("gameState", {
          gameId: game._id.toString(),

          color: socket.data.color,

          whitePlayer:
            game.whitePlayer.toString(),

          blackPlayer:
            game.blackPlayer.toString(),

          gameType:
            game.gameType,

          status:
            game.status,

          result:
            game.result,

          moves:
            game.moves,

          currentPosition:
            game.currentPosition,

          turn:
            game.turn,

          timeControl:
            game.timeControl,

          whiteTime:
            game.whiteTime,

          blackTime:
            game.blackTime,
        });

        console.log(
          `${userId} joined game ${gameId} as ${socket.data.color}`
        );
      } catch (error) {
        console.error(
          "Join game error:",
          error
        );

        socket.emit("gameError", {
          message:
            "Failed to join game",
        });
      }
    }
  );

  socket.on(
    "makeMove",
    async (data: {
      gameId: string;
      from: string;
      to: string;
    }) => {
      try {
        const {
          gameId,
          from,
          to,
        } = data;

        // Make sure socket belongs to this game
        if (
          socket.data.gameId !== gameId
        ) {
          socket.emit("invalidMove", {
            message:
              "You are not in this game",
          });

          return;
        }

        const game =
          await gameModel.findById(gameId);

        if (!game) {
          socket.emit("invalidMove", {
            message: "Game not found",
          });

          return;
        }

        if (game.status !== "active") {
          socket.emit("invalidMove", {
            message:
              "Game is not active",
          });

          return;
        }

        // Check player's turn
        if (
          game.turn !== socket.data.color
        ) {
          socket.emit("invalidMove", {
            message:
              "It is not your turn",
          });

          return;
        }

        const result = makeChessMove(
          gameId,
          from,
          to
        );

        if (!result.success) {
          socket.emit("invalidMove", {
            message:
              result.message,
          });

          return;
        }

        game.moves.push(
          result.move.san
        );

        game.currentPosition =
          result.fen;

        game.turn =
          result.turn;

        if (result.isGameOver) {
          game.status =
            "completed";

          game.endedAt =
            new Date();

          if (result.isCheckmate) {
            game.result =
              result.turn === "white"
                ? "black"
                : "white";
          } else {
            game.result = "draw";
          }
        }

        await game.save();

        io.to(`game:${gameId}`).emit(
          "moveMade",
          {
            from,
            to,

            move:
              result.move,

            fen:
              result.fen,

            turn:
              result.turn,

            isCheck:
              result.isCheck,

            isCheckmate:
              result.isCheckmate,

            isDraw:
              result.isDraw,

            isGameOver:
              result.isGameOver,

            status:
              game.status,

            result:
              game.result,
          }
        );
      } catch (error) {
        console.error(
          "Move error:",
          error
        );

        socket.emit("gameError", {
          message:
            "Failed to make move",
        });
      }
    }
  );

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