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
exports.isAdminLoggedIn = exports.isUserLoggedIn = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../configs/env.config");
const user_model_1 = require("../models/user.model");
const extractToken = (req) => {
    var _a, _b;
    if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) {
        return req.cookies.token;
    }
    const authHeader = (_b = req.headers) === null || _b === void 0 ? void 0 : _b.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }
    return null;
};
const isUserLoggedIn = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required: Token not found",
            });
        }
        let decodeData;
        try {
            decodeData = jsonwebtoken_1.default.verify(token, env_config_1.JWT_SECRET);
        }
        catch (_a) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }
        const query = decodeData.userId
            ? { _id: decodeData.userId }
            : { email: decodeData.email };
        const user = yield user_model_1.userModel.findOne(query).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.isUserLoggedIn = isUserLoggedIn;
const isAdminLoggedIn = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required: Token not found",
            });
        }
        let decodeData;
        try {
            decodeData = jsonwebtoken_1.default.verify(token, env_config_1.JWT_SECRET);
        }
        catch (_a) {
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
        const user = yield user_model_1.userModel.findOne(query).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.isAdminLoggedIn = isAdminLoggedIn;
