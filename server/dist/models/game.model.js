"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const gameSchema = new mongoose_1.default.Schema({
    whitePlayer: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    blackPlayer: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        default: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
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
}, {
    timestamps: true,
});
exports.gameModel = mongoose_1.default.model("Game", gameSchema);
