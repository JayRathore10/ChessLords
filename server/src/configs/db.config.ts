import mongoose from "mongoose";
import { MONGODB_URI } from "./env.config";

export const connectDB = async () => {
  try {
    await mongoose.connect(
      MONGODB_URI! as string
    );
    console.log("Database connected successfully");

  } catch (error) {
    console.log(error);
    process.exit(1);

  }
};