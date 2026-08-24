import { Router } from "express";
import {
  createGame,
  getGameById,
  getGameByInviteCode,
  joinGame,
  getLobbyStats,
} from "../controllers/game.controller";

const router = Router();

router.post("/", createGame);
router.post("/create", createGame);
router.get("/lobby/stats", getLobbyStats);
router.get("/invite/:inviteCode", getGameByInviteCode);
router.get("/:gameId", getGameById);
router.post("/join/:gameId", joinGame);

export default router;