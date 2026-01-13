/**
 * @file game.server.ts
 * @description Server-only game service for PixelWeaver v0.2.
 * Handles game lifecycle, slot management, and agent orchestration.
 * @module server/services/game
 */

import { eq, and, count, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@server/db/client";
import { games, gameScenarios, messages, type NewGame, type Game } from "@server/db/schema";
import type { Env } from "@server/config/env";
import { DMAgent } from "@server/agents/dm.agent";

export class GameService {
  constructor(private env: Env) {}

  /**
   * Create a new game in an available slot.
   */
  async createGame(userId: string, scenarioId: string): Promise<string> {
    const db = getDb(this.env);

    // 1. Check slots
    const activeGamesCount = await db
      .select({ count: count() })
      .from(games)
      .where(and(eq(games.userId, userId), eq(games.status, "active")));

    if (activeGamesCount[0].count >= 3) {
      throw new Error("No available slots. Finish or abandon a game first.");
    }

    // 2. Get Scenario
    const scenario = await db.query.gameScenarios.findFirst({
      where: eq(gameScenarios.id, scenarioId),
    });

    if (!scenario) {
      throw new Error("Scenario not found");
    }

    // 3. Determine Slot Index (simple logic: find first missing 1, 2, 3)
    // For now, just using next available or 1.
    // Ideally we query existing slots and pick the hole.
    const activeGames = await db
      .select()
      .from(games)
      .where(and(eq(games.userId, userId), eq(games.status, "active")));

    const usedSlots = activeGames.map(g => g.slotIndex).filter(Boolean);
    let slotIndex = 1;
    while (usedSlots.includes(slotIndex)) slotIndex++;

    const gameId = nanoid();

    // 4. Create Game Record
    const newGame: NewGame = {
      id: gameId,
      userId,
      scenarioId,
      title: "New Adventure", // Temporary title
      status: "active",
      slotIndex,
      currentChapter: 1,
      currentVolume: 1,
      storyMetadata: {
        outline: "",
        characters: [],
        relationships: [],
        inventory: {},
        plotSummary: []
      },
      createdAt: new Date(),
    };

    await db.insert(games).values(newGame);

    // 5. Initialize DM Agent (Start the interview/intro)
    // We don't generate the first message here synchronously to keep response fast?
    // Or we do it to return something immediately?
    // Let's create the root system message.

    /*
       Actually, `messages` table needs to be populated with the initial system prompt
       so the history context is set for the DM.
    */

    // Root system message (DM Prompt)
    await db.insert(messages).values({
        id: `${gameId}--system-${Date.now()}`,
        gameId,
        role: "system",
        content: scenario.dmSystemPrompt,
        depth: 0,
        isActivePath: true,
        chapterNumber: 0
    });

    // We might want to trigger the first DM response "Welcome, traveler..."
    // But usually we wait for user input or specific start signal.
    // For v0.2, "Character Creation" is the first step.
    // The DM should probably ask "Who are you?" or similar based on the scenario.

    return gameId;
  }

  /**
   * Get full game state including recent history.
   */
  async getGameState(gameId: string, userId: string) {
    const db = getDb(this.env);

    const game = await db.query.games.findFirst({
      where: and(eq(games.id, gameId), eq(games.userId, userId)),
      with: {
        // We might want to fetch scenario details too
      }
    });

    if (!game) return null;

    // Fetch active path messages (last N)
    const history = await db.select().from(messages)
        .where(and(eq(messages.gameId, gameId), eq(messages.isActivePath, true)))
        .orderBy(messages.createdAt)
        // .limit(50) // maybe limit?

    return { game, history };
  }
}
