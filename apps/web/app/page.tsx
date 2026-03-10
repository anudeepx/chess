import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "../auth";
import { createGame, joinGame, listWaitingGames } from "../lib/game-api";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-semibold">Multiplayer Chess</h1>
        <p className="text-zinc-300">
          Sign in with Google to create or join live games.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button
            type="submit"
            className="rounded-md bg-white px-4 py-2 font-medium text-zinc-900"
          >
            Continue with Google
          </button>
        </form>
      </main>
    );
  }

  const games = await listWaitingGames(session.user.id);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Chess Lobby</h1>
          <p className="text-sm text-zinc-400">
            Signed in as {session.user.email}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-md border border-zinc-700 px-3 py-2"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-xl font-medium">Create a game</h2>
        <p className="mt-1 text-sm text-zinc-400">You will play as White.</p>
        <form
          className="mt-4"
          action={async () => {
            "use server";
            const game = await createGame(session.user.id);
            redirect(`/game/${game.id}`);
          }}
        >
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-emerald-950"
          >
            Create New Game
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-xl font-medium">Waiting games</h2>
        <div className="mt-4 space-y-3">
          {games.length === 0 ? (
            <p className="text-sm text-zinc-400">No open games right now.</p>
          ) : (
            games.map((game) => (
              <div
                key={game.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-800 px-3 py-2"
              >
                <div className="text-sm text-zinc-300">
                  <p>Game: {game.id}</p>
                  <p className="text-zinc-500">
                    Created: {new Date(game.createdAt).toLocaleString()}
                  </p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await joinGame(session.user.id, game.id);
                    redirect(`/game/${game.id}`);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md border border-emerald-600 px-3 py-1.5 text-sm text-emerald-400"
                  >
                    Join game
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
