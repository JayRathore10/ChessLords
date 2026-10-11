import { Router } from "express";

import {
  getAllUsers,
  getUserById,
  getUserByUsername,
  getMyProfile,
  updateMyProfile,
  deleteUser,
  getUserStats,
  getLeaderboard,
  
} from "../controllers/user.controller";
import {
  isUserLoggedIn,
  isAdminLoggedIn,
} from "../middleware/auth.middleware";
import { upload } from "../utils/upload.utility";

const router = Router();

// Public
router.get("/", getAllUsers);
router.get("/username/:username", getUserByUsername);
router.get("/leaderboard", getLeaderboard);

// Logged-in user (before /:id so "me" is not treated as an ObjectId)
router.get("/me", isUserLoggedIn, getMyProfile);
router.patch("/me", isUserLoggedIn, upload.single("profilePic"), updateMyProfile);

router.get("/:id", getUserById);
router.get("/:id/stats", getUserStats);

// Admin
router.delete("/:id", isAdminLoggedIn, deleteUser);

export default router;