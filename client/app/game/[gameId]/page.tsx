"use client";

import React , { useEffect } from "react";
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
      console.log("Joined game:", data.gameId);
      console.log("Socket ID:", socket.id);
    };

    const handleMove = (move: {
      from: string;
      to: string;
    }) => {
      console.log(
        `Opponent moved ${move.from} → ${move.to}`
      );
    };

    socket.on("joinedGame", handleJoinedGame);

    socket.on("moveMade", handleMove);

    return () => {
      socket.off(
        "joinedGame",
        handleJoinedGame
      );

      socket.off("moveMade", handleMove);

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

      <button onClick={makeMove}>
        Move e2 → e4
      </button>
    </div>
  );
}