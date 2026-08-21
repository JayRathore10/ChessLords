import { Router } from "express";

import {
  getAllUsers,
  getUserById,
  getUserByUsername,
  updateUser,
  deleteUser,
  getUserStats,
} from "../controllers/user.controller";

import {
  isUserLoggedIn,
  isAdminLoggedIn,
} from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/", getAllUsers);
router.get("/username/:username", getUserByUsername);
router.get("/:id", getUserById);
router.get("/:id/stats", getUserStats);

// Logged-in user
router.patch("/:id", isUserLoggedIn, updateUser);

// Admin only
router.delete("/:id", isAdminLoggedIn, deleteUser);

export default router;