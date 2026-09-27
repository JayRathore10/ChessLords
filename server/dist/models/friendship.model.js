"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendshipModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const friendshipSchema = new mongoose_1.default.Schema({
    requester: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Requester is required"],
    },
    receiver: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Receiver is required"],
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
}, {
    timestamps: true,
});
// Prevent the same user from sending a request to themselves
friendshipSchema.path("receiver").validate(function (receiver) {
    return !this.requester.equals(receiver);
}, "A user cannot send a friend request to themselves");
// Prevent duplicate friendship records
friendshipSchema.index({ requester: 1, receiver: 1 }, { unique: true });
exports.friendshipModel = mongoose_1.default.model("Friendship", friendshipSchema);
