import { Request, Response } from "express";
import { Chess } from "chess.js";
import { gameModel } from "../models/game.model";

export const createGame = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      whitePlayer,
      blackPlayer,
      gameType = "casual",
      initialTime = 600,
      increment = 0,
    } = req.body;

    if (!whitePlayer || !blackPlayer) {
      return res.status(400).json({
        success: false,
        message: "Both players are required",
      });
    }

    const chess = new Chess();

    const game = await gameModel.create({
      whitePlayer,
      blackPlayer,

      gameType,

      status: "active",

      result: "none",

      moves: [],

      currentPosition: chess.fen(),

      turn: "white",

      timeControl: {
        initialTime,
        increment,
      },

      whiteTime: initialTime,

      blackTime: initialTime,

      startedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      game,
    });
  } catch (error) {
    console.error(
      "Create game error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create game",
    });
  }
};