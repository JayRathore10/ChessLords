import { Server } from "socket.io";
import { gameModel } from "../models/game.model";
import { clearGameTimeout } from "./clock.service";

export const DISCONNECT_GRACE_MS = 60_000;

interface PendingDisconnect {
  gameId: string;
  color: "white" | "black";
  userId?: string;
  username?: string;
  timer: NodeJS.Timeout;
  expiresAt: number;
}

/** Keyed by `${gameId}:${color}` */
const pendingDisconnects = new Map<string, PendingDisconnect>();

function key(gameId: string, color: "white" | "black") {
  return `${gameId}:${color}`;
}

export function clearPendingDisconnect(
  gameId: string,
  color: "white" | "black"
): boolean {
  const k = key(gameId, color);
  const pending = pendingDisconnects.get(k);
  if (!pending) return false;
  clearTimeout(pending.timer);
  pendingDisconnects.delete(k);
  return true;
}

export function getPendingDisconnect(
  gameId: string,
  color: "white" | "black"
): PendingDisconnect | undefined {
  return pendingDisconnects.get(key(gameId, color));
}

export function clearAllPendingForGame(gameId: string): void {
  clearPendingDisconnect(gameId, "white");
  clearPendingDisconnect(gameId, "black");
}

async function forfeitAfterGrace(
  io: Server,
  gameId: string,
  color: "white" | "black"
): Promise<void> {
  pendingDisconnects.delete(key(gameId, color));
  clearGameTimeout(gameId);

  const winner = color === "white" ? "black" : "white";

  const updated = await gameModel.findOneAndUpdate(
    { _id: gameId, status: "active" },
    {
      $set: {
        status: "completed",
        result: winner,
        endedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!updated) return;

  io.to(`game:${gameId}`).emit("gameOver", {
    result: winner,
    winner,
    loser: color,
    reason: "disconnect_timeout",
  });

  io.to(`game:${gameId}`).emit("opponentAbandoned", {
    gameId,
    color,
    winner,
    reason: "disconnect_timeout",
  });

  console.log(
    `[Reconnect] ${color} failed to reconnect to ${gameId} within grace period. ${winner} wins.`
  );
}

/**
 * Start (or refresh) the 60s disconnect grace period for a seated player.
 */
export function startDisconnectGrace(
  io: Server,
  gameId: string,
  color: "white" | "black",
  meta?: { userId?: string; username?: string }
): void {
  clearPendingDisconnect(gameId, color);

  const expiresAt = Date.now() + DISCONNECT_GRACE_MS;
  const timer = setTimeout(() => {
    void forfeitAfterGrace(io, gameId, color);
  }, DISCONNECT_GRACE_MS);

  pendingDisconnects.set(key(gameId, color), {
    gameId,
    color,
    userId: meta?.userId,
    username: meta?.username,
    timer,
    expiresAt,
  });

  io.to(`game:${gameId}`).emit("opponentDisconnected", {
    gameId,
    color,
    username: meta?.username,
    graceMs: DISCONNECT_GRACE_MS,
    expiresAt,
  });

  console.log(
    `[Reconnect] ${color} disconnected from ${gameId}; ${DISCONNECT_GRACE_MS / 1000}s grace started`
  );
}

/**
 * Clear grace period when a player successfully rejoins. Returns true if they were pending.
 */
export function handlePlayerReconnected(
  io: Server,
  gameId: string,
  color: "white" | "black",
  username?: string
): boolean {
  const wasPending = clearPendingDisconnect(gameId, color);
  if (!wasPending) return false;

  io.to(`game:${gameId}`).emit("opponentReconnected", {
    gameId,
    color,
    username,
  });

  console.log(`[Reconnect] ${color} reconnected to ${gameId}`);
  return true;
}
