"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatMessageModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const chatMessageSchema = new mongoose_1.default.Schema({
    gameId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
        index: true,
    },
    senderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    senderColor: {
        type: String,
        enum: ['white', 'black'],
        required: true,
    },
    senderName: {
        type: String,
        required: true,
        maxlength: 50,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    messageType: {
        type: String,
        enum: ['quick', 'emoji', 'custom'],
        default: 'custom',
        required: true,
    },
}, {
    timestamps: true,
});
chatMessageSchema.index({ gameId: 1, createdAt: 1 });
exports.chatMessageModel = mongoose_1.default.model('ChatMessage', chatMessageSchema);
