"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.updateMyProfile = exports.getMyProfile = exports.getUserStats = exports.deleteUser = exports.updateUser = exports.getUserByUsername = exports.getUserById = exports.getAllUsers = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
const stats_service_1 = require("../services/stats.service");
// GET /api/users
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.userModel
            .find()
            .select("-password")
            .sort({ rating: -1 });
        return res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    }
    catch (error) {
        console.error("Get all users error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
});
exports.getAllUsers = getAllUsers;
// GET /api/users/:id
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }
        const user = yield user_model_1.userModel
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
    }
    catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user",
        });
    }
});
exports.getUserById = getUserById;
// GET /api/users/username/:username
const getUserByUsername = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.params;
        const user = yield user_model_1.userModel
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
    }
    catch (error) {
        console.error("Get user by username error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user",
        });
    }
});
exports.getUserByUsername = getUserByUsername;
// PATCH /api/users/:id
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId || !mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }
        const { name } = req.body;
        const updateData = {};
        // Update name only if provided
        if (name !== undefined) {
            updateData.name = name;
        }
        // Update profile picture if a file was uploaded
        if (req.file) {
            updateData.profilePic = req.file.path;
        }
        const user = yield user_model_1.userModel
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
    }
    catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
        });
    }
});
exports.updateUser = updateUser;
// DELETE /api/users/:id
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }
        const user = yield user_model_1.userModel.findByIdAndDelete(id);
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
    }
    catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
});
exports.deleteUser = deleteUser;
// GET /api/users/:id/stats or /api/users/me/stats
const getUserStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { id } = req.params;
        if (id === "me") {
            const authUser = req.user;
            if (!authUser) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            id = authUser._id.toString();
        }
        let user;
        if (mongoose_1.Types.ObjectId.isValid(id)) {
            user = yield user_model_1.userModel.findById(id);
        }
        else {
            user = yield user_model_1.userModel.findOne({ username: id });
        }
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const stats = yield (0, stats_service_1.getUserStatistics)(user);
        return res.status(200).json({
            success: true,
            stats,
        });
    }
    catch (error) {
        console.error("Get user stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user statistics",
        });
    }
});
exports.getUserStats = getUserStats;
const getMyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        return res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get profile",
        });
    }
});
exports.getMyProfile = getMyProfile;
const updateMyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const { name, username, bio } = req.body;
        const updateData = {};
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
            if (trimmedUsername.length < 3 ||
                trimmedUsername.length > 20 ||
                !/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
                return res.status(400).json({
                    success: false,
                    message: "Username must be 3–20 characters and contain only letters, numbers, and underscores",
                });
            }
            const existing = yield user_model_1.userModel.findOne({
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
        const user = yield user_model_1.userModel
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
    }
    catch (error) {
        console.error("Update profile error:", error);
        if (error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === 11000) {
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
});
exports.updateMyProfile = updateMyProfile;
const getLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.userModel
            .find()
            .select("username name profilePic rating gamesPlayed gamesWon gamesLost gamesDrawn")
            .sort({ rating: -1, gamesWon: -1, _id: 1 })
            .limit(100)
            .lean();
        const leaderboard = users.map((user, index) => (Object.assign({ rank: index + 1 }, user)));
        return res.status(200).json({
            success: true,
            count: leaderboard.length,
            users: leaderboard,
        });
    }
    catch (error) {
        console.error("Get leaderboard error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch leaderboard",
        });
    }
});
exports.getLeaderboard = getLeaderboard;
