/**
 * @file game.server.ts
 * @description Server-only game service for PixelWeaver v0.2.
 * Handles game lifecycle, slot management, and agent orchestration.
 * @module server/services/game
 */

import { eq, and, count, desc, asc } from "drizzle-orm";
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

    // 6. Generate Opening Narrative
    const dmAgent = new DMAgent({
      game: newGame,
      scenario,
      history: [], // No history yet
      providerConfig: {
        baseUrl: this.env.CUSTOM_BASE_URL,
        apiKey: this.env.CUSTOM_API_KEY,
      },
    });

    try {
      const openingContent = await dmAgent.generateOpening();

      await db.insert(messages).values({
        id: `${gameId}--opening`,
        gameId,
        role: "assistant",
        content: openingContent,
        depth: 1,
        isActivePath: true,
        chapterNumber: 1,
      });
    } catch (error) {
      console.error("Failed to generate opening:", error);
      // Fallback if AI fails
      await db.insert(messages).values({
        id: `${gameId}--opening`,
        gameId,
        role: "assistant",
        content: "欢迎来到新的冒险。这是一个充满未知的世界，请描述你的角色并开始探索...",
        depth: 1,
        isActivePath: true,
        chapterNumber: 1,
      });
    }

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

  /**
   * Get all active games for a user (for sidebar/dashboard).
   */
  async getActiveGames(userId: string) {
    const db = getDb(this.env);
    return db.select().from(games)
      .where(and(eq(games.userId, userId), eq(games.status, "active")))
      .orderBy(games.slotIndex);
  }

  /**
   * Get all completed games for a user (library).
   */
  async getCompletedGames(userId: string) {
    const db = getDb(this.env);
    return db.select().from(games)
      .where(and(eq(games.userId, userId), eq(games.status, "completed")))
      .orderBy(desc(games.completedAt));
  }

  /**
   * Complete a game - converts it to a story book.
   */
  async completeGame(gameId: string, userId: string): Promise<void> {
    const db = getDb(this.env);

    const game = await db.query.games.findFirst({
      where: and(eq(games.id, gameId), eq(games.userId, userId), eq(games.status, "active")),
    });

    if (!game) {
      throw new Error("Game not found or not active");
    }

    // Calculate word count from active path messages
    const activeMessages = await db.select().from(messages)
      .where(and(eq(messages.gameId, gameId), eq(messages.isActivePath, true)));

    const wordCount = activeMessages
      .filter(m => m.role === "assistant")
      .reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);

    // Update game status
    await db.update(games)
      .set({
        status: "completed",
        slotIndex: null, // Release slot
        completedAt: new Date(),
        bookMetadata: {
          coverImage: "",
          wordCount,
          endingType: "Completed",
        },
      })
      .where(eq(games.id, gameId));
  }

  /**
   * Abandon a game - releases the slot.
   */
  async abandonGame(gameId: string, userId: string): Promise<void> {
    const db = getDb(this.env);

    const game = await db.query.games.findFirst({
      where: and(eq(games.id, gameId), eq(games.userId, userId), eq(games.status, "active")),
    });

    if (!game) {
      throw new Error("Game not found or not active");
    }

    await db.update(games)
      .set({
        status: "abandoned",
        slotIndex: null, // Release slot
      })
      .where(eq(games.id, gameId));
  }

  /**
   * Add a message to the game and get AI response.
   */
  async advanceGame(gameId: string, userId: string, userInput: string) {
    const db = getDb(this.env);

    const game = await db.query.games.findFirst({
      where: and(eq(games.id, gameId), eq(games.userId, userId), eq(games.status, "active")),
    });

    if (!game) {
      throw new Error("Game not found or not active");
    }

    // Get the last message to use as parent
    const lastMessage = await db.select().from(messages)
      .where(and(eq(messages.gameId, gameId), eq(messages.isActivePath, true)))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const parentId = lastMessage[0]?.id || null;
    const depth = (lastMessage[0]?.depth || 0) + 1;

    // Insert user message
    const userMessageId = `${gameId}--user-${Date.now()}`;
    await db.insert(messages).values({
      id: userMessageId,
      gameId,
      parentId,
      role: "user",
      content: userInput,
      depth,
      isActivePath: true,
      chapterNumber: game.currentChapter,
    });

    // 6. Get Scenario
    const scenario = await db.query.gameScenarios.findFirst({
      where: eq(gameScenarios.id, game.scenarioId),
    });

    if (!scenario) {
      throw new Error("Scenario not found");
    }

    // 7. Get History for Context
    const history = await db.select().from(messages)
      .where(and(eq(messages.gameId, gameId), eq(messages.isActivePath, true)))
      .orderBy(asc(messages.createdAt));

    // 8. Call DM Agent
    const dmAgent = new DMAgent({
      game,
      scenario,
      history,
      providerConfig: {
        baseUrl: this.env.CUSTOM_BASE_URL,
        apiKey: this.env.CUSTOM_API_KEY,
      },
    });

    let assistantContent: string;
    try {
      assistantContent = await dmAgent.generateResponse(userInput);
    } catch (error) {
      console.error("AI Generation failed:", error);
      assistantContent = "系统连接不稳定，DM 暂时无法响应。请稍后再试。";
    }

    const assistantMessageId = `${gameId}--assistant-${Date.now() + 1}`;

    await db.insert(messages).values({
      id: assistantMessageId,
      gameId,
      parentId: userMessageId,
      role: "assistant",
      content: assistantContent,
      depth: depth + 1,
      isActivePath: true,
      chapterNumber: game.currentChapter,
    });

    return { userMessageId, assistantMessageId };
  }
}
