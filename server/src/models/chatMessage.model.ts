import mongoose, { Document, Types } from 'mongoose';

export interface ChatMessageInterface extends Document {
  _id: Types.ObjectId;
  gameId: Types.ObjectId;
  senderId?: Types.ObjectId;
  senderColor: 'white' | 'black';
  senderName: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new mongoose.Schema<ChatMessageInterface>(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ gameId: 1, createdAt: 1 });

export const chatMessageModel = mongoose.model<ChatMessageInterface>(
  'ChatMessage',
  chatMessageSchema
);