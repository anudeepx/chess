import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";

export const asyncHandler =
    <T extends Request, U extends Response>(
        handler: (req: T, res: U, next: NextFunction) => Promise<void>,
    ) =>
        (req: T, res: U, next: NextFunction) => {
            handler(req, res, next).catch(next);
        };

export const errorMiddleware = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    void _next;

    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    if (err instanceof Error) {
        res.status(500).json({ error: err.message });
        return;
    }

    res.status(500).json({ error: "Unexpected server error" });
};
