"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Chess, Square } from "chess.js";
import {
  Chessboard,
  type PieceDropHandlerArgs,
  type SquareHandlerArgs,
  type PieceHandlerArgs,
} from "react-chessboard";

export interface ChessBoardProps {
  fen?: string;
  orientation?: "white" | "black";
  disabled?: boolean;
  isPassAndPlay?: boolean;
  onMove?: (from: string, to: string, promotion?: string) => boolean | void;
  lastMove?: { from: string; to: string } | null;
  className?: string;
}

export default function ChessBoard({
  fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  orientation = "white",
  disabled = false,
  isPassAndPlay = false,
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

    try {
      const move = game.move({
        from: promotionMove.from,
        to: promotionMove.to,
        promotion,
      });

      if (!move) return;

      if (onMove) {
        onMove(
          promotionMove.from,
          promotionMove.to,
          promotion
        );
      }

      setPromotionMove(null);
      setSelectedSquare(null);
      setLegalMoveSquares([]);
    } catch (error) {
      console.error("Promotion failed:", error);
    }
  };

  // Handle Drag & Drop move
  const handlePieceDrop = ({
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs): boolean => {
    if (disabled || !targetSquare) return false;

    try {
      // Check if this move is a pawn promotion
      if (isPromotionMove(sourceSquare, targetSquare)) {
        setPromotionMove({
          from: sourceSquare,
          to: targetSquare,
        });

        return false;
      }

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
      });

      if (!move) return false;

      if (onMove) {
        onMove(sourceSquare, targetSquare);
      }

      setSelectedSquare(null);
      setLegalMoveSquares([]);

      return true;
    } catch {
      return false;
    }
  };
  // Handle Square click (Tap to move)
  const handleSquareClick = ({ square }: SquareHandlerArgs) => {
    if (disabled) return;

    // If a square was already selected and clicked target is a valid destination
    if (selectedSquare) {
      if (legalMoveSquares.includes(square)) {
        try {
          if (isPromotionMove(selectedSquare, square)) {
            setPromotionMove({
              from: selectedSquare,
              to: square,
            });

            return;
          }

          const move = game.move({
            from: selectedSquare,
            to: square,
          });

          if (move) {
            if (onMove) {
              onMove(selectedSquare, square, "q");
            }
            setSelectedSquare(null);
            setLegalMoveSquares([]);
            return;
          }
        } catch {
          // invalid move fallback
        }
      }

      // If user clicked the same square, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoveSquares([]);
        return;
      }
    }

    // Check if clicked square has a piece belonging to active turn
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

  // Only allow dragging own pieces when not disabled
  const canDragPiece = ({ piece }: PieceHandlerArgs): boolean => {
    if (disabled || !piece?.pieceType) return false;
    const isWhitePiece = piece.pieceType.startsWith("w") || piece.pieceType === piece.pieceType.toUpperCase();
    const pieceColor = isWhitePiece ? "w" : "b";
    const activeColor = game.turn(); // 'w' or 'b'

    if (isPassAndPlay) {
      return pieceColor === activeColor;
    }

    // Allow dragging only current turn pieces matching orientation
    return (
      pieceColor === activeColor &&
      (orientation === "white" ? pieceColor === "w" : pieceColor === "b")
    );
  };

  // Find King square if currently in check
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

  // Compute square highlight styles
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // 1. Last move highlights
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: "rgba(255, 255, 0, 0.35)",
      };
      styles[lastMove.to] = {
        backgroundColor: "rgba(255, 255, 0, 0.4)",
      };
    }

    // 2. Selected square highlight
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: "rgba(105, 187, 85, 0.65)",
      };
    }

    // 3. Legal destination dots / capture indicators
    legalMoveSquares.forEach((sq) => {
      const targetPiece = game.get(sq as Square);
      if (targetPiece) {
        // Target is an opponent piece: draw ring
        styles[sq] = {
          ...styles[sq],
          background:
            "radial-gradient(circle, rgba(0,0,0,0.1) 80%, rgba(20,85,30,0.6) 85%)",
          borderRadius: "50%",
        };
      } else {
        // Empty target: draw small centered dot
        styles[sq] = {
          ...styles[sq],
          background:
            "radial-gradient(circle, rgba(20,85,30,0.5) 25%, transparent 26%)",
          borderRadius: "50%",
        };
      }
    });

    // 4. King in check highlight
    if (inCheckKingSquare) {
      styles[inCheckKingSquare] = {
        background:
          "radial-gradient(circle, rgba(255, 0, 0, 0.8) 0%, rgba(239, 68, 68, 0.4) 60%, transparent 100%)",
        borderRadius: "50%",
      };
    }

    return styles;
  }, [selectedSquare, legalMoveSquares, lastMove, inCheckKingSquare, game]);

  return (
    <div
      className={`relative w-full max-w-155 aspect-square mx-auto shadow-2xl rounded-xl overflow-hidden bg-[#1f2228] p-2 border border-gray-800/80 ${className}`}
    >

      {/* STEP 6: Promotion UI */}
      {promotionMove && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#1f2228] rounded-xl p-4 shadow-2xl border border-gray-700">

            <p className="text-white text-center mb-3 font-semibold">
              Promote pawn to
            </p>

            <div className="flex gap-3">

              <button
                onClick={() => handlePromotion("q")}
                className="w-16 h-16 text-5xl bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                ♕
              </button>

              <button
                onClick={() => handlePromotion("r")}
                className="w-16 h-16 text-5xl bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                ♖
              </button>

              <button
                onClick={() => handlePromotion("b")}
                className="w-16 h-16 text-5xl bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                ♗
              </button>

              <button
                onClick={() => handlePromotion("n")}
                className="w-16 h-16 text-5xl bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                ♘
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Chess board */}
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
            backgroundColor: "#A1A3A4",
          },
          lightSquareStyle: {
            backgroundColor: "#ebecd0",
          },
          darkSquareNotationStyle: {
            color: "#ebecd0",
            fontSize: "12px",
            fontWeight: "600",
          },
          lightSquareNotationStyle: {
            color: "#739552",
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