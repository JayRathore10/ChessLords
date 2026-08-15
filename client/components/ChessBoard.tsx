"use client";

import { Chess } from "chess.js";
import {
  Chessboard,
  type PieceDropHandlerArgs,
} from "react-chessboard";
import { useState } from "react";

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess());

  const onDrop = ({
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs) => {
    try {
      const gameCopy = new Chess(game.fen());

      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare!,
        promotion: "q",
      });

      if (!move) return false;

      setGame(gameCopy);

      return true;
    } catch {
      return false;
    }
  };

  return (
    <div style={{ width: "600px" }}>
      <Chessboard
        options={{
          position: game.fen(),
          onPieceDrop: onDrop,

          darkSquareStyle: {
            backgroundColor: "#769656",
          },

          lightSquareStyle: {
            backgroundColor: "#eeeed2",
          },

        }}
      />
    </div>
  );
}

// have to add tap and get position like mobile version 
 