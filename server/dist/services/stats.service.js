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
exports.getFormatFromTimeControl = getFormatFromTimeControl;
exports.calculateEloDelta = calculateEloDelta;
exports.recordCompletedGameStats = recordCompletedGameStats;
exports.getUserStatistics = getUserStatistics;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
const game_model_1 = require("../models/game.model");
function getFormatFromTimeControl(tc) {
    if (!tc || typeof tc.initialTime !== "number")
        return "Rapid";
    const seconds = tc.initialTime;
    if (seconds < 180)
        return "Bullet";
    if (seconds <= 300)
        return "Blitz";
    if (seconds <= 1800)
        return "Rapid";
    return "Classical";
}
/**
 * Calculates rating delta using standard ELO formula (K=32).
 */
function calculateEloDelta(playerRating, opponentRating, outcome, kFactor = 32) {
    const actual = outcome === "win" ? 1 : outcome === "draw" ? 0.5 : 0;
    const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    let delta = Math.round(kFactor * (actual - expected));
    if (delta === 0 && outcome === "win")
        delta = 1;
    if (delta === 0 && outcome === "loss")
        delta = -1;
    return delta;
}
/**
 * Updates users' gamesPlayed, wins, losses, draws, rating, and ratingHistory upon game completion.
 */
function recordCompletedGameStats(game) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!game || game.status !== "completed" || !game.result || game.result === "none")
                return;
            if (game.isPassAndPlay)
                return;
            if (game.statsRecorded)
                return;
            game.statsRecorded = true;
            yield game.save();
            const format = getFormatFromTimeControl(game.timeControl);
            const whiteId = game.whitePlayer;
            const blackId = game.blackPlayer;
            if (whiteId && mongoose_1.Types.ObjectId.isValid(whiteId.toString())) {
                const whiteUser = yield user_model_1.userModel.findById(whiteId);
                if (whiteUser) {
                    const outcome = game.result === "white" ? "win" : game.result === "draw" ? "draw" : "loss";
                    const opponentRating = game.blackPlayerRating || 1200;
                    const currentRating = whiteUser.rating || 1200;
                    let delta = 0;
                    if (game.gameType === "rated") {
                        delta = calculateEloDelta(currentRating, opponentRating, outcome);
                    }
                    const newRating = Math.max(100, currentRating + delta);
                    whiteUser.rating = newRating;
                    whiteUser.gamesPlayed = (whiteUser.gamesPlayed || 0) + 1;
                    if (outcome === "win")
                        whiteUser.gamesWon = (whiteUser.gamesWon || 0) + 1;
                    else if (outcome === "loss")
                        whiteUser.gamesLost = (whiteUser.gamesLost || 0) + 1;
                    else
                        whiteUser.gamesDrawn = (whiteUser.gamesDrawn || 0) + 1;
                    if (!whiteUser.ratingHistory)
                        whiteUser.ratingHistory = [];
                    whiteUser.ratingHistory.push({
                        rating: newRating,
                        date: game.endedAt || new Date(),
                        change: delta,
                        gameId: game._id,
                        opponent: game.blackPlayerName || "Opponent",
                        result: outcome,
                    });
                    yield whiteUser.save();
                }
            }
            if (blackId && mongoose_1.Types.ObjectId.isValid(blackId.toString())) {
                const blackUser = yield user_model_1.userModel.findById(blackId);
                if (blackUser) {
                    const outcome = game.result === "black" ? "win" : game.result === "draw" ? "draw" : "loss";
                    const opponentRating = game.whitePlayerRating || 1200;
                    const currentRating = blackUser.rating || 1200;
                    let delta = 0;
                    if (game.gameType === "rated") {
                        delta = calculateEloDelta(currentRating, opponentRating, outcome);
                    }
                    const newRating = Math.max(100, currentRating + delta);
                    blackUser.rating = newRating;
                    blackUser.gamesPlayed = (blackUser.gamesPlayed || 0) + 1;
                    if (outcome === "win")
                        blackUser.gamesWon = (blackUser.gamesWon || 0) + 1;
                    else if (outcome === "loss")
                        blackUser.gamesLost = (blackUser.gamesLost || 0) + 1;
                    else
                        blackUser.gamesDrawn = (blackUser.gamesDrawn || 0) + 1;
                    if (!blackUser.ratingHistory)
                        blackUser.ratingHistory = [];
                    blackUser.ratingHistory.push({
                        rating: newRating,
                        date: game.endedAt || new Date(),
                        change: delta,
                        gameId: game._id,
                        opponent: game.whitePlayerName || "Opponent",
                        result: outcome,
                    });
                    yield blackUser.save();
                }
            }
        }
        catch (err) {
            console.error("Error in recordCompletedGameStats:", err);
        }
    });
}
/**
 * Computes full user statistics including rating progression chart data and historical breakdowns.
 */
function getUserStatistics(user) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const userIdStr = user._id.toString();
        // Fetch all completed/abandoned games for this user in chronological order
        const games = yield game_model_1.gameModel
            .find({
            $or: [{ whitePlayer: user._id }, { blackPlayer: user._id }],
            status: { $in: ["completed", "abandoned"] },
        })
            .sort({ createdAt: 1 })
            .select("whitePlayer blackPlayer whitePlayerName blackPlayerName whitePlayerRating blackPlayerRating result timeControl gameType status moves createdAt endedAt");
        // Format breakdowns
        const formatMap = {
            Bullet: { won: 0, lost: 0, drawn: 0 },
            Blitz: { won: 0, lost: 0, drawn: 0 },
            Rapid: { won: 0, lost: 0, drawn: 0 },
            Classical: { won: 0, lost: 0, drawn: 0 },
        };
        // Color breakdowns
        const colorMap = {
            white: { won: 0, lost: 0, drawn: 0 },
            black: { won: 0, lost: 0, drawn: 0 },
        };
        const outcomes = [];
        const processedMatches = [];
        // Progression calculation
        let runningRating = 1200;
        const ratingProgression = [];
        // Base starting point
        const baseDate = user.createdAt
            ? new Date(user.createdAt).toISOString()
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        ratingProgression.push({
            date: baseDate,
            rating: 1200,
            change: 0,
            opponent: "Starting Rating",
            opponentRating: 1200,
            result: "draw",
            format: "Rapid",
        });
        // Map user.ratingHistory by gameId for fast lookup if stored
        const storedHistoryByGameId = new Map();
        if (user.ratingHistory && Array.isArray(user.ratingHistory)) {
            for (const entry of user.ratingHistory) {
                if (entry.gameId) {
                    storedHistoryByGameId.set(entry.gameId.toString(), {
                        rating: entry.rating,
                        change: entry.change,
                    });
                }
            }
        }
        for (const game of games) {
            const isWhite = ((_a = game.whitePlayer) === null || _a === void 0 ? void 0 : _a.toString()) === userIdStr;
            const opponentName = isWhite
                ? game.blackPlayerName || "Black"
                : game.whitePlayerName || "White";
            const opponentRating = isWhite
                ? game.blackPlayerRating || 1200
                : game.whitePlayerRating || 1200;
            let outcome;
            if (game.result === "draw" || game.result === "none") {
                outcome = "draw";
            }
            else if ((game.result === "white" && isWhite) ||
                (game.result === "black" && !isWhite)) {
                outcome = "win";
            }
            else {
                outcome = "loss";
            }
            outcomes.push(outcome);
            const format = getFormatFromTimeControl(game.timeControl);
            if (formatMap[format]) {
                if (outcome === "win")
                    formatMap[format].won++;
                else if (outcome === "loss")
                    formatMap[format].lost++;
                else
                    formatMap[format].drawn++;
            }
            const colorKey = isWhite ? "white" : "black";
            if (outcome === "win")
                colorMap[colorKey].won++;
            else if (outcome === "loss")
                colorMap[colorKey].lost++;
            else
                colorMap[colorKey].drawn++;
            // Calculate rating change
            let delta = 0;
            const stored = storedHistoryByGameId.get(game._id.toString());
            if (stored) {
                delta = stored.change;
                runningRating = stored.rating;
            }
            else {
                delta = calculateEloDelta(runningRating, opponentRating, outcome);
                runningRating = Math.max(100, runningRating + delta);
            }
            const gameDate = game.endedAt || game.createdAt || new Date();
            const isoDate = new Date(gameDate).toISOString();
            ratingProgression.push({
                date: isoDate,
                rating: runningRating,
                change: delta,
                opponent: opponentName,
                opponentRating,
                result: outcome,
                format,
                gameId: game._id.toString(),
            });
            const formattedDate = new Date(gameDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            const timeControlName = ((_b = game.timeControl) === null || _b === void 0 ? void 0 : _b.name) ||
                (((_c = game.timeControl) === null || _c === void 0 ? void 0 : _c.initialTime)
                    ? `${Math.floor(game.timeControl.initialTime / 60)}+${game.timeControl.increment || 0}`
                    : "Standard");
            processedMatches.push({
                id: game._id.toString(),
                date: isoDate,
                formattedDate,
                timeControlName,
                format,
                userColor: isWhite ? "white" : "black",
                opponentName,
                opponentRating,
                result: outcome,
                movesCount: game.moves ? game.moves.length : 0,
                ratingChange: delta,
                status: game.status,
            });
        }
        // If user has a stored rating and we have played games, ensure latest point reflects user.rating
        if (games.length > 0 && user.rating && user.rating !== runningRating) {
            // Calibrate last point so it displays the verified user rating
            ratingProgression[ratingProgression.length - 1].rating = user.rating;
        }
        // Calculate streaks
        let currentStreakCount = 0;
        let currentStreakType = "none";
        if (outcomes.length > 0) {
            currentStreakType = outcomes[outcomes.length - 1];
            for (let i = outcomes.length - 1; i >= 0; i--) {
                if (outcomes[i] === currentStreakType) {
                    currentStreakCount++;
                }
                else {
                    break;
                }
            }
        }
        let bestWinStreak = 0;
        let tempWinStreak = 0;
        for (const oc of outcomes) {
            if (oc === "win") {
                tempWinStreak++;
                if (tempWinStreak > bestWinStreak)
                    bestWinStreak = tempWinStreak;
            }
            else {
                tempWinStreak = 0;
            }
        }
        const recentForm = outcomes.slice(-10);
        const recentWins = recentForm.filter((o) => o === "win").length;
        const winRateLast10 = recentForm.length > 0 ? Math.round((recentWins / recentForm.length) * 100) : 0;
        // Rating metrics
        const ratingsList = ratingProgression.map((p) => p.rating);
        const currentRating = user.rating || 1200;
        const peakRating = Math.max(1200, currentRating, ...ratingsList);
        const lowestRating = Math.min(1200, currentRating, ...ratingsList);
        const ratingChange = currentRating - 1200;
        // Format breakdowns array
        const byFormat = ["Bullet", "Blitz", "Rapid", "Classical"].map((fmt) => {
            const data = formatMap[fmt];
            const total = data.won + data.lost + data.drawn;
            return {
                format: fmt,
                gamesPlayed: total,
                won: data.won,
                lost: data.lost,
                drawn: data.drawn,
                winRate: total > 0 ? Math.round((data.won / total) * 100) : 0,
            };
        });
        const whiteTotal = colorMap.white.won + colorMap.white.lost + colorMap.white.drawn;
        const blackTotal = colorMap.black.won + colorMap.black.lost + colorMap.black.drawn;
        const totalCalculatedPlayed = outcomes.length;
        const totalCalculatedWon = outcomes.filter((o) => o === "win").length;
        const totalCalculatedLost = outcomes.filter((o) => o === "loss").length;
        const totalCalculatedDrawn = outcomes.filter((o) => o === "draw").length;
        const effectivePlayed = Math.max(user.gamesPlayed || 0, totalCalculatedPlayed);
        const effectiveWon = totalCalculatedPlayed > 0 ? totalCalculatedWon : (user.gamesWon || 0);
        const effectiveLost = totalCalculatedPlayed > 0 ? totalCalculatedLost : (user.gamesLost || 0);
        const effectiveDrawn = totalCalculatedPlayed > 0 ? totalCalculatedDrawn : (user.gamesDrawn || 0);
        const effectiveWinRate = effectivePlayed > 0 ? Math.round((effectiveWon / effectivePlayed) * 100) : 0;
        // Recent matches in reverse chronological order (newest first, max 20)
        const recentMatches = processedMatches.reverse().slice(0, 20);
        return {
            userId: user._id.toString(),
            username: user.username,
            name: user.name,
            profilePic: user.profilePic,
            bio: user.bio || "",
            rating: currentRating,
            peakRating,
            lowestRating,
            ratingChange,
            gamesPlayed: effectivePlayed,
            gamesWon: effectiveWon,
            gamesLost: effectiveLost,
            gamesDrawn: effectiveDrawn,
            winRate: effectiveWinRate,
            ratingHistory: ratingProgression,
            historicalBreakdown: {
                byFormat,
                byColor: {
                    white: {
                        gamesPlayed: whiteTotal,
                        won: colorMap.white.won,
                        lost: colorMap.white.lost,
                        drawn: colorMap.white.drawn,
                        winRate: whiteTotal > 0 ? Math.round((colorMap.white.won / whiteTotal) * 100) : 0,
                    },
                    black: {
                        gamesPlayed: blackTotal,
                        won: colorMap.black.won,
                        lost: colorMap.black.lost,
                        drawn: colorMap.black.drawn,
                        winRate: blackTotal > 0 ? Math.round((colorMap.black.won / blackTotal) * 100) : 0,
                    },
                },
                streaks: {
                    currentStreak: {
                        count: currentStreakCount,
                        type: currentStreakType,
                    },
                    bestWinStreak,
                    recentForm,
                    winRateLast10,
                },
                recentMatches,
            },
        };
    });
}
