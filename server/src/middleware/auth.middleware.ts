import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authRequest, userPlayLoad } from "../types/authRequest.type";
import { JWT_SECRET } from "../configs/env.config";
import { userModel } from "../models/user.model";

export const isUserLoggedIn = async (req: authRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not Found"
      })
    }

    const decodeData = jwt.verify(token, JWT_SECRET as string) as userPlayLoad;

    const user = await userModel.findOne({
      email: decodeData.email
    }).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    req.user = user;
    
    next();

  } catch (error) {
    next(error);
  }
}


export const isAdminLoggedIn = async (req: authRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not Found"
      })
    }

    const decodeData = jwt.verify(token, JWT_SECRET as string) as userPlayLoad;

    if (decodeData.role != "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not admin"
      });
    }

    const user = await userModel.findOne({
      email: decodeData.email
    }).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not found"
      })
    }

    req.user = user;
    next();

  } catch (error) {
    next(error);
  }
}