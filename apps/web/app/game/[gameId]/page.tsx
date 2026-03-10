import { notFound, redirect } from "next/navigation";
import { auth } from "../../../auth";
import { getGame, joinGame } from "../../../lib/game-api";
import { GameRoom } from "./room";

type Props = {
  params: Promise<{ gameId: string }>;
};

export default async function GamePage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const { gameId } = await params;

  try {
    let result = await getGame(session.user.id, gameId);

    const canAccess =
      result.game.whitePlayerId === session.user.id ||
      result.game.blackPlayerId === session.user.id;

    if (!canAccess) {
      await joinGame(session.user.id, gameId);
      result = await getGame(session.user.id, gameId);
    }

    return (
      <GameRoom
        gameId={result.game.id}
        userId={session.user.id}
        initialFen={result.game.fenPosition}
        initialStatus={result.game.status}
        initialWhitePlayerId={result.game.whitePlayerId}
        initialBlackPlayerId={result.game.blackPlayerId}
      />
    );
  } catch {
    notFound();
  }
}
