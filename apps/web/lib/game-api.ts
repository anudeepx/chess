import type { CreateGameResponse, GameDto, GetGameResponse, JoinGameResponse } from "@repo/types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

class WebAppError extends Error { }

const request = async <T>(
    path: string,
    userId: string,
    init?: RequestInit,
): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
            ...(process.env.INTERNAL_API_KEY
                ? { "x-api-key": process.env.INTERNAL_API_KEY }
                : {}),
            ...(init?.headers ?? {}),
        },
        cache: "no-store",
    });

    const noBodyStatus = response.status === 204 || response.status === 205 || response.status === 304;
    const contentLength = response.headers.get("content-length");
    const contentType = response.headers.get("content-type") ?? "";

    let payload: unknown;

    if (!noBodyStatus && contentLength !== "0") {
        const rawBody = await response.text();

        if (rawBody.trim().length > 0) {
            payload = contentType.includes("application/json")
                ? JSON.parse(rawBody)
                : rawBody;
        }
    }

    if (!response.ok) {
        const errorMessage =
            typeof payload === "object" &&
                payload !== null &&
                "error" in payload &&
                typeof (payload as { error?: unknown }).error === "string"
                ? (payload as { error: string }).error
                : "Failed request";

        throw new WebAppError(errorMessage);
    }

    return payload as T;
};

export const listWaitingGames = async (userId: string): Promise<GameDto[]> => {
    const result = await request<{ games: GameDto[] }>("/games", userId, {
        method: "GET",
    });

    return result.games;
};

export const createGame = async (userId: string): Promise<GameDto> => {
    const result = await request<CreateGameResponse>("/games", userId, {
        method: "POST",
    });

    return result.game;
};

export const joinGame = async (userId: string, gameId: string): Promise<GameDto> => {
    const result = await request<JoinGameResponse>(`/games/${gameId}/join`, userId, {
        method: "POST",
    });

    return result.game;
};

export const deleteGame = async (
    userId: string,
    gameId: string
): Promise<void> => {
    await request<undefined>(`/games/${gameId}`, userId, {
        method: "DELETE",
    });
};

export const getGame = async (
    userId: string,
    gameId: string,
): Promise<GetGameResponse> => {
    return request<GetGameResponse>(`/games/${gameId}`, userId, {
        method: "GET",
    });
};
