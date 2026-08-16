import mongoose, { Document, Types } from "mongoose";

export interface FriendshipInterface extends Document {
  _id: Types.ObjectId;

  requester: Types.ObjectId;
  receiver: Types.ObjectId;

  status: "pending" | "accepted" | "rejected";

  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new mongoose.Schema<FriendshipInterface>(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester is required"],
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver is required"],
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same user from sending a request to themselves
friendshipSchema.path("receiver").validate(function (receiver) {
  return !this.requester.equals(receiver);
}, "A user cannot send a friend request to themselves");


// Prevent duplicate friendship records
friendshipSchema.index(
  { requester: 1, receiver: 1 },
  { unique: true }
);

export const friendshipModel = mongoose.model<FriendshipInterface>(
  "Friendship",
  friendshipSchema
);