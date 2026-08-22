"use client";

import React, { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

interface GameState {
  gameId: string;
  color: "white" | "black";
  currentPosition: string;
  turn: "white" | "black";
  moves: string[];
  status: string;
}

interface MoveData {
  from: string;
  to: string;
  fen: string;
  turn: "white" | "black";
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
}

interface GamePageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default function GamePage({ params }: GamePageProps) {
  const { gameId } = React.use(params);

  const [playerColor, setPlayerColor] = useState<
    "white" | "black" | null
  >(null);

  const [turn, setTurn] = useState<
    "white" | "black" | null
  >(null);

  const [gameStatus, setGameStatus] = useState<string>("waiting");

  const [fen, setFen] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );

  const [moves, setMoves] = useState<string[]>([]);

  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.connect();

    socket.emit("joinGame", gameId);

    const handleJoinedGame = (data: {
      gameId: string;
    }) => {
      console.log("Joined game:", data.gameId);
      console.log("Socket ID:", socket.id);
    };

    const handleGameState = (game: GameState) => {
      console.log("Game state:", game);

      setPlayerColor(game.color);
      setTurn(game.turn);
      setFen(game.currentPosition);
      setMoves(game.moves);
      setGameStatus(game.status);

      console.log("I am playing:", game.color);
      console.log("Current turn:", game.turn);
    };

    const handleMove = (move: MoveData) => {
      console.log(`${move.from} → ${move.to}`);

      console.log("FEN:", move.fen);
      console.log("Turn:", move.turn);

      setFen(move.fen);
      setTurn(move.turn);

      setMoves((prev) => [
        ...prev,
        `${move.from} → ${move.to}`,
      ]);

      if (move.isCheckmate) {
        setMessage("Checkmate!");
      } else if (move.isDraw) {
        setMessage("Draw!");
      } else if (move.isCheck) {
        setMessage("Check!");
      } else {
        setMessage("");
      }
    };

    const handleInvalidMove = (data: {
      message: string;
    }) => {
      console.log("Invalid move:", data.message);

      setMessage(data.message);
    };

    socket.on(
      "joinedGame",
      handleJoinedGame
    );

    socket.on(
      "gameState",
      handleGameState
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
        "gameState",
        handleGameState
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

  const isMyTurn =
    playerColor !== null &&
    turn === playerColor;

  return (
    <main className="min-h-screen bg-[#0f1115] text-white p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            ChessLord
          </h1>

          <p className="text-gray-400">
            Game ID: {gameId}
          </p>
        </div>

        {/* Game Information */}
        <div className="grid grid-cols-3 gap-4 mb-6">

          {/* Player */}
          <div className="bg-[#181b21] rounded-xl p-4">
            <p className="text-gray-400 text-sm">
              You are playing
            </p>

            <p className="text-xl font-bold mt-1">
              {playerColor
                ? playerColor.toUpperCase()
                : "Connecting..."}
            </p>
          </div>

          {/* Turn */}
          <div className="bg-[#181b21] rounded-xl p-4">
            <p className="text-gray-400 text-sm">
              Current Turn
            </p>

            <p className="text-xl font-bold mt-1">
              {turn
                ? turn.toUpperCase()
                : "Loading..."}
            </p>
          </div>

          {/* Status */}
          <div className="bg-[#181b21] rounded-xl p-4">
            <p className="text-gray-400 text-sm">
              Game Status
            </p>

            <p className="text-xl font-bold mt-1">
              {gameStatus.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Main Game */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chessboard Placeholder */}
          <div className="lg:col-span-2">

            <div className="aspect-square max-w-162.5 mx-auto bg-[#22252b] rounded-xl flex items-center justify-center">

              <div className="text-center">
                <p className="text-2xl font-bold">
                  Chessboard
                </p>

                <p className="text-gray-400 mt-2">
                  Board will be added here
                </p>

                <p className="text-xs text-gray-500 mt-4 break-all px-8">
                  FEN: {fen}
                </p>
              </div>

            </div>

            {/* Turn Indicator */}
            <div className="mt-4 text-center">

              {isMyTurn ? (
                <p className="text-lg font-semibold">
                  Your turn
                </p>
              ) : (
                <p className="text-lg text-gray-400">
                  Opponent&apos;s turn
                </p>
              )}

            </div>

          </div>

          {/* Right Panel */}
          <div className="bg-[#181b21] rounded-xl p-5">

            <h2 className="text-xl font-bold mb-4">
              Game Info
            </h2>

            {/* Players */}
            <div className="space-y-3 mb-6">

              <div className="bg-[#22252b] rounded-lg p-3">
                <p className="text-sm text-gray-400">
                  White
                </p>

                <p className="font-semibold">
                  {playerColor === "white"
                    ? "You"
                    : "Opponent"}
                </p>
              </div>

              <div className="bg-[#22252b] rounded-lg p-3">
                <p className="text-sm text-gray-400">
                  Black
                </p>

                <p className="font-semibold">
                  {playerColor === "black"
                    ? "You"
                    : "Opponent"}
                </p>
              </div>

            </div>

            {/* Message */}
            {message && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                {message}
              </div>
            )}

            {/* Temporary Move */}
            <button
              onClick={makeMove}
              disabled={!isMyTurn}
              className="w-full bg-white text-black font-medium px-4 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Move e2 → e4
            </button>

            {/* Move History */}
            <div className="mt-6">

              <h3 className="font-semibold mb-3">
                Moves
              </h3>

              <div className="max-h-64 overflow-y-auto space-y-1">

                {moves.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No moves yet
                  </p>
                ) : (
                  moves.map((move, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-300"
                    >
                      {index + 1}. {move}
                    </div>
                  ))
                )}

              </div>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}