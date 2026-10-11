import { ExtendedError, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env.config";
import { userModel } from "../models/user.model";
import { userPlayLoad } from "../types/authRequest.type";

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
}

function extractSocketToken(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.trim();
  }

  const authHeader = socket.handshake.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const cookies = parseCookieHeader(socket.handshake.headers?.cookie);
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
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => {
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

    let decodeData: userPlayLoad;
    try {
      decodeData = jwt.verify(token, JWT_SECRET as string) as userPlayLoad;
    } catch {
      return next(new Error("Invalid or expired token"));
    }

    const query = decodeData.userId
      ? { _id: decodeData.userId }
      : { email: decodeData.email };

    const user = await userModel.findOne(query).select("-password");

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
  } catch (error) {
    console.error("[SocketAuth] middleware error:", error);
    return next(new Error("Authentication failed"));
  }
};
