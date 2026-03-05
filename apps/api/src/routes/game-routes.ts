import { Router } from "express";
import { gameController } from "../controllers/game-controller.js";
import { asyncHandler } from "../middleware/error-middleware.js";
import { requireUser } from "../middleware/auth-middleware.js";

export const gameRouter: Router = Router();

gameRouter.get("/", requireUser, asyncHandler(gameController.listGames));
gameRouter.post("/", requireUser, asyncHandler(gameController.createGame));
gameRouter.post("/:gameId/join", requireUser, asyncHandler(gameController.joinGame));
gameRouter.get("/:gameId", requireUser, asyncHandler(gameController.getGame));
