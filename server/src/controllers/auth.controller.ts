import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userLoginSchema, userSchema } from "../validations/user.validation";
import { JWT_SECRET, SALT_ROUND } from "../configs/env.config";
import { authRequest } from "../types/authRequest.type";
import { userModel } from "../models/user.model";

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET as string,
    { expiresIn: "15m" } // Short-lived
  );
  
  const refreshToken = jwt.sign(
    { userId: user._id.toString() },
    JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" } // Long-lived
  );

  return { accessToken, refreshToken };
};

export const registerNewUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Validation error", error: parsed.error.format() });
    }

    const { username, email, password, name } = parsed.data;

    if (await userModel.findOne({ username })) {
      return res.status(409).json({ success: false, message: "Username already exists" });
    }
    if (await userModel.findOne({ email })) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(Number(SALT_ROUND) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      name,
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      user: { _id: user._id, username: user.username, email: user.email, name: user.name, role: user.role, rating: user.rating, profilePic: user.profilePic }
    });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = userLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Validation error" });
    }

    const { email, password } = parsed.data;
    const user = await userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: { _id: user._id, username: user.username, email: user.email, name: user.name, role: user.role, rating: user.rating, profilePic: user.profilePic }
    });
  } catch (err) {
    next(err);
  }
};

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token missing" });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET as string, async (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ success: false, message: "Invalid refresh token" });
      }

      const user = await userModel.findById(decoded.userId);
      if (!user) {
        return res.status(403).json({ success: false, message: "User no longer exists" });
      }

      const accessToken = jwt.sign(
        { userId: user._id.toString(), email: user.email, role: user.role },
        JWT_SECRET as string,
        { expiresIn: "15m" }
      );

      return res.status(200).json({ success: true, accessToken });
    });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    // Fallback: clear legacy access token cookie if it exists
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: authRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    return res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: authRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
    }
    const user = await userModel.findById(req.user?._id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    const salt = await bcrypt.genSalt(Number(SALT_ROUND) || 10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

export const checkUsernameAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;
    if (!username || typeof username !== "string") return res.status(400).json({ success: false, available: false, message: "Username parameter is required" });
    
    const trimmed = username.trim();
    const existing = await userModel.findOne({ username: { $regex: new RegExp(`^${trimmed}$`, "i") } });
    
    if (existing) {
      return res.status(200).json({ success: true, available: false, message: "Username is already taken" });
    }
    return res.status(200).json({ success: true, available: true, message: "Username is available" });
  } catch (err) {
    next(err);
  }
};