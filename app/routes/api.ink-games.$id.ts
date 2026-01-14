/**
 * @file api.ink-games.$id.ts
 * @description API route for getting Ink game state.
 * GET /api/ink-games/:id - Get current game state
 * @module routes/api.ink-games.$id
 */

import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import { inkGames, inkTurns } from "@server/db/schema";
import { eq, desc } from "drizzle-orm";
import type { RenderModel } from "@server/runtime";
import type { Route } from "./+types/api.ink-games.$id";

// --- GET /api/ink-games/:id ---

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  // Verify auth
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gameId = params.id;

  // Get game
  const game = await db
    .select()
    .from(inkGames)
    .where(eq(inkGames.id, gameId))
    .get();

  if (!game) {
    return Response.json({ error: "Game not found" }, { status: 404 });
  }

  // Verify ownership
  if (game.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get latest turn for current state
  const latestTurn = await db
    .select()
    .from(inkTurns)
    .where(eq(inkTurns.gameId, gameId))
    .orderBy(desc(inkTurns.turnIndex))
    .limit(1)
    .get();

  if (!latestTurn) {
    return Response.json({ error: "No turns found" }, { status: 404 });
  }

  // Reconstruct RenderModel from latest turn
  const rm: RenderModel = {
    gameId: game.id,
    turnIndex: game.turnIndex,
    status: game.status as "active" | "completed" | "abandoned",
    locale: game.locale as "zh-CN" | "en-US",
    blocks: JSON.parse(latestTurn.blocksJson),
    choices: JSON.parse(latestTurn.choicesJson),
    tags: JSON.parse(latestTurn.tagsJson),
    events: JSON.parse(latestTurn.eventsJson),
    checkpoint: {
      inkStateJson: game.inkStateJson,
      systemStateJson: game.systemStateJson,
      rngSeed: game.rngSeed,
    },
  };

  return Response.json(rm);
}
