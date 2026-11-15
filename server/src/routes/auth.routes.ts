import { Router } from "express";
import {
  loginUser,
  logoutUser,
  me,
  registerNewUser,
  changePassword,
  checkUsernameAvailability,
  refreshTokenHandler,
} from "../controllers/auth.controller";
import { isUserLoggedIn } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimiter"; // <-- IMPORT LIMITER

const router = Router();

// Apply authLimiter to login and register endpoints
router.post("/register", authLimiter, registerNewUser);
router.post("/login", authLimiter, loginUser);

router.post("/refresh-token", refreshTokenHandler);
router.post("/logout", isUserLoggedIn, logoutUser);
router.get("/me", isUserLoggedIn, me);
router.post("/change-password", isUserLoggedIn, changePassword);
router.get("/check-username/:username", checkUsernameAvailability);

export default router;