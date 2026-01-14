/**
 * @file api.ink-games.$id.continue.ts
 * @description API route for continuing an Ink story.
 * POST /api/ink-games/:id/continue - Continue story to next choice point
 * @module routes/api.ink-games.$id.continue
 */

import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import { inkScenarios, inkGames, inkTurns } from "@server/db/schema";
import { eq } from "drizzle-orm";
import { runInkTurn, loadStoryJson } from "@server/runtime";
import type { Route } from "./+types/api.ink-games.$id.continue";

// --- Helpers ---

function generateId(): string {
  return crypto.randomUUID();
}

// --- POST /api/ink-games/:id/continue ---

export async function action({ request, params, context }: Route.ActionArgs) {
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

  if (game.status !== "active") {
    return Response.json({ error: "Game is not active" }, { status: 400 });
  }

  // Load scenario
  const scenario = await db
    .select()
    .from(inkScenarios)
    .where(eq(inkScenarios.id, game.scenarioId))
    .get();

  if (!scenario) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  // Load story and run
  const storyJson = await loadStoryJson(
    env as { ASSETS?: Fetcher },
    scenario.inkJsonPath
  );

  const { rm, inkStateJson, systemStateJson, status } = runInkTurn({
    storyJson,
    gameId,
    locale: game.locale as "zh-CN" | "en-US",
    turnIndex: game.turnIndex,
    status: game.status as "active" | "completed" | "abandoned",
    inkStateJson: game.inkStateJson,
    systemStateJson: game.systemStateJson,
    rngSeed: game.rngSeed,
  });

  // Save turn log
  await db.insert(inkTurns).values({
    id: generateId(),
    gameId,
    turnIndex: rm.turnIndex,
    inputChoiceId: null,
    blocksJson: JSON.stringify(rm.blocks),
    choicesJson: JSON.stringify(rm.choices),
    tagsJson: JSON.stringify(rm.tags),
    eventsJson: JSON.stringify(rm.events),
    inkStateJson,
    systemStateJson,
    createdAt: new Date(),
  });

  // Update game state
  await db
    .update(inkGames)
    .set({
      status,
      turnIndex: rm.turnIndex,
      inkStateJson,
      systemStateJson,
      updatedAt: new Date(),
    })
    .where(eq(inkGames.id, gameId));

  return Response.json(rm);
}
