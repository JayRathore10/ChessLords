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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUsernameAvailability = exports.changePassword = exports.me = exports.logoutUser = exports.loginUser = exports.registerNewUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_validation_1 = require("../validations/user.validation");
const env_config_1 = require("../configs/env.config");
const user_model_1 = require("../models/user.model");
const registerNewUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = user_validation_1.userSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                error: parsed.error.format(),
            });
        }
        const { username, email, password, name } = parsed.data;
        // Check username
        const existingUsername = yield user_model_1.userModel.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: "Username already exists",
            });
        }
        // Check email
        const existingEmail = yield user_model_1.userModel.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "Email already exists",
            });
        }
        // Hash password
        const salt = yield bcrypt_1.default.genSalt(Number(env_config_1.SALT_ROUND) || 10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        // Create user
        const user = yield user_model_1.userModel.create({
            username,
            email,
            password: hashedPassword,
            name,
        });
        // Create JWT
        const token = jsonwebtoken_1.default.sign({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        }, env_config_1.JWT_SECRET, {
            expiresIn: "7d",
        });
        // Store JWT in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            rating: user.rating,
            profilePic: user.profilePic,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            gamesLost: user.gamesLost,
            gamesDrawn: user.gamesDrawn,
        };
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: userResponse,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.registerNewUser = registerNewUser;
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = user_validation_1.userLoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                error: parsed.error.format(),
            });
        }
        const { email, password } = parsed.data;
        const user = yield user_model_1.userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        const isPasswordCorrect = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        }, env_config_1.JWT_SECRET, {
            expiresIn: "7d",
        });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            rating: user.rating,
            profilePic: user.profilePic,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            gamesLost: user.gamesLost,
            gamesDrawn: user.gamesDrawn,
        };
        return res.status(200).json({
            success: true,
            message: "Login successful",
            // remove token from it
            user: userResponse,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.loginUser = loginUser;
const logoutUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (err) {
        next(err);
    }
});
exports.logoutUser = logoutUser;
const me = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
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
    }
    catch (err) {
        next(err);
    }
});
exports.me = me;
const changePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required",
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long",
            });
        }
        const user = yield user_model_1.userModel.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const isMatch = yield bcrypt_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }
        const salt = yield bcrypt_1.default.genSalt(Number(env_config_1.SALT_ROUND) || 10);
        user.password = yield bcrypt_1.default.hash(newPassword, salt);
        yield user.save();
        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (err) {
        next(err);
    }
});
exports.changePassword = changePassword;
const checkUsernameAvailability = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { username } = req.params;
        if (!username || typeof username !== "string") {
            return res.status(400).json({
                success: false,
                available: false,
                message: "Username parameter is required",
            });
        }
        const trimmed = username.trim();
        // Validate format against zod schema rule
        const validation = user_validation_1.userSchema.shape.username.safeParse(trimmed);
        if (!validation.success) {
            return res.status(200).json({
                success: true,
                available: false,
                message: ((_a = validation.error.issues[0]) === null || _a === void 0 ? void 0 : _a.message) || "Invalid username format",
            });
        }
        // Case-insensitive check for existing username
        const existing = yield user_model_1.userModel.findOne({
            username: { $regex: new RegExp(`^${trimmed}$`, "i") },
        });
        if (existing) {
            return res.status(200).json({
                success: true,
                available: false,
                message: "Username is already taken",
            });
        }
        return res.status(200).json({
            success: true,
            available: true,
            message: "Username is available",
        });
    }
    catch (err) {
        next(err);
    }
});
exports.checkUsernameAvailability = checkUsernameAvailability;
