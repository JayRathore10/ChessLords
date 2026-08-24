import { Request, Response } from "express";
import { Chess } from "chess.js";
import { gameModel } from "../models/game.model";
import { userModel } from "../models/user.model";
import { createChessGame } from "../services/chess.service";
import mongoose from "mongoose";

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
export const createGame = async (req: Request, res: Response) => {
  try {
    const {
      whitePlayer,
      blackPlayer,
      whitePlayerName,
      blackPlayerName,
      whitePlayerRating,
      blackPlayerRating,
      gameType = "casual",
      initialTime = 600,
      increment = 0,
      timeControlName,
      isPrivate = false,
      isPassAndPlay = false,
      preferredColor = "random", // 'white', 'black', or 'random'
      creatorId,
      creatorName,
      creatorRating,
    } = req.body;

    const chess = new Chess();

    // Determine initial time control title if not provided
    const minutes = Math.floor(initialTime / 60);
    const tcTitle =
      timeControlName ||
      `${minutes}+${increment}`;

    // Pass and Play mode: both seats are local
    if (isPassAndPlay) {
      const game = await gameModel.create({
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

      createChessGame(game._id.toString(), chess.fen());

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

      const isHostWhite =
        preferredColor === "white"
          ? true
          : preferredColor === "black"
          ? false
          : Math.random() < 0.5;

      const validCreatorId =
        creatorId && mongoose.Types.ObjectId.isValid(creatorId)
          ? new mongoose.Types.ObjectId(creatorId)
          : undefined;

      if (isHostWhite) {
        chosenWhitePlayer = validCreatorId;
        chosenWhiteName = creatorName || "Player 1";
        chosenWhiteRating = creatorRating || 1200;
      } else {
        chosenBlackPlayer = validCreatorId;
        chosenBlackName = creatorName || "Player 1";
        chosenBlackRating = creatorRating || 1200;
      }

      const inviteCode = generateInviteCode();

      const game = await gameModel.create({
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

      createChessGame(game._id.toString(), chess.fen());

      return res.status(201).json({
        success: true,
        game,
        inviteCode,
      });
    }

    // Direct game with both players specified
    const validWhite =
      whitePlayer && mongoose.Types.ObjectId.isValid(whitePlayer)
        ? new mongoose.Types.ObjectId(whitePlayer)
        : undefined;
    const validBlack =
      blackPlayer && mongoose.Types.ObjectId.isValid(blackPlayer)
        ? new mongoose.Types.ObjectId(blackPlayer)
        : undefined;

    const game = await gameModel.create({
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

    createChessGame(game._id.toString(), chess.fen());

    return res.status(201).json({
      success: true,
      game,
    });
  } catch (error) {
    console.error("Create game error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create game",
    });
  }
};

// Get Game by ID
export const getGameById = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID format",
      });
    }

    const game = await gameModel
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
  } catch (error) {
    console.error("Get game error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve game details",
    });
  }
};

// Get Game by Invite Code
export const getGameByInviteCode = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.params;

    const game = await gameModel
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
  } catch (error) {
    console.error("Get game by invite code error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve game by invite code",
    });
  }
};

// Join Game by ID or Invite Code
export const joinGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { userId, username, rating } = req.body;

    let game;
    if (mongoose.Types.ObjectId.isValid(gameId)) {
      game = await gameModel.findById(gameId);
    } else {
      game = await gameModel.findOne({ inviteCode: gameId.toUpperCase() });
    }

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    const validUserId =
      userId && mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : undefined;

    // If game is already active and user is already a player in it
    const isWhite =
      (validUserId && game.whitePlayer?.toString() === validUserId.toString()) ||
      (username && game.whitePlayerName === username);
    const isBlack =
      (validUserId && game.blackPlayer?.toString() === validUserId.toString()) ||
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
      let assignedColor: "white" | "black" = "white";

      if (!game.whitePlayer && !game.whitePlayerName?.length) {
        game.whitePlayer = validUserId;
        game.whitePlayerName = username || "Guest (White)";
        game.whitePlayerRating = rating || 1200;
        assignedColor = "white";
      } else if (!game.blackPlayer && (!game.blackPlayerName || game.blackPlayerName === "Black")) {
        game.blackPlayer = validUserId;
        game.blackPlayerName = username || "Guest (Black)";
        game.blackPlayerRating = rating || 1200;
        assignedColor = "black";
      } else if (!game.whitePlayer) {
        game.whitePlayer = validUserId;
        game.whitePlayerName = username || "Guest (White)";
        game.whitePlayerRating = rating || 1200;
        assignedColor = "white";
      } else {
        game.blackPlayer = validUserId;
        game.blackPlayerName = username || "Guest (Black)";
        game.blackPlayerRating = rating || 1200;
        assignedColor = "black";
      }

      game.status = "active";
      game.startedAt = new Date();
      await game.save();

      createChessGame(game._id.toString(), game.currentPosition);

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
  } catch (error) {
    console.error("Join game error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to join game",
    });
  }
};

// Get Lobby Statistics
export const getLobbyStats = async (req: Request, res: Response) => {
  try {
    const activeGamesCount = await gameModel.countDocuments({
      status: "active",
    });
    const totalGamesCount = await gameModel.countDocuments();
    const onlineUsersCount = await userModel.countDocuments({
      isOnline: true,
    });

    const recentGames = await gameModel
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
  } catch (error) {
    console.error("Get lobby stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get lobby statistics",
    });
  }
};