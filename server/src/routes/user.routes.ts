import { Router } from "express";

import {
  getAllUsers,
  getUserById,
  getUserByUsername,
  getMyProfile,
  updateMyProfile,
  deleteUser,
  getUserStats,
  
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
router.get("/:id", getUserById);
router.get("/:id/stats", getUserStats);

// Logged-in user
router.get("/me", isUserLoggedIn, getMyProfile);
router.patch("/me", isUserLoggedIn, upload.single("profilePic") , updateMyProfile);

// Admin
router.delete("/:id", isAdminLoggedIn, deleteUser);

export default router;