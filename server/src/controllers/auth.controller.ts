import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { userLoginSchema, userSchema } from "../validations/user.validation";
import { JWT_SECRET, SALT_ROUND } from "../configs/env.config";
import { authRequest } from "../types/authRequest.type";
import { userModel } from "../models/user.model";

export const registerNewUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = userSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: parsed.error.format(),
      });
    }

    const { username, email, password, name } = parsed.data;

    // Check username
    const existingUsername = await userModel.findOne({ username });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Check email
    const existingEmail = await userModel.findOne({ email });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(Number(SALT_ROUND));
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      name,
    });

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    // Store JWT in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      partitioned: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (err) {
    next(err);
  }
};


export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = userLoginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: parsed.error.format(),
      });
    }

    const { email, password } = parsed.data;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      partitioned: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
    });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      partitioned: true,
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (
  req: authRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // User is already authenticated by isUserLoggedIn
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};