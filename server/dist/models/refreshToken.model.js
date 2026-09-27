"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const refreshTokenSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    },
    token: {
        type: String,
        required: [true, "Refresh token is required"],
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: [true, "Expiration date is required"],
    },
}, {
    timestamps: {
        createdAt: true,
        updatedAt: false,
    },
});
// Automatically remove expired refresh tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.refreshTokenModel = mongoose_1.default.model("RefreshToken", refreshTokenSchema);
