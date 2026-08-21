import { Router } from "express";

import {
  getAllUsers,
  getUserById,
  getUserByUsername,
  updateUser,
  deleteUser,
  getUserStats,
} from "../controllers/user.controller";

const router = Router();

// Get all users
router.get("/", getAllUsers);

// Get user by username
router.get("/username/:username", getUserByUsername);

// Get user by ID
router.get("/:id", getUserById);

// Get user statistics
router.get("/:id/stats", getUserStats);

// Update user
router.patch("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

export default router;