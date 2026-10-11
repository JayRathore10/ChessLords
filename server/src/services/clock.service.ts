import { Server } from "socket.io";
import { gameModel, GameInterface } from "../models/game.model";

type TimeoutCallback = (
  gameId: string,
  loser: "white" | "black",
  winner: "white" | "black"
) => void;

/** In-memory timeout timers keyed by gameId */
const timeoutTimers = new Map<string, NodeJS.Timeout>();

/**
 * Apply elapsed wall-clock time to the side whose turn it is.
 * Mutates the game document in place (does not save).
 */
export function applyElapsedTime(game: GameInterface, now = new Date()): number {
  if (!game.lastMoveAt || game.status !== "active") {
    return 0;
  }

  const elapsedMs = Math.max(0, now.getTime() - game.lastMoveAt.getTime());
  const elapsedSec = elapsedMs / 1000;

  if (game.turn === "white") {
    game.whiteTime = Math.max(0, game.whiteTime - elapsedSec);
  } else {
    game.blackTime = Math.max(0, game.blackTime - elapsedSec);
  }

  game.lastMoveAt = now;
  return elapsedSec;
}

/**
 * Remaining seconds for the player to move (after applying elapsed).
 */
export function remainingForTurn(game: GameInterface): number {
  return game.turn === "white" ? game.whiteTime : game.blackTime;
}

/**
 * True if the side to move has no time left.
 */
export function isTimedOut(game: GameInterface): boolean {
  return remainingForTurn(game) <= 0;
}

/**
 * Apply increment to the player who just moved (previous turn).
 */
export function applyIncrement(
  game: GameInterface,
  movedColor: "white" | "black"
): void {
  const increment = game.timeControl?.increment ?? 0;
  if (increment <= 0) return;

  if (movedColor === "white") {
    game.whiteTime += increment;
  } else {
    game.blackTime += increment;
  }
}

export function clearGameTimeout(gameId: string): void {
  const existing = timeoutTimers.get(gameId);
  if (existing) {
    clearTimeout(existing);
    timeoutTimers.delete(gameId);
  }
}

/**
 * Schedule an authoritative timeout for the current turn.
 * Clears any previous timer for this game.
 */
export function scheduleGameTimeout(
  game: GameInterface,
  onTimeout: TimeoutCallback
): void {
  const gameId = game._id.toString();
  clearGameTimeout(gameId);

  if (game.status !== "active") return;

  const remaining = remainingForTurn(game);
  if (remaining <= 0) {
    const loser = game.turn;
    const winner = loser === "white" ? "black" : "white";
    // Defer so callers can finish saving first if needed
    const timer = setTimeout(() => onTimeout(gameId, loser, winner), 0);
    timeoutTimers.set(gameId, timer);
    return;
  }

  // Small buffer so floating-point / network lag doesn't fire early
  const delayMs = Math.ceil(remaining * 1000) + 50;
  const loser = game.turn;
  const winner = loser === "white" ? "black" : "white";

  const timer = setTimeout(() => {
    timeoutTimers.delete(gameId);
    onTimeout(gameId, loser, winner);
  }, delayMs);

  timeoutTimers.set(gameId, timer);
}

/**
 * Handle an authoritative timeout: re-fetch, re-apply elapsed, end game if still valid.
 */
export async function handleAuthoritativeTimeout(
  io: Server,
  gameId: string,
  expectedLoser: "white" | "black",
  expectedWinner: "white" | "black"
): Promise<boolean> {
  clearGameTimeout(gameId);

  const game = await gameModel.findById(gameId);
  if (!game || game.status !== "active") return false;

  applyElapsedTime(game);

  // Only end if this side is still to move and out of time
  if (game.turn !== expectedLoser || !isTimedOut(game)) {
    // Reschedule if still active (e.g. move arrived just in time)
    if (game.status === "active") {
      scheduleGameTimeout(game, (id, loser, winner) => {
        void handleAuthoritativeTimeout(io, id, loser, winner);
      });
    }
    await game.save();
    return false;
  }

  if (expectedLoser === "white") {
    game.whiteTime = 0;
  } else {
    game.blackTime = 0;
  }

  game.status = "completed";
  game.result = expectedWinner;
  game.endedAt = new Date();
  await game.save();

  io.to(`game:${gameId}`).emit("clockUpdate", {
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
    turn: game.turn,
    serverTime: Date.now(),
  });

  io.to(`game:${gameId}`).emit("gameOver", {
    result: expectedWinner,
    reason: "timeout",
    winner: expectedWinner,
    loser: expectedLoser,
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
  });

  console.log(
    `[Clock] ${expectedLoser} timed out in game ${gameId}. ${expectedWinner} wins.`
  );
  return true;
}

/**
 * Sync payload for clients (remaining times + server timestamp for drift correction).
 */
export function clockPayload(game: GameInterface) {
  return {
    whiteTime: Math.max(0, game.whiteTime),
    blackTime: Math.max(0, game.blackTime),
    turn: game.turn,
    lastMoveAt: game.lastMoveAt?.toISOString() ?? null,
    serverTime: Date.now(),
  };
}
