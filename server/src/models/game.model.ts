import mongoose, { Document, Types } from "mongoose";

export interface GameInterface extends Document {
  _id: Types.ObjectId;

  whitePlayer?: Types.ObjectId;
  blackPlayer?: Types.ObjectId;

  whitePlayerName?: string;
  blackPlayerName?: string;
  whitePlayerRating?: number;
  blackPlayerRating?: number;

  inviteCode?: string;
  isPrivate?: boolean;
  isPassAndPlay?: boolean;

  gameType: "casual" | "rated";

  status: "waiting" | "active" | "completed" | "abandoned" | "aborted";

  result: "white" | "black" | "draw" | "none";

  moves: string[];

  // Current board position in FEN notation
  currentPosition: string;

  turn: "white" | "black";

  // Example: 10+0, 10+5, 30+0
  timeControl: {
    initialTime: number; // seconds
    increment: number;   // seconds
    name?: string;
  };

  // Remaining time in seconds
  whiteTime: number;
  blackTime: number;

  startedAt?: Date;
  endedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const gameSchema = new mongoose.Schema<GameInterface>(
  {
    whitePlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    blackPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    whitePlayerName: {
      type: String,
      default: "White",
    },

    blackPlayerName: {
      type: String,
      default: "Black",
    },

    whitePlayerRating: {
      type: Number,
      default: 1200,
    },

    blackPlayerRating: {
      type: Number,
      default: 1200,
    },

    inviteCode: {
      type: String,
      index: true,
      sparse: true,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    isPassAndPlay: {
      type: Boolean,
      default: false,
    },

    gameType: {
      type: String,
      enum: ["casual", "rated"],
      default: "casual",
    },

    status: {
      type: String,
      enum: ["waiting", "active", "completed", "abandoned", "aborted"],
      default: "waiting",
    },

    result: {
      type: String,
      enum: ["white", "black", "draw", "none"],
      default: "none",
    },

    moves: {
      type: [String],
      default: [],
    },

    currentPosition: {
      type: String,
      default:
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },

    turn: {
      type: String,
      enum: ["white", "black"],
      default: "white",
    },

    timeControl: {
      initialTime: {
        type: Number,
        required: [true, "Initial time is required"],
        min: 1,
      },

      increment: {
        type: Number,
        default: 0,
        min: 0,
      },

      name: {
        type: String,
        default: "Custom",
      },
    },

    whiteTime: {
      type: Number,
      required: true,
      min: 0,
    },

    blackTime: {
      type: Number,
      required: true,
      min: 0,
    },

    startedAt: {
      type: Date,
    },

    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const gameModel = mongoose.model<GameInterface>(
  "Game",
  gameSchema
);