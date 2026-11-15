import rateLimit from "express-rate-limit";

// Strict limiter for authentication (Login/Register)
// 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, 
  legacyHeaders: false,
});

// Moderate limiter for Game Creation
// 20 games created per 15 minutes per IP
export const gameCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, 
  message: {
    success: false,
    message: "You are creating games too quickly. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});