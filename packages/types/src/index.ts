export type GameStatus = "waiting" | "active" | "finished";

export type GameDto = {
    id: string;
    whitePlayerId: string;
    blackPlayerId: string | null;
    status: GameStatus;
    fenPosition: string;
    createdAt: string;
};

export type MoveDto = {
    id: string;
    gameId: string;
    playerId: string;
    move: string;
    createdAt: string;
};

export type CreateGameResponse = {
    game: GameDto;
};

export type JoinGameResponse = {
    game: GameDto;
};

export type GetGameResponse = {
    game: GameDto;
    moves: MoveDto[];
};

export type CreateGameEventPayload = {
    userId: string;
};

export type JoinGameEventPayload = {
    gameId: string;
    userId: string;
};

export type MakeMoveEventPayload = {
    gameId: string;
    userId: string;
    from: string;
    to: string;
    promotion?: "q" | "r" | "b" | "n";
};

export type GameStateUpdatePayload = {
    gameId: string;
    fenPosition: string;
    status: GameStatus;
    lastMove?: string;
    turn: "w" | "b";
    isCheck: boolean;
    isCheckmate: boolean;
    isDraw: boolean;
    whitePlayerId: string;
    blackPlayerId: string | null;
};

export type PlayerDisconnectedPayload = {
    gameId: string;
    userId: string;
};

export type ServerToClientEvents = {
    game_state_update: (payload: GameStateUpdatePayload) => void;
    player_disconnected: (payload: PlayerDisconnectedPayload) => void;
    server_error: (payload: { message: string }) => void;
};

export type ClientToServerEvents = {
    create_game: (payload: CreateGameEventPayload) => void;
    join_game: (payload: JoinGameEventPayload) => void;
    make_move: (payload: MakeMoveEventPayload) => void;
};