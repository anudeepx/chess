import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@repo/types";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error-middleware.js";
import { gameRouter } from "./routes/game-routes.js";
import { registerGameSocketHandlers } from "./sockets/game-socket-handler.js";

const app = express();
const httpServer = createServer(app);

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    }),
);
app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ message: "API is running" });
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/games", gameRouter);
app.use(errorMiddleware);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
    },
});

registerGameSocketHandlers(io);

httpServer.listen(env.API_PORT, () => {
    console.log(`API server listening on http://localhost:${env.API_PORT}`);
});
