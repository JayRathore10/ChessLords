"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Chess, Square } from "chess.js";
import {
  Chessboard,
  type PieceDropHandlerArgs,
  type SquareHandlerArgs,
  type PieceHandlerArgs,
} from "react-chessboard";

// --- THEME DEFINITIONS ---
export type BoardTheme = "Wood" | "Glass" | "Neo" | "Classic Green" | "Dark Slate";

export const THEME_COLORS: Record<BoardTheme, { light: string; dark: string }> = {
  "Wood": { light: "#f0d9b5", dark: "#b58863" },
  "Classic Green": { light: "#ebecd0", dark: "#739552" },
  "Neo": { light: "#ffffff", dark: "#cfd6e1" },
  "Dark Slate": { light: "#8a9c9c", dark: "#2f4f4f" },
  "Glass": { light: "rgba(255, 255, 255, 0.15)", dark: "rgba(0, 0, 0, 0.3)" },
};
// -------------------------

export interface ChessBoardProps {
  fen?: string;
  orientation?: "white" | "black";
  disabled?: boolean;
  isPassAndPlay?: boolean;
  theme?: BoardTheme; // NEW THEME PROP
  onMove?: (from: string, to: string, promotion?: string) => boolean | void;
  lastMove?: { from: string; to: string } | null;
  className?: string;
}

export default function ChessBoard({
  fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  orientation = "white",
  disabled = false,
  isPassAndPlay = false,
  theme = "Classic Green", // DEFAULT THEME
  onMove,
  lastMove = null,
  className = "",
}: ChessBoardProps) {
  
  // Local chess instance for move validation & legal moves calculation
  const game = useMemo(() => {
    try {
      return new Chess(fen);
    } catch (e) {
      console.error("Invalid FEN provided to ChessBoard:", fen, e);
      return new Chess();
    }
  }, [fen]);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<string[]>([]);
  const [promotionMove, setPromotionMove] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Clear selection if fen changes or board gets disabled
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoveSquares([]);
  }, [fen, disabled]);

  // Compute legal moves for a selected square
  const getLegalMovesForSquare = useCallback(
    (square: Square): string[] => {
      try {
        const moves = game.moves({ square, verbose: true });
        return moves.map((m) => m.to);
      } catch {
        return [];
      }
    },
    [game]
  );

  const isPromotionMove = (from: string, to: string): boolean => {
    const piece = game.get(from as Square);
    if (!piece || piece.type !== "p") return false;
    const targetRank = to[1];
    return (
      (piece.color === "w" && targetRank === "8") ||
      (piece.color === "b" && targetRank === "1")
    );
  };

  const handlePromotion = (promotion: "q" | "r" | "b" | "n") => {
    if (!promotionMove) return;
    const { from, to } = promotionMove;

    try {
      const move = game.move({
        from: from as Square,
        to: to as Square,
        promotion,
      });

      if (!move) return;

      if (onMove) {
        onMove(from, to, promotion);
      }

      setPromotionMove(null);
      setSelectedSquare(null);
      setLegalMoveSquares([]);
    } catch (error) {
      console.error("Promotion error:", error);
    }
  };

  // Handle Drag & Drop move
  const handlePieceDrop = ({
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs): boolean => {
    if (disabled || !targetSquare) return false;

    try {
      if (isPromotionMove(sourceSquare, targetSquare)) {
        setPromotionMove({ from: sourceSquare, to: targetSquare });
        return false;
      }

      const move = game.move({ from: sourceSquare, to: targetSquare });
      if (!move) return false;

      if (onMove) onMove(sourceSquare, targetSquare);
      
      setSelectedSquare(null);
      setLegalMoveSquares([]);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Handle Square click (Tap to move)
  const handleSquareClick = ({ square }: SquareHandlerArgs) => {
    if (disabled) return;

    if (selectedSquare) {
      if (legalMoveSquares.includes(square)) {
        try {
          if (isPromotionMove(selectedSquare, square)) {
            setPromotionMove({ from: selectedSquare, to: square });
            return;
          }

          const move = game.move({ from: selectedSquare, to: square });
          if (move) {
            if (onMove) onMove(selectedSquare, square);
            setSelectedSquare(null);
            setLegalMoveSquares([]);
            return;
          }
        } catch (error) {
          console.error("Move error:", error);
        }
      }

      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoveSquares([]);
        return;
      }
    }

    const pieceOnSquare = game.get(square as Square);
    const isPieceTurn = pieceOnSquare && pieceOnSquare.color === game.turn();

    if (isPieceTurn) {
      setSelectedSquare(square);
      const moves = getLegalMovesForSquare(square as Square);
      setLegalMoveSquares(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoveSquares([]);
    }
  };

  const canDragPiece = ({ piece }: PieceHandlerArgs): boolean => {
    if (disabled || !piece?.pieceType) return false;
    const isWhitePiece = piece.pieceType.startsWith("w") || piece.pieceType === piece.pieceType.toUpperCase();
    const pieceColor = isWhitePiece ? "w" : "b";
    const activeColor = game.turn();

    if (isPassAndPlay) return pieceColor === activeColor;

    return (
      pieceColor === activeColor &&
      (orientation === "white" ? pieceColor === "w" : pieceColor === "b")
    );
  };

  const inCheckKingSquare = useMemo<string | null>(() => {
    if (!game.inCheck()) return null;
    const currentTurn = game.turn();
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === "k" && p.color === currentTurn) {
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          return `${file}${rank}`;
        }
      }
    }
    return null;
  }, [game]);

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: "rgba(255, 255, 0, 0.35)" };
      styles[lastMove.to] = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
    }

    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: "rgba(105, 187, 85, 0.65)" };
    }

    legalMoveSquares.forEach((sq) => {
      const targetPiece = game.get(sq as Square);
      if (targetPiece) {
        styles[sq] = {
          ...styles[sq],
          background: "radial-gradient(circle, rgba(0,0,0,0.1) 80%, rgba(20,85,30,0.6) 85%)",
          borderRadius: "50%",
        };
      } else {
        styles[sq] = {
          ...styles[sq],
          background: "radial-gradient(circle, rgba(20,85,30,0.5) 25%, transparent 26%)",
          borderRadius: "50%",
        };
      }
    });

    if (inCheckKingSquare) {
      styles[inCheckKingSquare] = {
        background: "radial-gradient(circle, rgba(255, 0, 0, 0.8) 0%, rgba(239, 68, 68, 0.4) 60%, transparent 100%)",
        borderRadius: "50%",
      };
    }

    return styles;
  }, [selectedSquare, legalMoveSquares, lastMove, inCheckKingSquare, game]);

  const promotionColor = promotionMove
    ? new Chess(fen).get(promotionMove.from as Square)?.color
    : null;

  // Resolve current theme colors
  const activeColors = THEME_COLORS[theme];

  return (
    <div
      className={`relative w-full aspect-square mx-auto shadow-2xl rounded-xl overflow-hidden bg-[#1f2228] p-1.5 sm:p-2 border border-gray-800/80 flex-shrink-0 touch-none ${className}`}
    >
      {promotionMove && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[#1f2228] rounded-xl p-4 shadow-2xl border border-gray-700">
            <p className="text-white text-center mb-3 font-semibold">
              Promote pawn to
            </p>
            <div className="flex gap-3">
              {(["q", "r", "b", "n"] as const).map((piece) => (
                <button
                  key={piece}
                  onClick={() => handlePromotion(piece)}
                  className={`w-16 h-16 text-5xl rounded-lg ${
                    promotionColor === "w"
                      ? "bg-black text-white hover:bg-gray-900"
                      : "bg-white text-black hover:bg-gray-200"
                  }`}
                >
                  {promotionColor === "w"
                    ? { q: "♕", r: "♖", b: "♗", n: "♘" }[piece]
                    : { q: "♛", r: "♜", b: "♝", n: "♞" }[piece]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chess board with Dynamic Theme applied */}
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          allowDragging: !disabled,
          canDragPiece,
          onPieceDrop: handlePieceDrop,
          onSquareClick: handleSquareClick,
          squareStyles,
          showNotation: true,
          animationDurationInMs: 250,
          darkSquareStyle: {
            backgroundColor: activeColors.dark,
          },
          lightSquareStyle: {
            backgroundColor: activeColors.light,
          },
          darkSquareNotationStyle: {
            color: activeColors.light,
            fontSize: "12px",
            fontWeight: "600",
          },
          lightSquareNotationStyle: {
            color: activeColors.dark,
            fontSize: "12px",
            fontWeight: "600",
          },
          boardStyle: {
            borderRadius: "8px",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.4)",
          },
        }}
      />
    </div>
  );
}