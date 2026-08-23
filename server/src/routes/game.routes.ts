import { Router } from "express";
import { createGame } from "../controllers/game.controller";

const router = Router();

router.post("/", createGame);
router.post("/create", createGame);

export default router;