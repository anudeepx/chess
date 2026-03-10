# Multiplayer Chess Platform

Production-style full-stack chess platform built in a Turborepo.

## Stack

- Frontend: `apps/web` (Next.js App Router, TypeScript, Tailwind, `react-chessboard`, `chess.js`)
- Backend: `apps/api` (Node.js, Express, Socket.io, TypeScript)
- Database: PostgreSQL + Prisma (`packages/db`)
- Auth: NextAuth (Auth.js) with Google OAuth + Prisma adapter
- Shared types: `packages/types`

## Project structure

- `apps/web`: frontend app + Google OAuth, lobby, game room UI
- `apps/api`: REST game endpoints + real-time Socket.io gameplay events
- `packages/db`: Prisma schema and shared Prisma client
- `packages/types`: shared API and WebSocket contracts

## Environment setup

Copy each example file:

- `apps/web/.env.example` -> `apps/web/.env`
- `apps/api/.env.example` -> `apps/api/.env`

Required values:

- `DATABASE_URL`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `INTERNAL_API_KEY` (same value in both apps)
- `API_URL` and `NEXT_PUBLIC_API_URL` in `apps/web`

## Local development

1. Install dependencies

```bash
pnpm install
```

2. Generate Prisma client

```bash
pnpm --filter @repo/db db:generate
```

3. Run Prisma migrations

```bash
pnpm --filter @repo/db db:migrate
```

4. Start apps

```bash
pnpm dev
```

Default ports:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

## Core API

REST (requires `x-user-id` header and optional `x-api-key`):

- `POST /games` -> create game
- `GET /games` -> list waiting games
- `POST /games/:gameId/join` -> join game
- `GET /games/:gameId` -> game + move history

WebSocket events:

- Client -> Server: `create_game`, `join_game`, `make_move`
- Server -> Client: `game_state_update`, `player_disconnected`

## Notes

- Server is authoritative for every move and validates using `chess.js`.
- FEN position and SAN moves are persisted in PostgreSQL.
- Google OAuth is the only sign-in method.
