"use client";

import React, { useEffect } from "react";
import { socket } from "@/lib/socket";

interface GamePageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default function GamePage({
  params,
}: GamePageProps) {
  const { gameId } = React.use(params);

  useEffect(() => {
    socket.connect();

    socket.emit("joinGame", gameId);

    const handleJoinedGame = (data: {
      gameId: string;
    }) => {
      console.log(
        "Joined game:",
        data.gameId
      );

      console.log(
        "Socket ID:",
        socket.id
      );
    };

    const handleMove = (move: {
      from: string;
      to: string;
      fen: string;
      turn: "w" | "b";
      isCheck: boolean;
      isCheckmate: boolean;
      isDraw: boolean;
      isGameOver: boolean;
    }) => {
      console.log(
        `${move.from} → ${move.to}`
      );

      console.log(
        "FEN:",
        move.fen
      );

      console.log(
        "Turn:",
        move.turn
      );
    };

    const handleInvalidMove = (data: {
      message: string;
    }) => {
      console.log(
        "Invalid move:",
        data.message
      );
    };

    socket.on(
      "joinedGame",
      handleJoinedGame
    );

    socket.on(
      "moveMade",
      handleMove
    );

    socket.on(
      "invalidMove",
      handleInvalidMove
    );

    return () => {
      socket.off(
        "joinedGame",
        handleJoinedGame
      );

      socket.off(
        "moveMade",
        handleMove
      );

      socket.off(
        "invalidMove",
        handleInvalidMove
      );

      socket.disconnect();
    };
  }, [gameId]);

  const makeMove = () => {
    socket.emit("makeMove", {
      gameId,
      from: "e2",
      to: "e4",
    });
  };

  return (
    <div>
      <h1>ChessLord Game</h1>

      <p>Game ID: {gameId}</p>

      <p>
        Socket ID: {socket.id}
      </p>

      <button onClick={makeMove} className="bg-red-650 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
        Move e2 → e4
      </button>

    </div>
  );
}

// have to add playeer turn and also the placeholder marks 