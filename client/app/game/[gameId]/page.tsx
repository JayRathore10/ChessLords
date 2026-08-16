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

    socket.on("joinedGame", (data) => {
      console.log("Joined game:", data.gameId);
    });

    return () => {
      socket.off("joinedGame");
      socket.disconnect();
    };
  }, [gameId]);

  return (
    <div>
      <h1>Chess Game</h1>

      <p>Game ID: {gameId}</p>

      <p>
        Socket ID: {socket.id}
      </p>
    </div>
  );
}