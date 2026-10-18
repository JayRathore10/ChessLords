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
exports.socketAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../configs/env.config");
const user_model_1 = require("../models/user.model");
function parseCookieHeader(cookieHeader) {
    if (!cookieHeader)
        return {};
    return cookieHeader.split(";").reduce((acc, part) => {
        const [rawKey, ...rest] = part.trim().split("=");
        if (!rawKey)
            return acc;
        acc[rawKey] = decodeURIComponent(rest.join("=") || "");
        return acc;
    }, {});
}
function extractSocketToken(socket) {
    var _a, _b, _c;
    const authToken = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
    if (typeof authToken === "string" && authToken.trim()) {
        return authToken.trim();
    }
    const authHeader = (_b = socket.handshake.headers) === null || _b === void 0 ? void 0 : _b.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }
    const cookies = parseCookieHeader((_c = socket.handshake.headers) === null || _c === void 0 ? void 0 : _c.cookie);
    if (cookies.token) {
        return cookies.token;
    }
    return null;
}
/**
 * Socket.IO middleware: verify JWT and bind identity to socket.data.
 * Guests (no token) are allowed for pass-and-play / casual play, but
 * socket.data.authenticated stays false and userId is not trusted from clients.
 */
const socketAuthMiddleware = (socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = extractSocketToken(socket);
        if (!token) {
            socket.data.authenticated = false;
            socket.data.userId = undefined;
            socket.data.username = undefined;
            socket.data.rating = undefined;
            socket.data.role = undefined;
            return next();
        }
        let decodeData;
        try {
            decodeData = jsonwebtoken_1.default.verify(token, env_config_1.JWT_SECRET);
        }
        catch (_a) {
            return next(new Error("Invalid or expired token"));
        }
        const query = decodeData.userId
            ? { _id: decodeData.userId }
            : { email: decodeData.email };
        const user = yield user_model_1.userModel.findOne(query).select("-password");
        if (!user) {
            return next(new Error("User not found"));
        }
        socket.data.authenticated = true;
        socket.data.userId = user._id.toString();
        socket.data.username = user.username;
        socket.data.rating = user.rating;
        socket.data.role = user.role;
        socket.data.name = user.name;
        return next();
    }
    catch (error) {
        console.error("[SocketAuth] middleware error:", error);
        return next(new Error("Authentication failed"));
    }
});
exports.socketAuthMiddleware = socketAuthMiddleware;
