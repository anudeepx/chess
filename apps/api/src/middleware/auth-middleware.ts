import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export const requireUser = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.header("x-user-id");
    const apiKey = req.header("x-api-key");

    if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }

    if (env.INTERNAL_API_KEY && apiKey !== env.INTERNAL_API_KEY) {
        res.status(401).json({ error: "Invalid API key" });
        return;
    }

    req.userId = userId;
    next();
};
