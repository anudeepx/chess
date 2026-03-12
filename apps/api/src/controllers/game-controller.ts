import type { Request, Response } from "express";
import { z } from "zod";
import { gameService } from "../services/game-service.js";

const gameIdSchema = z.object({
    gameId: z.string().min(1),
});

export const gameController = {
    async listGames(_req: Request, res: Response) {
        const games = await gameService.listJoinableGames();
        res.json({ games });
    },

    async createGame(req: Request, res: Response) {
        const game = await gameService.createGame(req.userId!);
        res.status(201).json({ game });
    },

    async joinGame(req: Request, res: Response) {
        const { gameId } = gameIdSchema.parse(req.params);
        const game = await gameService.joinGame(gameId, req.userId!);
        res.json({ game });
    },

    async getGame(req: Request, res: Response) {
        const { gameId } = gameIdSchema.parse(req.params);
        const result = await gameService.getGame(gameId);
        res.json(result);
    },

    async deleteGame(req: Request, res: Response) {
        const { gameId } = gameIdSchema.parse(req.params);
        await gameService.deleteGame(gameId, req.userId!);
        res.status(204).send();
    }
};
