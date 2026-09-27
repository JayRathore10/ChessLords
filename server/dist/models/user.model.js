"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
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
    isOnline: {
        type: Boolean,
        default: false,
    },
    lastSeen: {
        type: Date,
    },
}, {
    timestamps: true,
});
exports.userModel = mongoose_1.default.model("User", userSchema);
