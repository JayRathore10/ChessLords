"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { socket } from "@/lib/socket";
import { useAuth } from "@/lib/auth-context";
import ChessBoard from "@/components/chess/ChessBoard";
import {
  Crown,
  Flag,
  Handshake,
  X,
  AlertTriangle,
  Clock,
  RotateCcw,
  ChevronLeft,
  Copy,
  Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameState {
  gameId: string;
  color: "white" | "black";
  isPassAndPlay?: boolean;
  whitePlayerName?: string;
  blackPlayerName?: string;
  whitePlayerRating?: number;
  blackPlayerRating?: number;
  gameType?: "casual" | "rated";
  status: string;
  result?: string;
  moves: string[];
  currentPosition: string;
  turn: "white" | "black";
  timeControl?: {
    initialTime: number;
    increment: number;
    name?: string;
  };
  whiteTime?: number;
  blackTime?: number;
  inviteCode?: string;
}

interface MoveData {
  from: string;
  to: string;
  move?: { san?: string };
  fen: string;
  turn: "white" | "black";
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  status?: string;
  result?: string;
}

interface GameOverData {
  result: string;
  reason: string;
  winner?: string;
}

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

// ─── Helper to format seconds into mm:ss ──────────────────────────────────────
function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Captured pieces helpers ──────────────────────────────────────────────────
const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

function parseCaptured(moves: string[]): {
  whiteCaptured: string[];
  blackCaptured: string[];
} {
  const whiteCaptured: string[] = [];
  const blackCaptured: string[] = [];
  for (const san of moves) {
    if (san.includes("x")) {
      // Determine what was captured from SAN — basic heuristic
      const capturePiece = san
        .replace(/[+#!=?]/g, "")
        .replace(/x.*/, "")
        .slice(-1)
        .toLowerCase();
      const isWhiteMove = san === san; // We count by index parity instead
      const idx = moves.indexOf(san);
      const isWhiteTurn = idx % 2 === 0;
      // The "captured" piece: we can't know exact type from SAN x alone, but
      // we mark a pawn by default for display; SAN doesn't always include it.
      if (isWhiteTurn) {
        whiteCaptured.push(capturePiece || "p");
      } else {
        blackCaptured.push(capturePiece || "p");
      }
    }
  }
  return { whiteCaptured, blackCaptured };
}

function materialDiff(whiteCaptured: string[], blackCaptured: string[]): number {
  const wVal = whiteCaptured.reduce((a, p) => a + (PIECE_VALUES[p] || 1), 0);
  const bVal = blackCaptured.reduce((a, p) => a + (PIECE_VALUES[p] || 1), 0);
  return wVal - bVal;
}

const PIECE_SYMBOLS: Record<string, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function GamePage({ params }: GamePageProps) {
  const { gameId } = React.use(params);
  const router = useRouter();
  const { user } = useAuth();

  // Board & game state
  const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(null);
  const [turn, setTurn] = useState<"white" | "black" | null>(null);
  const [gameStatus, setGameStatus] = useState<string>("waiting");
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [sanMoves, setSanMoves] = useState<string[]>([]);
  const [isPassAndPlay, setIsPassAndPlay] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Player names / rating
  const [whiteName, setWhiteName] = useState("White");
  const [blackName, setBlackName] = useState("Black");
  const [whiteRating, setWhiteRating] = useState(1200);
  const [blackRating, setBlackRating] = useState(1200);
  const [gameType, setGameType] = useState<"casual" | "rated">("casual");
  const [timeControlName, setTimeControlName] = useState("");

  // Clocks
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);
  const [increment, setIncrement] = useState(0);
  const clockRef = useRef<NodeJS.Timeout | null>(null);

  // Game over overlay
  const [gameOver, setGameOver] = useState<GameOverData | null>(null);

  // Resign / draw confirmation modals
  const [showResignModal, setShowResignModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [drawOfferedBy, setDrawOfferedBy] = useState<"white" | "black" | null>(null);
  const [drawPending, setDrawPending] = useState(false); // waiting for opponent

  // Move history scroll
  const moveListRef = useRef<HTMLDivElement>(null);

  // ─── Clock tick ──────────────────────────────────────────────────────────
  const startClock = useCallback(
    (currentTurn: "white" | "black") => {
      if (clockRef.current) clearInterval(clockRef.current);
      clockRef.current = setInterval(() => {
        if (currentTurn === "white") {
          setWhiteTime((t) => Math.max(0, t - 1));
        } else {
          setBlackTime((t) => Math.max(0, t - 1));
        }
      }, 1000);
    },
    []
  );

  const stopClock = useCallback(() => {
    if (clockRef.current) {
      clearInterval(clockRef.current);
      clockRef.current = null;
    }
  }, []);

  // ─── Socket wiring ───────────────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    const storedUserId =
      typeof window !== "undefined"
        ? localStorage.getItem("userId") || user?._id || "guest"
        : "guest";
    const storedUsername = user?.username || "Player";

    socket.emit("joinGame", {
      gameId,
      userId: storedUserId,
      username: storedUsername,
      rating: user?.rating ?? 1200,
    });

    const handleGameState = (game: GameState) => {
      setPlayerColor(game.color);
      setTurn(game.turn);
      setFen(game.currentPosition);
      setSanMoves(game.moves || []);
      setGameStatus(game.status);
      setIsPassAndPlay(game.isPassAndPlay || false);
      setWhiteName(game.whitePlayerName || "White");
      setBlackName(game.blackPlayerName || "Black");
      setWhiteRating(game.whitePlayerRating || 1200);
      setBlackRating(game.blackPlayerRating || 1200);
      setGameType(game.gameType || "casual");
      setTimeControlName(game.timeControl?.name || "");
      setIncrement(game.timeControl?.increment || 0);
      setInviteCode(game.inviteCode || null);

      if (game.whiteTime !== undefined) setWhiteTime(game.whiteTime);
      if (game.blackTime !== undefined) setBlackTime(game.blackTime);

      if (game.status === "active") {
        startClock(game.turn);
      }
    };

    const handlePlayerJoined = (data: {
      joinedColor: string;
      username: string;
      status: string;
    }) => {
      if (data.status === "active") {
        setGameStatus("active");
        setMessage("");
        // Start clock for white's first turn
        startClock("white");
      }
    };

    const handleMove = (move: MoveData) => {
      setFen(move.fen);
      setTurn(move.turn);
      setLastMove({ from: move.from, to: move.to });
      if (move.move?.san) {
        setSanMoves((prev) => [...prev, move.move!.san!]);
      }
      if (move.status) setGameStatus(move.status);

      // Increment the previous player's time
      const prevTurn = move.turn === "white" ? "black" : "white";
      if (increment > 0) {
        if (prevTurn === "white") {
          setWhiteTime((t) => t + increment);
        } else {
          setBlackTime((t) => t + increment);
        }
      }

      if (move.isGameOver) {
        stopClock();
        setGameStatus("completed");
        if (move.isCheckmate) {
          setMessage("Checkmate!");
          const winner = move.turn === "white" ? "black" : "white";
          setGameOver({ result: winner, reason: "checkmate", winner });
        } else if (move.isDraw) {
          setMessage("Draw!");
          setGameOver({ result: "draw", reason: "draw" });
        }
      } else {
        if (move.isCheck) {
          setMessage("Check!");
        } else {
          setMessage("");
        }
        startClock(move.turn);
      }
    };

    const handleInvalidMove = (data: { message: string }) => {
      setMessage(data.message);
      setTimeout(() => setMessage(""), 2500);
    };

    const handleGameError = (data: { message: string }) => {
      setMessage(data.message);
    };

    const handleGameOver = (data: GameOverData) => {
      stopClock();
      setGameStatus("completed");
      setGameOver(data);
    };

    const handleDrawOffered = (data: { byColor: "white" | "black" }) => {
      setDrawOfferedBy(data.byColor);
      setShowDrawModal(true);
    };

    const handleDrawDeclined = () => {
      setDrawPending(false);
      setMessage("Draw offer declined.");
      setTimeout(() => setMessage(""), 3000);
    };

    socket.on("gameState", handleGameState);
    socket.on("playerJoined", handlePlayerJoined);
    socket.on("moveMade", handleMove);
    socket.on("invalidMove", handleInvalidMove);
    socket.on("gameError", handleGameError);
    socket.on("gameOver", handleGameOver);
    socket.on("drawOffered", handleDrawOffered);
    socket.on("drawDeclined", handleDrawDeclined);

    return () => {
      socket.off("gameState", handleGameState);
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("moveMade", handleMove);
      socket.off("invalidMove", handleInvalidMove);
      socket.off("gameError", handleGameError);
      socket.off("gameOver", handleGameOver);
      socket.off("drawOffered", handleDrawOffered);
      socket.off("drawDeclined", handleDrawDeclined);
      stopClock();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // Scroll move list to bottom on new move
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [sanMoves]);

  // Stop clock when game ends
  useEffect(() => {
    if (gameStatus === "completed" || gameStatus === "aborted") {
      stopClock();
    }
  }, [gameStatus, stopClock]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleMakeMove = (from: string, to: string, promotion?: string) => {
    socket.emit("makeMove", { gameId, from, to, promotion: promotion || "q" });
  };

  const handleResign = () => {
    socket.emit("resign", { gameId });
    setShowResignModal(false);
  };

  const handleOfferDraw = () => {
    socket.emit("offerDraw", { gameId });
    setDrawPending(true);
    setMessage("Draw offer sent. Waiting for opponent...");
  };

  const handleRespondDraw = (accept: boolean) => {
    socket.emit("respondDraw", { gameId, accept });
    setShowDrawModal(false);
    setDrawOfferedBy(null);
  };

  const handleAbort = () => {
    socket.emit("abortGame", { gameId });
  };

  const handleCopyInvite = () => {
    if (!inviteCode) return;
    const url = `${window.location.origin}/game?join=${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ─── Computed ─────────────────────────────────────────────────────────────
  const isMyTurn =
    gameStatus === "active" &&
    (isPassAndPlay || (playerColor !== null && turn === playerColor));

  const boardDisabled =
    !isMyTurn || gameStatus !== "active" || gameOver !== null;

  const { whiteCaptured, blackCaptured } = parseCaptured(sanMoves);
  const diff = materialDiff(whiteCaptured, blackCaptured);

  // Group SAN moves into pairs for display
  const movePairs: [string, string?][] = [];
  for (let i = 0; i < sanMoves.length; i += 2) {
    movePairs.push([sanMoves[i], sanMoves[i + 1]]);
  }

  // Clock color (red when under 30 seconds)
  const whiteClockClass =
    whiteTime < 30 && gameStatus === "active" && turn === "white"
      ? "text-red-400 font-extrabold"
      : "text-white font-bold";
  const blackClockClass =
    blackTime < 30 && gameStatus === "active" && turn === "black"
      ? "text-red-400 font-extrabold"
      : "text-white font-bold";

  // Player labels
  const myName = playerColor === "white" ? whiteName : blackName;
  const opponentName = playerColor === "white" ? blackName : whiteName;
  const opponentRating = playerColor === "white" ? blackRating : whiteRating;

  // For board orientation: in pass-and-play, show white's perspective always;
  // otherwise orient by player color
  const boardOrientation = isPassAndPlay ? "white" : playerColor === "black" ? "black" : "white";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[var(--surface-main)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/game"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Lobby
          </Link>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                gameType === "rated"
                  ? "bg-[var(--game-blitz-bg)] text-[var(--game-blitz)] border border-[var(--game-blitz-border)]"
                  : "bg-[var(--surface-card)] text-gray-400 border border-[var(--surface-border)]"
              }`}
            >
              {gameType}
            </span>
            {timeControlName && (
              <span className="text-gray-500">
                <Clock className="inline w-3 h-3 mr-0.5" />
                {timeControlName}
              </span>
            )}
          </div>
        </div>

        {/* Waiting for Opponent Banner */}
        {gameStatus === "waiting" && inviteCode && (
          <div className="mb-4 p-4 bg-[var(--surface-card)] border border-[var(--primary-border)] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--primary)]">
                Waiting for your opponent to join…
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Share this invite code or link with your friend
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xl tracking-widest text-white bg-[var(--surface-main)] px-4 py-2 rounded-xl border border-[var(--surface-border)]">
                {inviteCode}
              </span>
              <button
                onClick={handleCopyInvite}
                className="p-2.5 rounded-xl bg-[var(--primary-muted)] border border-[var(--primary-border)] text-[var(--primary)] hover:bg-[var(--primary-border)] transition"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {gameStatus === "waiting" && !inviteCode && (
          <div className="mb-4 p-4 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl flex items-center gap-3 text-gray-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--game-blitz)] animate-pulse" />
            Waiting for opponent to join…
          </div>
        )}

        {/* Message Banner */}
        {message && (
          <div className="mb-4 p-3 bg-[var(--primary-muted)] border border-[var(--primary-border)] rounded-xl text-center text-sm font-semibold text-white animate-in fade-in duration-150">
            {message}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:gap-6 items-start">

          {/* ── Left: Board + Player strips ── */}
          <div className="flex flex-col gap-3">

            {/* Opponent (top of board) */}
            <PlayerStrip
              name={isPassAndPlay ? blackName : opponentName}
              rating={isPassAndPlay ? blackRating : opponentRating}
              isActive={turn === "black" && gameStatus === "active"}
              captured={blackCaptured}
              materialAdv={diff < 0 ? -diff : 0}
              time={blackTime}
              clockClass={blackClockClass}
              side="black"
            />

            {/* Board */}
            <div className="w-full">
              <ChessBoard
                fen={fen}
                orientation={boardOrientation}
                disabled={boardDisabled}
                isPassAndPlay={isPassAndPlay}
                onMove={handleMakeMove}
                lastMove={lastMove}
              />
            </div>

            {/* My player strip (bottom of board) */}
            <PlayerStrip
              name={isPassAndPlay ? whiteName : (playerColor === "white" ? whiteName : blackName)}
              rating={isPassAndPlay ? whiteRating : (playerColor === "white" ? whiteRating : blackRating)}
              isActive={turn === (isPassAndPlay ? "white" : playerColor) && gameStatus === "active"}
              captured={whiteCaptured}
              materialAdv={diff > 0 ? diff : 0}
              time={whiteTime}
              clockClass={whiteClockClass}
              side="white"
            />

            {/* Game Action Buttons */}
            {gameStatus === "active" && !gameOver && (
              <div className="flex items-center gap-2 mt-1">
                {sanMoves.length === 0 && (
                  <button
                    onClick={handleAbort}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--surface-border)] text-gray-400 hover:text-white hover:border-gray-600 transition"
                    title="Abort Game (no moves made)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Abort
                  </button>
                )}

                {!drawPending && !isPassAndPlay && (
                  <button
                    onClick={handleOfferDraw}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--surface-border)] text-gray-400 hover:text-white hover:border-gray-600 transition"
                    title="Offer Draw"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    Offer Draw
                  </button>
                )}

                {drawPending && (
                  <span className="text-xs text-gray-500 px-2 italic">
                    Draw offer pending…
                  </span>
                )}

                <button
                  onClick={() => setShowResignModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-red-800/50 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition ml-auto"
                  title="Resign"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Resign
                </button>
              </div>
            )}
          </div>

          {/* ── Right Panel: Info + Move History ── */}
          <aside className="flex flex-col gap-4">

            {/* Players / Rating Card */}
            <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Players
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-main)] border border-[var(--surface-border)]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white border-2 border-gray-300 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white leading-none">
                        {whiteName}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{whiteRating}</p>
                    </div>
                  </div>
                  {turn === "white" && gameStatus === "active" && (
                    <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-main)] border border-[var(--surface-border)]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-gray-800 border-2 border-gray-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white leading-none">
                        {blackName}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{blackRating}</p>
                    </div>
                  </div>
                  {turn === "black" && gameStatus === "active" && (
                    <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            {/* Move History */}
            <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-4 flex flex-col min-h-[200px]">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Move History
              </h3>
              <div
                ref={moveListRef}
                className="flex-1 overflow-y-auto space-y-0.5 max-h-72 pr-1"
              >
                {movePairs.length === 0 ? (
                  <p className="text-xs text-gray-600 italic">No moves yet</p>
                ) : (
                  movePairs.map(([white, black], idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[28px_1fr_1fr] gap-1 items-center text-sm"
                    >
                      <span className="text-[11px] text-gray-600 text-right pr-1">
                        {idx + 1}.
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono ${
                          sanMoves.length - 1 === idx * 2
                            ? "bg-[var(--primary-muted)] text-[var(--primary)] font-semibold"
                            : "text-gray-300"
                        }`}
                      >
                        {white}
                      </span>
                      {black && (
                        <span
                          className={`px-2 py-0.5 rounded font-mono ${
                            sanMoves.length - 1 === idx * 2 + 1
                              ? "bg-[var(--primary-muted)] text-[var(--primary)] font-semibold"
                              : "text-gray-300"
                          }`}
                        >
                          {black}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pass & Play turn indicator */}
            {isPassAndPlay && gameStatus === "active" && (
              <div className="bg-[var(--surface-card)] border border-[var(--primary-border)] rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Current Turn
                </p>
                <p className="text-base font-extrabold text-white">
                  {turn === "white" ? whiteName : blackName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pass the device to the other player
                </p>
              </div>
            )}

            {/* Turn Indicator (online) */}
            {!isPassAndPlay && gameStatus === "active" && (
              <div
                className={`rounded-2xl p-3 text-center text-sm font-bold border transition-all ${
                  isMyTurn
                    ? "bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]"
                    : "bg-[var(--surface-card)] border-[var(--surface-border)] text-gray-500"
                }`}
              >
                {isMyTurn ? "● Your Turn" : "○ Opponent's Turn"}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ─── Game Over Overlay ─────────────────────────────────────────────── */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-gradient flex items-center justify-center shadow-lg">
              <Crown className="w-8 h-8 text-[var(--surface-main)]" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">
                {gameOver.reason === "checkmate"
                  ? "Checkmate!"
                  : gameOver.reason === "resignation"
                  ? "Game Over"
                  : gameOver.reason === "agreement"
                  ? "Draw by Agreement"
                  : gameOver.reason === "aborted"
                  ? "Game Aborted"
                  : "Game Over"}
              </h2>

              {gameOver.result === "draw" ? (
                <p className="text-gray-400 mt-2">The game ended in a draw.</p>
              ) : gameOver.result === "none" ? (
                <p className="text-gray-400 mt-2">The game was aborted.</p>
              ) : (
                <p className="text-gray-400 mt-2">
                  {gameOver.reason === "resignation"
                    ? `${gameOver.result === playerColor ? "You resigned." : "Opponent resigned."}`
                    : `${
                        gameOver.winner === "white" ? whiteName : blackName
                      } wins!`}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/game"
                className="w-full py-3 rounded-xl font-bold text-sm bg-primary-gradient text-[var(--surface-main)] hover:opacity-95 transition shadow-lg"
              >
                Play Again
              </Link>
              <Link
                href="/"
                className="w-full py-3 rounded-xl font-bold text-sm bg-white/5 border border-[var(--surface-border)] text-gray-300 hover:bg-white/10 transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── Resign Confirmation Modal ─────────────────────────────────────── */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white text-base">Resign Game?</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  This will end the game and count as a loss.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResignModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 border border-[var(--surface-border)] hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResign}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500/80 hover:bg-red-500 transition"
              >
                Resign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Draw Offer Modal (incoming) ───────────────────────────────────── */}
      {showDrawModal && drawOfferedBy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <Handshake className="w-6 h-6 text-[var(--primary)] flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white text-base">Draw Offered</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {drawOfferedBy === "white" ? whiteName : blackName} is offering a
                  draw. Do you accept?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleRespondDraw(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 border border-[var(--surface-border)] hover:bg-white/10 transition flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> Decline
              </button>
              <button
                onClick={() => handleRespondDraw(true)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[var(--surface-main)] bg-primary-gradient hover:opacity-90 transition flex items-center justify-center gap-1.5"
              >
                <Handshake className="w-4 h-4" /> Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Player Strip Sub-component ───────────────────────────────────────────────

interface PlayerStripProps {
  name: string;
  rating: number;
  isActive: boolean;
  captured: string[];
  materialAdv: number;
  time: number;
  clockClass: string;
  side: "white" | "black";
}

function PlayerStrip({
  name,
  rating,
  isActive,
  captured,
  materialAdv,
  time,
  clockClass,
  side,
}: PlayerStripProps) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
        isActive
          ? "bg-[var(--surface-card)] border-[var(--primary-border)] shadow-md"
          : "bg-[var(--surface-main)]/50 border-[var(--surface-border)]"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex-shrink-0 border-2 flex items-center justify-center text-xs font-black ${
            side === "white"
              ? "bg-white text-gray-800 border-gray-300"
              : "bg-gray-800 text-white border-gray-600"
          }`}
        >
          {name[0]?.toUpperCase() ?? "?"}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white truncate max-w-[120px]">
              {name}
            </span>
            <span className="text-[11px] text-gray-500">{rating}</span>
          </div>

          {/* Captured pieces */}
          {captured.length > 0 && (
            <div className="flex items-center gap-px mt-0.5 flex-wrap">
              {captured.map((p, i) => (
                <span key={i} className="text-xs leading-none opacity-70">
                  {PIECE_SYMBOLS[p] || "♟"}
                </span>
              ))}
              {materialAdv > 0 && (
                <span className="text-[10px] text-gray-400 ml-1 font-medium">
                  +{materialAdv}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clock */}
      <div
        className={`px-3 py-1.5 rounded-lg font-mono text-base tabular-nums ${clockClass} ${
          isActive
            ? "bg-[var(--primary-muted)] border border-[var(--primary-border)]"
            : "bg-[var(--surface-main)]/60 border border-[var(--surface-border)]"
        }`}
      >
        {formatTime(time)}
      </div>
    </div>
  );
}