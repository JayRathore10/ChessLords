"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_utility_1 = require("../utils/upload.utility");
const router = (0, express_1.Router)();
// Public
router.get("/", user_controller_1.getAllUsers);
router.get("/username/:username", user_controller_1.getUserByUsername);
router.get("/leaderboard", user_controller_1.getLeaderboard);
// Logged-in user (before /:id so "me" is not treated as an ObjectId)
router.get("/me", auth_middleware_1.isUserLoggedIn, user_controller_1.getMyProfile);
router.get("/me/stats", auth_middleware_1.isUserLoggedIn, user_controller_1.getUserStats);
router.patch("/me", auth_middleware_1.isUserLoggedIn, upload_utility_1.upload.single("profilePic"), user_controller_1.updateMyProfile);
router.get("/:id", user_controller_1.getUserById);
router.get("/:id/stats", user_controller_1.getUserStats);
// Admin
router.delete("/:id", auth_middleware_1.isAdminLoggedIn, user_controller_1.deleteUser);
exports.default = router;
