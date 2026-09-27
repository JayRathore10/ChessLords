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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLobbyStats = exports.joinGame = exports.getGameByInviteCode = exports.getGameById = exports.createGame = void 0;
const chess_js_1 = require("chess.js");
const game_model_1 = require("../models/game.model");
const user_model_1 = require("../models/user.model");
const chess_service_1 = require("../services/chess.service");
const mongoose_1 = __importDefault(require("mongoose"));
// Generate random 6-character alphanumeric invite code
const generateInviteCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
// Create a new game (Direct, Custom Invite, or Pass-and-Play)
const createGame = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { whitePlayer, blackPlayer, whitePlayerName, blackPlayerName, whitePlayerRating, blackPlayerRating, gameType = "casual", initialTime = 600, increment = 0, timeControlName, isPrivate = false, isPassAndPlay = false, preferredColor = "random", // 'white', 'black', or 'random'
        creatorId, creatorName, creatorRating, } = req.body;
        const chess = new chess_js_1.Chess();
        // Determine initial time control title if not provided
        const minutes = Math.floor(initialTime / 60);
        const tcTitle = timeControlName ||
            `${minutes}+${increment}`;
        // Pass and Play mode: both seats are local
        if (isPassAndPlay) {
            const game = yield game_model_1.gameModel.create({
                whitePlayerName: whitePlayerName || "Player 1 (White)",
                blackPlayerName: blackPlayerName || "Player 2 (Black)",
                whitePlayerRating: 1200,
                blackPlayerRating: 1200,
                gameType: "casual",
                status: "active",
                isPassAndPlay: true,
                isPrivate: false,
                result: "none",
                moves: [],
                currentPosition: chess.fen(),
                turn: "white",
                timeControl: {
                    initialTime,
                    increment,
                    name: tcTitle,
                },
                whiteTime: initialTime,
                blackTime: initialTime,
                startedAt: new Date(),
            });
            (0, chess_service_1.createChessGame)(game._id.toString(), chess.fen());
            return res.status(201).json({
                success: true,
                game,
            });
        }
        // Custom Room Invite mode (1 player creates, waiting for opponent)
        if (!blackPlayer && (!whitePlayer || isPrivate || !blackPlayer)) {
            let chosenWhitePlayer = undefined;
            let chosenBlackPlayer = undefined;
            let chosenWhiteName = "White";
            let chosenBlackName = "Black";
            let chosenWhiteRating = 1200;
            let chosenBlackRating = 1200;
            const isHostWhite = preferredColor === "white"
                ? true
                : preferredColor === "black"
                    ? false
                    : Math.random() < 0.5;
            const validCreatorId = creatorId && mongoose_1.default.Types.ObjectId.isValid(creatorId)
                ? new mongoose_1.default.Types.ObjectId(creatorId)
                : undefined;
            if (isHostWhite) {
                chosenWhitePlayer = validCreatorId;
                chosenWhiteName = creatorName || "Player 1";
                chosenWhiteRating = creatorRating || 1200;
            }
            else {
                chosenBlackPlayer = validCreatorId;
                chosenBlackName = creatorName || "Player 1";
                chosenBlackRating = creatorRating || 1200;
            }
            const inviteCode = generateInviteCode();
            const game = yield game_model_1.gameModel.create({
                whitePlayer: chosenWhitePlayer,
                blackPlayer: chosenBlackPlayer,
                whitePlayerName: chosenWhiteName,
                blackPlayerName: chosenBlackName,
                whitePlayerRating: chosenWhiteRating,
                blackPlayerRating: chosenBlackRating,
                inviteCode,
                isPrivate: true,
                gameType,
                status: "waiting",
                result: "none",
                moves: [],
                currentPosition: chess.fen(),
                turn: "white",
                timeControl: {
                    initialTime,
                    increment,
                    name: tcTitle,
                },
                whiteTime: initialTime,
                blackTime: initialTime,
            });
            (0, chess_service_1.createChessGame)(game._id.toString(), chess.fen());
            return res.status(201).json({
                success: true,
                game,
                inviteCode,
            });
        }
        // Direct game with both players specified
        const validWhite = whitePlayer && mongoose_1.default.Types.ObjectId.isValid(whitePlayer)
            ? new mongoose_1.default.Types.ObjectId(whitePlayer)
            : undefined;
        const validBlack = blackPlayer && mongoose_1.default.Types.ObjectId.isValid(blackPlayer)
            ? new mongoose_1.default.Types.ObjectId(blackPlayer)
            : undefined;
        const game = yield game_model_1.gameModel.create({
            whitePlayer: validWhite,
            blackPlayer: validBlack,
            whitePlayerName: whitePlayerName || "White",
            blackPlayerName: blackPlayerName || "Black",
            whitePlayerRating: whitePlayerRating || 1200,
            blackPlayerRating: blackPlayerRating || 1200,
            gameType,
            status: "active",
            result: "none",
            moves: [],
            currentPosition: chess.fen(),
            turn: "white",
            timeControl: {
                initialTime,
                increment,
                name: tcTitle,
            },
            whiteTime: initialTime,
            blackTime: initialTime,
            startedAt: new Date(),
        });
        (0, chess_service_1.createChessGame)(game._id.toString(), chess.fen());
        return res.status(201).json({
            success: true,
            game,
        });
    }
    catch (error) {
        console.error("Create game error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create game",
        });
    }
});
exports.createGame = createGame;
// Get Game by ID
const getGameById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gameId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(gameId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid game ID format",
            });
        }
        const game = yield game_model_1.gameModel
            .findById(gameId)
            .populate("whitePlayer", "username name rating profilePic")
            .populate("blackPlayer", "username name rating profilePic");
        if (!game) {
            return res.status(404).json({
                success: false,
                message: "Game not found",
            });
        }
        return res.status(200).json({
            success: true,
            game,
        });
    }
    catch (error) {
        console.error("Get game error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve game details",
        });
    }
});
exports.getGameById = getGameById;
// Get Game by Invite Code
const getGameByInviteCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { inviteCode } = req.params;
        const game = yield game_model_1.gameModel
            .findOne({ inviteCode: inviteCode.toUpperCase() })
            .populate("whitePlayer", "username name rating profilePic")
            .populate("blackPlayer", "username name rating profilePic");
        if (!game) {
            return res.status(404).json({
                success: false,
                message: "Invalid or expired invite code",
            });
        }
        return res.status(200).json({
            success: true,
            game,
        });
    }
    catch (error) {
        console.error("Get game by invite code error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve game by invite code",
        });
    }
});
exports.getGameByInviteCode = getGameByInviteCode;
// Join Game by ID or Invite Code
const joinGame = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { gameId } = req.params;
        const { userId, username, rating } = req.body;
        let game;
        if (mongoose_1.default.Types.ObjectId.isValid(gameId)) {
            game = yield game_model_1.gameModel.findById(gameId);
        }
        else {
            game = yield game_model_1.gameModel.findOne({ inviteCode: gameId.toUpperCase() });
        }
        if (!game) {
            return res.status(404).json({
                success: false,
                message: "Game not found",
            });
        }
        const validUserId = userId && mongoose_1.default.Types.ObjectId.isValid(userId)
            ? new mongoose_1.default.Types.ObjectId(userId)
            : undefined;
        // If game is already active and user is already a player in it
        const isWhite = (validUserId && ((_a = game.whitePlayer) === null || _a === void 0 ? void 0 : _a.toString()) === validUserId.toString()) ||
            (username && game.whitePlayerName === username);
        const isBlack = (validUserId && ((_b = game.blackPlayer) === null || _b === void 0 ? void 0 : _b.toString()) === validUserId.toString()) ||
            (username && game.blackPlayerName === username);
        if (isWhite || isBlack) {
            return res.status(200).json({
                success: true,
                game,
                assignedColor: isWhite ? "white" : "black",
            });
        }
        // If game is waiting for player 2
        if (game.status === "waiting") {
            let assignedColor = "white";
            if (!game.whitePlayer && !((_c = game.whitePlayerName) === null || _c === void 0 ? void 0 : _c.length)) {
                game.whitePlayer = validUserId;
                game.whitePlayerName = username || "Guest (White)";
                game.whitePlayerRating = rating || 1200;
                assignedColor = "white";
            }
            else if (!game.blackPlayer && (!game.blackPlayerName || game.blackPlayerName === "Black")) {
                game.blackPlayer = validUserId;
                game.blackPlayerName = username || "Guest (Black)";
                game.blackPlayerRating = rating || 1200;
                assignedColor = "black";
            }
            else if (!game.whitePlayer) {
                game.whitePlayer = validUserId;
                game.whitePlayerName = username || "Guest (White)";
                game.whitePlayerRating = rating || 1200;
                assignedColor = "white";
            }
            else {
                game.blackPlayer = validUserId;
                game.blackPlayerName = username || "Guest (Black)";
                game.blackPlayerRating = rating || 1200;
                assignedColor = "black";
            }
            game.status = "active";
            game.startedAt = new Date();
            yield game.save();
            (0, chess_service_1.createChessGame)(game._id.toString(), game.currentPosition);
            return res.status(200).json({
                success: true,
                game,
                assignedColor,
            });
        }
        return res.status(400).json({
            success: false,
            message: "Game is already in progress or completed",
        });
    }
    catch (error) {
        console.error("Join game error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to join game",
        });
    }
});
exports.joinGame = joinGame;
// Get Lobby Statistics
const getLobbyStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activeGamesCount = yield game_model_1.gameModel.countDocuments({
            status: "active",
        });
        const totalGamesCount = yield game_model_1.gameModel.countDocuments();
        const onlineUsersCount = yield user_model_1.userModel.countDocuments({
            isOnline: true,
        });
        const recentGames = yield game_model_1.gameModel
            .find({ status: { $in: ["active", "completed"] } })
            .sort({ createdAt: -1 })
            .limit(6)
            .select("whitePlayerName blackPlayerName timeControl status result createdAt");
        return res.status(200).json({
            success: true,
            stats: {
                activeGames: activeGamesCount,
                totalGames: totalGamesCount,
                onlinePlayers: Math.max(onlineUsersCount, 1),
            },
            recentGames,
        });
    }
    catch (error) {
        console.error("Get lobby stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get lobby statistics",
        });
    }
});
exports.getLobbyStats = getLobbyStats;
