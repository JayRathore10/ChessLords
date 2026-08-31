import { Request, Response } from "express";
import { Types } from "mongoose";
import { userModel } from "../models/user.model";
import { authRequest } from "../types/authRequest.type";

// GET /api/users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userModel
      .find()
      .select("-password")
      .sort({ rating: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// GET /api/users/:id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await userModel
      .findById(id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// GET /api/users/username/:username
export const getUserByUsername = async (
  req: Request,
  res: Response
) => {
  try {
    const { username } = req.params;

    const user = await userModel
      .findOne({ username })
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user by username error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// PATCH /api/users/:id
export const updateUser = async (req: authRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const { name } = req.body;

    const updateData: {
      name?: string;
      profilePic?: string;
    } = {};

    // Update name only if provided
    if (name !== undefined) {
      updateData.name = name;
    }

    // Update profile picture if a file was uploaded
    if (req.file) {
      updateData.profilePic = req.file.path;
    }

    const user = await userModel
      .findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      })
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error: any) {
    console.error("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await userModel.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// GET /api/users/:id/stats
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await userModel
      .findById(id)
      .select(
        "username name profilePic rating gamesPlayed gamesWon gamesLost gamesDrawn"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      stats: {
        username: user.username,
        name: user.name,
        profilePic: user.profilePic,
        rating: user.rating,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        gamesLost: user.gamesLost,
        gamesDrawn: user.gamesDrawn,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
    });
  }
};

export const getMyProfile = async (
  req: authRequest,
  res: Response
) => {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};

export const updateMyProfile = async (
  req: authRequest,
  res: Response
) => {
  try {
    const { name, username, profilePic } = req.body;

    const user = await userModel.findByIdAndUpdate(
      req.user?._id,
      {
        ...(name && { name }),
        ...(username && { username }),
        ...(profilePic && { profilePic }),
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error: any) {
    console.error("Update profile error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};