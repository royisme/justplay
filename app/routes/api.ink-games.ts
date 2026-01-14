/**
 * @file api.ink-games.ts
 * @description API route for creating new Ink narrative games.
 * POST /api/ink-games - Create a new game and return first screen RenderModel
 * @module routes/api.ink-games
 */

import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import { inkScenarios, inkGames, inkTurns } from "@server/db/schema";
import { eq } from "drizzle-orm";
import {
  runInkTurn,
  getInitialInkState,
  defaultSystemState,
  generateRngSeed,
  zCreateGameRequest,
  loadStoryJson,
} from "@server/runtime";
import type { Route } from "./+types/api.ink-games";

// --- Helpers ---

function generateId(): string {
  return crypto.randomUUID();
}

// --- POST /api/ink-games ---

export async function action({ request, context }: Route.ActionArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  // Verify auth
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request
  const body = await request.json();
  const parsed = zCreateGameRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { scenarioKey, locale = "zh-CN" } = parsed.data;
  const userId = session.user.id;

  // Find scenario
  const scenario = await db
    .select()
    .from(inkScenarios)
    .where(eq(inkScenarios.key, scenarioKey))
    .get();

  if (!scenario) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  // Load story JSON using ASSETS binding
  const storyJson = await loadStoryJson(
    env as { ASSETS?: Fetcher },
    scenario.inkJsonPath
  );

  // Initialize game state
  const gameId = generateId();
  const rngSeed = generateRngSeed();
  const initInk = getInitialInkState(storyJson);
  const initSystem =
    scenario.defaultSystemStateJson || JSON.stringify(defaultSystemState());
  const now = new Date();

  // Create game record
  await db.insert(inkGames).values({
    id: gameId,
    userId,
    scenarioId: scenario.id,
    status: "active",
    slotIndex: null,
    locale,
    rngSeed,
    inkStateJson: initInk,
    systemStateJson: initSystem,
    turnIndex: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Run initial continue to get first screen
  const game = await db
    .select()
    .from(inkGames)
    .where(eq(inkGames.id, gameId))
    .get();

  if (!game) {
    return Response.json({ error: "Failed to create game" }, { status: 500 });
  }

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
