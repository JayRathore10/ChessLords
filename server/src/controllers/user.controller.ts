import { Request, Response } from "express";
import { Types } from "mongoose";
import { userModel } from "../models/user.model";
import { authRequest } from "../types/authRequest.type";
import { getUserStatistics } from "../services/stats.service";

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

// GET /api/users/:id/stats or /api/users/me/stats
export const getUserStats = async (req: Request, res: Response) => {
  try {
    let { id } = req.params;

    if (id === "me") {
      const authUser = (req as authRequest).user;
      if (!authUser) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      id = authUser._id.toString();
    }

    let user;
    if (Types.ObjectId.isValid(id)) {
      user = await userModel.findById(id);
    } else {
      user = await userModel.findOne({ username: id });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const stats = await getUserStatistics(user);

    return res.status(200).json({
      success: true,
      stats,
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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { name, username, bio } = req.body;

    const updateData: {
      name?: string;
      username?: string;
      bio?: string;
      profilePic?: string;
    } = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2 || trimmedName.length > 30) {
        return res.status(400).json({
          success: false,
          message: "Display name must be between 2 and 30 characters",
        });
      }
      updateData.name = trimmedName;
    }

    if (username !== undefined) {
      const trimmedUsername = String(username).trim();
      if (
        trimmedUsername.length < 3 ||
        trimmedUsername.length > 20 ||
        !/^[a-zA-Z0-9_]+$/.test(trimmedUsername)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Username must be 3–20 characters and contain only letters, numbers, and underscores",
        });
      }

      const existing = await userModel.findOne({
        username: { $regex: new RegExp(`^${trimmedUsername}$`, "i") },
        _id: { $ne: req.user._id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Username is already taken",
        });
      }

      updateData.username = trimmedUsername;
    }

    if (bio !== undefined) {
      const trimmedBio = String(bio).trim();
      if (trimmedBio.length > 160) {
        return res.status(400).json({
          success: false,
          message: "Bio must not exceed 160 characters",
        });
      }
      updateData.bio = trimmedBio;
    }

    // Multer has successfully uploaded the image
    if (req.file) {
      updateData.profilePic = `/images/${req.file.filename}`;
    }

    const user = await userModel
      .findByIdAndUpdate(req.user._id, updateData, {
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
  } catch (error: unknown) {
    console.error("Update profile error:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

export const getLeaderboard = async (
  req: authRequest,
  res: Response
) => {
  try {
    const users = await userModel
      .find()
      .select(
        "username name profilePic rating gamesPlayed gamesWon gamesLost gamesDrawn"
      )
      .sort({ rating: -1, gamesWon: -1, _id: 1 })
      .limit(100)
      .lean();

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    return res.status(200).json({
      success: true,
      count: leaderboard.length,
      users: leaderboard,
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
    });
  }
};