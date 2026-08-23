import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authRequest, userPlayLoad } from "../types/authRequest.type";
import { JWT_SECRET } from "../configs/env.config";
import { userModel } from "../models/user.model";

const extractToken = (req: authRequest): string | null => {
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
};

export const isUserLoggedIn = async (
  req: authRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: Token not found",
      });
    }

    let decodeData: userPlayLoad;
    try {
      decodeData = jwt.verify(token, JWT_SECRET as string) as userPlayLoad;
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const query = decodeData.userId
      ? { _id: decodeData.userId }
      : { email: decodeData.email };

    const user = await userModel.findOne(query).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const isAdminLoggedIn = async (
  req: authRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: Token not found",
      });
    }

    let decodeData: userPlayLoad;
    try {
      decodeData = jwt.verify(token, JWT_SECRET as string) as userPlayLoad;
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    if (decodeData.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin role required",
      });
    }

    const query = decodeData.userId
      ? { _id: decodeData.userId }
      : { email: decodeData.email };

    const user = await userModel.findOne(query).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};