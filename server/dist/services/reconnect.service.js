"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISCONNECT_GRACE_MS = void 0;
exports.clearPendingDisconnect = clearPendingDisconnect;
exports.getPendingDisconnect = getPendingDisconnect;
exports.clearAllPendingForGame = clearAllPendingForGame;
exports.startDisconnectGrace = startDisconnectGrace;
exports.handlePlayerReconnected = handlePlayerReconnected;
const game_model_1 = require("../models/game.model");
const clock_service_1 = require("./clock.service");
const stats_service_1 = require("./stats.service");
exports.DISCONNECT_GRACE_MS = 60000;
/** Keyed by `${gameId}:${color}` */
const pendingDisconnects = new Map();
function key(gameId, color) {
    return `${gameId}:${color}`;
}
function clearPendingDisconnect(gameId, color) {
    const k = key(gameId, color);
    const pending = pendingDisconnects.get(k);
    if (!pending)
        return false;
    clearTimeout(pending.timer);
    pendingDisconnects.delete(k);
    return true;
}
function getPendingDisconnect(gameId, color) {
    return pendingDisconnects.get(key(gameId, color));
}
function clearAllPendingForGame(gameId) {
    clearPendingDisconnect(gameId, "white");
    clearPendingDisconnect(gameId, "black");
}
function forfeitAfterGrace(io, gameId, color) {
    return __awaiter(this, void 0, void 0, function* () {
        pendingDisconnects.delete(key(gameId, color));
        (0, clock_service_1.clearGameTimeout)(gameId);
        const winner = color === "white" ? "black" : "white";
        const updated = yield game_model_1.gameModel.findOneAndUpdate({ _id: gameId, status: "active" }, {
            $set: {
                status: "completed",
                result: winner,
                endedAt: new Date(),
            },
        }, { new: true });
        if (!updated)
            return;
        (0, stats_service_1.recordCompletedGameStats)(updated);
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
        console.log(`[Reconnect] ${color} failed to reconnect to ${gameId} within grace period. ${winner} wins.`);
    });
}
/**
 * Start (or refresh) the 60s disconnect grace period for a seated player.
 */
function startDisconnectGrace(io, gameId, color, meta) {
    clearPendingDisconnect(gameId, color);
    const expiresAt = Date.now() + exports.DISCONNECT_GRACE_MS;
    const timer = setTimeout(() => {
        void forfeitAfterGrace(io, gameId, color);
    }, exports.DISCONNECT_GRACE_MS);
    pendingDisconnects.set(key(gameId, color), {
        gameId,
        color,
        userId: meta === null || meta === void 0 ? void 0 : meta.userId,
        username: meta === null || meta === void 0 ? void 0 : meta.username,
        timer,
        expiresAt,
    });
    io.to(`game:${gameId}`).emit("opponentDisconnected", {
        gameId,
        color,
        username: meta === null || meta === void 0 ? void 0 : meta.username,
        graceMs: exports.DISCONNECT_GRACE_MS,
        expiresAt,
    });
    console.log(`[Reconnect] ${color} disconnected from ${gameId}; ${exports.DISCONNECT_GRACE_MS / 1000}s grace started`);
}
/**
 * Clear grace period when a player successfully rejoins. Returns true if they were pending.
 */
function handlePlayerReconnected(io, gameId, color, username) {
    const wasPending = clearPendingDisconnect(gameId, color);
    if (!wasPending)
        return false;
    io.to(`game:${gameId}`).emit("opponentReconnected", {
        gameId,
        color,
        username,
    });
    console.log(`[Reconnect] ${color} reconnected to ${gameId}`);
    return true;
}
