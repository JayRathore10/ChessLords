import { Router } from "express";
import {
  loginUser,
  logoutUser,
  me,
  registerNewUser,
  changePassword,
} from "../controllers/auth.controller";
import { isUserLoggedIn } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", registerNewUser);
router.post("/login", loginUser);
router.post("/logout", isUserLoggedIn, logoutUser);
router.get("/me", isUserLoggedIn, me);
router.post("/change-password", isUserLoggedIn, changePassword);

export default router;