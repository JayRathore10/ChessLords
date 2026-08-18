import {Router} from "express";
import { loginUser, logoutUser, me, registerNewUser } from "../controllers/auth.controller";
import { isUserLoggedIn } from "../middleware/auth.middleware";

const router = Router();
router.post("/register" , registerNewUser);
router.post("/login" , loginUser);
// protected route
router.post("/logout", isUserLoggedIn , logoutUser);
router.get("/me" , me); 

export default router;