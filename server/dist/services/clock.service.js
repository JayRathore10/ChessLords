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
exports.applyElapsedTime = applyElapsedTime;
exports.remainingForTurn = remainingForTurn;
exports.isTimedOut = isTimedOut;
exports.applyIncrement = applyIncrement;
exports.clearGameTimeout = clearGameTimeout;
exports.scheduleGameTimeout = scheduleGameTimeout;
exports.handleAuthoritativeTimeout = handleAuthoritativeTimeout;
exports.clockPayload = clockPayload;
const game_model_1 = require("../models/game.model");
const stats_service_1 = require("./stats.service");
/** In-memory timeout timers keyed by gameId */
const timeoutTimers = new Map();
/**
 * Apply elapsed wall-clock time to the side whose turn it is.
 * Mutates the game document in place (does not save).
 */
function applyElapsedTime(game, now = new Date()) {
    if (!game.lastMoveAt || game.status !== "active") {
        return 0;
    }
    const elapsedMs = Math.max(0, now.getTime() - game.lastMoveAt.getTime());
    const elapsedSec = elapsedMs / 1000;
    if (game.turn === "white") {
        game.whiteTime = Math.max(0, game.whiteTime - elapsedSec);
    }
    else {
        game.blackTime = Math.max(0, game.blackTime - elapsedSec);
    }
    game.lastMoveAt = now;
    return elapsedSec;
}
/**
 * Remaining seconds for the player to move (after applying elapsed).
 */
function remainingForTurn(game) {
    return game.turn === "white" ? game.whiteTime : game.blackTime;
}
/**
 * True if the side to move has no time left.
 */
function isTimedOut(game) {
    return remainingForTurn(game) <= 0;
}
/**
 * Apply increment to the player who just moved (previous turn).
 */
function applyIncrement(game, movedColor) {
    var _a, _b;
    const increment = (_b = (_a = game.timeControl) === null || _a === void 0 ? void 0 : _a.increment) !== null && _b !== void 0 ? _b : 0;
    if (increment <= 0)
        return;
    if (movedColor === "white") {
        game.whiteTime += increment;
    }
    else {
        game.blackTime += increment;
    }
}
function clearGameTimeout(gameId) {
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
function scheduleGameTimeout(game, onTimeout) {
    const gameId = game._id.toString();
    clearGameTimeout(gameId);
    if (game.status !== "active")
        return;
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
function handleAuthoritativeTimeout(io, gameId, expectedLoser, expectedWinner) {
    return __awaiter(this, void 0, void 0, function* () {
        clearGameTimeout(gameId);
        const game = yield game_model_1.gameModel.findById(gameId);
        if (!game || game.status !== "active")
            return false;
        applyElapsedTime(game);
        // Only end if this side is still to move and out of time
        if (game.turn !== expectedLoser || !isTimedOut(game)) {
            // Reschedule if still active (e.g. move arrived just in time)
            if (game.status === "active") {
                scheduleGameTimeout(game, (id, loser, winner) => {
                    void handleAuthoritativeTimeout(io, id, loser, winner);
                });
            }
            yield game.save();
            return false;
        }
        if (expectedLoser === "white") {
            game.whiteTime = 0;
        }
        else {
            game.blackTime = 0;
        }
        game.status = "completed";
        game.result = expectedWinner;
        game.endedAt = new Date();
        yield game.save();
        (0, stats_service_1.recordCompletedGameStats)(game);
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
        console.log(`[Clock] ${expectedLoser} timed out in game ${gameId}. ${expectedWinner} wins.`);
        return true;
    });
}
/**
 * Sync payload for clients (remaining times + server timestamp for drift correction).
 */
function clockPayload(game) {
    var _a, _b;
    return {
        whiteTime: Math.max(0, game.whiteTime),
        blackTime: Math.max(0, game.blackTime),
        turn: game.turn,
        lastMoveAt: (_b = (_a = game.lastMoveAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null,
        serverTime: Date.now(),
    };
}
