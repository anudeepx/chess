import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from "@repo/types";
import type { Server, Socket } from "socket.io";
import { gameService } from "../services/game-service.js";

type SocketData = {
    userId?: string;
    gameId?: string;
};

type ChessSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>;
type ChessServer = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>;

const gameRoom = (gameId: string) => `game:${gameId}`;

export const registerGameSocketHandlers = (io: ChessServer) => {
    io.on("connection", (socket: ChessSocket) => {
        socket.on("create_game", async ({ userId }) => {
            try {
                socket.data.userId = userId;
                const game = await gameService.createGame(userId);
                const state = gameService.toGameStatePayload(game);
                socket.data.gameId = game.id;
                socket.join(gameRoom(game.id));
                socket.emit("game_state_update", state);
            } catch (error) {
                socket.emit("server_error", {
                    message: error instanceof Error ? error.message : "Failed to create game",
                });
            }
        });

        socket.on("join_game", async ({ gameId, userId }) => {
            try {
                socket.data.userId = userId;
                const game = await gameService.joinGame(gameId, userId);
                const state = gameService.toGameStatePayload(game);
                socket.data.gameId = game.id;
                socket.join(gameRoom(game.id));
                io.to(gameRoom(game.id)).emit("game_state_update", state);
            } catch (error) {
                socket.emit("server_error", {
                    message: error instanceof Error ? error.message : "Failed to join game",
                });
            }
        });

        socket.on("make_move", async ({ gameId, userId, from, to, promotion }) => {
            try {
                const state = await gameService.makeMove({
                    gameId,
                    userId,
                    from,
                    to,
                    promotion,
                });

                io.to(gameRoom(gameId)).emit("game_state_update", state);
            } catch (error) {
                socket.emit("server_error", {
                    message: error instanceof Error ? error.message : "Failed to make move",
                });
            }
        });

        socket.on("disconnect", () => {
            if (socket.data.gameId && socket.data.userId) {
                io.to(gameRoom(socket.data.gameId)).emit("player_disconnected", {
                    gameId: socket.data.gameId,
                    userId: socket.data.userId,
                });
            }
        });
    });
};
