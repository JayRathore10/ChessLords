import mongoose, { Document, Types } from "mongoose";

export interface RatingHistoryEntry {
  rating: number;
  date: Date;
  change: number;
  gameId?: Types.ObjectId;
  opponent?: string;
  result?: "win" | "loss" | "draw";
}

export interface UserInterface extends Document {
  _id: Types.ObjectId;

  username: string;
  name: string;
  email: string;
  password: string;

  role: "user" | "admin";

  profilePic: string;
  bio: string;

  // Chess information
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;

  ratingHistory?: RatingHistoryEntry[];

  // Account status
  isOnline: boolean;
  lastSeen?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<UserInterface>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      minlength: 3,
      maxlength: 20,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: 2,
      maxlength: 30,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    profilePic: {
      type: String,
      default: "default.jpg",
    },

    bio: {
      type: String,
      default: "",
      maxlength: [160, "Bio must not exceed 160 characters"],
      trim: true,
    },

    // Chess rating
    rating: {
      type: Number,
      default: 1200,
      min: 0,
    },

    gamesPlayed: {
      type: Number,
      default: 0,
      min: 0,
    },

    gamesWon: {
      type: Number,
      default: 0,
      min: 0,
    },

    gamesLost: {
      type: Number,
      default: 0,
      min: 0,
    },

    gamesDrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    ratingHistory: [
      {
        rating: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        change: { type: Number, default: 0 },
        gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
        opponent: { type: String },
        result: { type: String, enum: ["win", "loss", "draw"] },
      },
    ],

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const userModel = mongoose.model<UserInterface>(
  "User",
  userSchema
);