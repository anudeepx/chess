"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  GameStatus,
  ServerToClientEvents,
} from "@repo/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Props = {
  gameId: string;
  userId: string;
  initialFen: string;
  initialStatus: GameStatus;
  initialWhitePlayerId: string;
  initialBlackPlayerId: string | null;
};

export const GameRoom = ({
  gameId,
  userId,
  initialFen,
  initialStatus,
  initialWhitePlayerId,
  initialBlackPlayerId,
}: Props) => {
  const [fen, setFen] = useState(initialFen);
  const [status, setStatus] = useState<GameStatus>(initialStatus);
  const [whitePlayerId, setWhitePlayerId] = useState(initialWhitePlayerId);
  const [blackPlayerId, setBlackPlayerId] = useState(initialBlackPlayerId);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [message, setMessage] = useState<string | null>(null);
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  useEffect(() => {
    const chess = new Chess(initialFen);
    setTurn(chess.turn());
  }, [initialFen]);

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      apiUrl,
      {
        transports: ["websocket"],
      },
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_game", { gameId, userId });
    });

    socket.on("game_state_update", (payload) => {
      if (payload.gameId !== gameId) {
        return;
      }

      setFen(payload.fenPosition);
      setStatus(payload.status);
      setTurn(payload.turn);
      setWhitePlayerId(payload.whitePlayerId);
      setBlackPlayerId(payload.blackPlayerId);

      if (payload.isCheckmate) {
        setMessage("Checkmate. Game finished.");
      } else if (payload.isDraw) {
        setMessage("Draw. Game finished.");
      } else if (payload.isCheck) {
        setMessage("Check.");
      } else {
        setMessage(null);
      }
    });

    socket.on("player_disconnected", (payload) => {
      if (payload.gameId === gameId) {
        setMessage("Opponent disconnected.");
      }
    });

    socket.on("server_error", (payload) => {
      setMessage(payload.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [gameId, userId]);

  const playerColor = useMemo(() => {
    if (userId === whitePlayerId) {
      return "white";
    }
    if (userId === blackPlayerId) {
      return "black";
    }
    return "white";
  }, [blackPlayerId, userId, whitePlayerId]);

  const canMove =
    status === "active" &&
    ((turn === "w" && userId === whitePlayerId) ||
      (turn === "b" && userId === blackPlayerId));

  const onDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
  }) => {
    if (!canMove) {
      return false;
    }

    if (!targetSquare) {
      return false;
    }

    const chess = new Chess(fen);
    const validation = chess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!validation) {
      return false;
    }

    // Optimistically update the board so the piece doesn't snap back
    // while waiting for the server to confirm the move.
    setFen(chess.fen());
    setTurn(chess.turn());

    socketRef.current?.emit("make_move", {
      gameId,
      userId,
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    return true;
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Game {gameId}</h1>
        <div className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-300">
          Status: {status}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,640px)_1fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <Chessboard
            options={{
              id: `board-${gameId}`,
              position: fen,
              boardOrientation: playerColor,
              onPieceDrop: onDrop,
            }}
          />
        </div>

        <aside className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-sm text-zinc-400">You are: {playerColor}</p>
          <p className="text-sm text-zinc-400">
            Turn: {turn === "w" ? "white" : "black"}
          </p>
          <p className="text-sm text-zinc-400">White player: {whitePlayerId}</p>
          <p className="text-sm text-zinc-400">
            Black player: {blackPlayerId ?? "Waiting..."}
          </p>
          {!canMove && status === "active" ? (
            <p className="text-sm text-amber-300">Waiting for opponent move.</p>
          ) : null}
          {message ? <p className="text-sm text-rose-300">{message}</p> : null}
        </aside>
      </div>
    </main>
  );
};
