import { Router } from "express";
import {
  createGame,
  getGameById,
  getGameByInviteCode,
  joinGame,
  getLobbyStats,
} from "../controllers/game.controller";
import { gameCreationLimiter } from "../middleware/rateLimiter"; // <-- IMPORT LIMITER

const router = Router();

// Apply gameCreationLimiter to both game creation routes
router.post("/", gameCreationLimiter, createGame);
router.post("/create", gameCreationLimiter, createGame);

router.get("/lobby/stats", getLobbyStats);
router.get("/invite/:inviteCode", getGameByInviteCode);
router.get("/:gameId", getGameById);
router.post("/join/:gameId", joinGame);

export default router;