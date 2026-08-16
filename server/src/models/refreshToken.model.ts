import mongoose, { Document, Types } from "mongoose";

export interface RefreshTokenInterface extends Document {
  _id: Types.ObjectId;

  user: Types.ObjectId;
  token: string;
  expiresAt: Date;

  createdAt: Date;
}

const refreshTokenSchema = new mongoose.Schema<RefreshTokenInterface>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
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
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

// Automatically remove expired refresh tokens
refreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export const refreshTokenModel = mongoose.model<RefreshTokenInterface>(
  "RefreshToken",
  refreshTokenSchema
);