import { Chess } from "chess.js";
import { GameStatus, prisma } from "@repo/db";
import type {
    GameDto,
    GameStateUpdatePayload,
    MoveDto,
} from "@repo/types";
import { AppError } from "../utils/app-error.js";

const toGameDto = (game: {
    id: string;
    whitePlayerId: string;
    blackPlayerId: string | null;
    status: GameStatus;
    fenPosition: string;
    createdAt: Date;
}): GameDto => ({
    ...game,
    createdAt: game.createdAt.toISOString(),
});

const toMoveDto = (move: {
    id: string;
    gameId: string;
    playerId: string;
    move: string;
    createdAt: Date;
}): MoveDto => ({
    ...move,
    createdAt: move.createdAt.toISOString(),
});

const toStatePayload = (game: {
    id: string;
    whitePlayerId: string;
    blackPlayerId: string | null;
    status: GameStatus;
    fenPosition: string;
}): GameStateUpdatePayload => {
    const chess = new Chess(game.fenPosition);

    return {
        gameId: game.id,
        fenPosition: game.fenPosition,
        status: game.status,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId,
        turn: chess.turn(),
        isCheck: chess.inCheck(),
        isCheckmate: chess.isCheckmate(),
        isDraw: chess.isDraw(),
    };
};

export const gameService = {
    async listJoinableGames() {
        const games = await prisma.game.findMany({
            where: { status: GameStatus.waiting },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return games.map(toGameDto);
    },

    async createGame(whitePlayerId: string) {
        const chess = new Chess();
        const game = await prisma.game.create({
            data: {
                whitePlayerId,
                fenPosition: chess.fen(),
                status: GameStatus.waiting,
            },
        });

        return toGameDto(game);
    },

    async joinGame(gameId: string, userId: string) {
        const game = await prisma.game.findUnique({ where: { id: gameId } });

        if (!game) {
            throw new AppError("Game not found", 404);
        }

        if (game.whitePlayerId === userId || game.blackPlayerId === userId) {
            return toGameDto(game);
        }

        if (game.blackPlayerId && game.blackPlayerId !== userId) {
            throw new AppError("Game already has two players", 409);
        }

        // Prevent two users from claiming black in a race.
        const updatedCount = await prisma.game.updateMany({
            where: {
                id: gameId,
                blackPlayerId: null,
                status: GameStatus.waiting,
            },
            data: {
                blackPlayerId: userId,
                status: GameStatus.active,
            },
        });

        if (updatedCount.count === 0) {
            const latest = await prisma.game.findUnique({ where: { id: gameId } });

            if (!latest) {
                throw new AppError("Game not found", 404);
            }

            if (latest.blackPlayerId === userId) {
                return toGameDto(latest);
            }

            throw new AppError("Game already has two players", 409);
        }

        const updated = await prisma.game.findUnique({ where: { id: gameId } });

        if (!updated) {
            throw new AppError("Game not found", 404);
        }

        return toGameDto(updated);
    },

    async getGame(gameId: string) {
        const game = await prisma.game.findUnique({
            where: { id: gameId },
            include: {
                moves: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!game) {
            throw new AppError("Game not found", 404);
        }

        return {
            game: toGameDto(game),
            moves: game.moves.map(toMoveDto),
        };
    },

    async deleteGame(gameId: string, userId: string) {
        const game = await prisma.game.findUnique({ where: { id: gameId } });

        if (!game) {
            throw new AppError("Game not found", 404);
        }

        if (game.whitePlayerId !== userId) {
            throw new AppError("Only the game creator can delete this game", 403);
        }

        if (game.status === GameStatus.active) {
            throw new AppError("Cannot delete an active game", 409);
        }

        await prisma.game.delete({ where: { id: gameId } });
    },

    async makeMove(input: {
        gameId: string;
        userId: string;
        from: string;
        to: string;
        promotion?: "q" | "r" | "b" | "n";
    }) {
        const game = await prisma.game.findUnique({ where: { id: input.gameId } });

        if (!game) {
            throw new AppError("Game not found", 404);
        }

        if (!game.blackPlayerId || game.status === GameStatus.waiting) {
            throw new AppError("Cannot make moves until another player joins", 400);
        }

        const chess = new Chess(game.fenPosition);
        const movingColor = chess.turn();

        const expectedPlayerId =
            movingColor === "w" ? game.whitePlayerId : game.blackPlayerId;

        if (expectedPlayerId !== input.userId) {
            throw new AppError("It is not your turn", 403);
        }

        const result = chess.move({
            from: input.from,
            to: input.to,
            promotion: input.promotion,
        });

        if (!result) {
            throw new AppError("Invalid chess move", 400);
        }

        const nextStatus = chess.isGameOver() ? GameStatus.finished : GameStatus.active;

        const updatedGame = await prisma.$transaction(async (tx) => {
            // Ensure we only apply the move if the board state is unchanged
            // since we validated the move above.
            const gameUpdate = await tx.game.updateMany({
                where: {
                    id: game.id,
                    fenPosition: game.fenPosition,
                    status: GameStatus.active,
                },
                data: {
                    fenPosition: chess.fen(),
                    status: nextStatus,
                },
            });

            if (gameUpdate.count === 0) {
                throw new AppError("Game state changed, retry move", 409);
            }

            await tx.move.create({
                data: {
                    gameId: game.id,
                    playerId: input.userId,
                    move: result.san,
                },
            });

            const latestGame = await tx.game.findUnique({ where: { id: game.id } });

            if (!latestGame) {
                throw new AppError("Game not found", 404);
            }

            return latestGame;
        });

        return {
            ...toStatePayload(updatedGame),
            lastMove: result.san,
        };
    },

    toGameStatePayload(game: {
        id: string;
        whitePlayerId: string;
        blackPlayerId: string | null;
        status: GameStatus;
        fenPosition: string;
    }) {
        return toStatePayload(game);
    },
};
