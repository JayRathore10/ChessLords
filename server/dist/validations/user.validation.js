"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLoginSchema = exports.userSchema = void 0;
const zod_1 = require("zod");
exports.userSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must not exceed 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: zod_1.z
        .string()
        .email("Invalid email address")
        .toLowerCase(),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must not exceed 100 characters"),
    name: zod_1.z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must not exceed 50 characters")
        .trim(),
});
exports.userLoginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email("Invalid email address")
        .toLowerCase(),
    password: zod_1.z
        .string()
        .min(1, "Password is required"),
});
