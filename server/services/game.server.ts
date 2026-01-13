/**
 * @file game.server.ts
 * @description Server-only game service orchestrating AI generation and database operations.
 * This file must NEVER be imported from client code.
 * @module server/services/game
 *
 * @features
 * - createNewGame: Chains AI prompts to generate concept, story map, and initial scene
 * - advanceGame: Handles user choices and generates next scenes
 * - Integration: Bridges AIService and Database layers
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { eq } from "drizzle-orm";
import { getDb } from "@server/db/client";
import { games } from "@server/db/schema";
import type { Env } from "@server/config/env";
import { getLanguagePrompt } from "@server/i18n.server";
import type { AIService } from "./ai.server";
import type { SupportedLanguage } from "@shared/types/i18n";
import type {
  SceneData,
  StoryMap,
  StoryHistoryEntry,
} from "@shared/types/game";
import {
  StoryConceptSchema,
  StoryMapSchema,
  ChoicesResponseSchema,
  SceneDataSchema,
} from "@shared/schemas/story.schema";

/**
 * Game service for managing game state and AI interactions.
 */
export class GameService {
  constructor(
    private ai: AIService,
    private env: Env,
  ) {}

  /**
   * Create a new game with AI-generated story.
   *
   * @param storyType - The genre/type of story to generate
   * @param language - Language for content generation
   * @param nodeNum - Number of story nodes to generate (default: 6)
   * @returns The ID of the newly created game
   */
  async createNewGame(
    userId: string,
    storyType: string,
    language: SupportedLanguage,
    nodeNum: number = 6,
  ): Promise<number> {
    const db = getDb(this.env);
    const languagePrompt = getLanguagePrompt(language);

    // 1. Create initial game record
    const [{ id: gameId }] = await db
      .insert(games)
      .values({
        storyType,
        userId,
      })
      .returning({ id: games.id });

    // 2. Generate Story Concept
    const conceptPrompt = `
      你需要为一个'${storyType}'类型的故事，生成一个包含作家、标题和写作风格的核心概念。
      请使用 ${languagePrompt} (language: ${language}) 创作内容。

      要求：
      - author: 一个有代表性的作家名字
      - title: 一个创意小说标题
      - writing_style: 一句简洁且富有想象力的写作风格描述，可以直接用在给AI的指示中
    `;
    const concept = await this.ai.generateObject(
      conceptPrompt,
      StoryConceptSchema,
      0.8,
    );

    // 3. Generate Story Map (blueprint)
    const mapPrompt = `
      你是一位顶级的游戏叙事设计师。请为一部名为《${concept.title}》、由'${concept.author}'创作的'${storyType}'风格的互动小说，设计一个结构丰富、引人入胜的"故事蓝图"。
      请使用 ${languagePrompt} (language: ${language}) 创作所有内容（包括label和details）。

      **核心要求:**
      1. **结构复杂性**: 故事蓝图必须具备非线性的特点。请设计一个包含**至少${nodeNum}个关键节点**的结构，并确保其中有**明确的分支与汇合**的路径。
      2. **完整节点**: 必须包含一个开端 (id: "start") 和至少两个不同的结局 (e.g., id: "end_good", id: "end_bad")。
      3. **清晰连接**: nodes 定义所有节点，edges 定义节点之间的所有连接。
      4. **内容质量**: 节点 label 简短有力，details 生动具体；边 label 是具体的选择。
      5. **角色设定**: 包含主角及关联角色。
      6. **视角要求**: 第三人称视角。
    `;
    const storyMap = await this.ai.generateObject(
      mapPrompt,
      StoryMapSchema,
      0.7,
    );

    // 4. Generate Initial Scene Choices
    const startNode =
      storyMap.nodes.find((n) => n.id === "start") || storyMap.nodes[0];
    const choicesPrompt = `
      ${concept.writing_style} 你是一位互动小说家。
      **你的任务:**
      根据下面的"当前场景"和"故事蓝图"，为玩家生成3个引人入胜的后续选择。
      请使用 ${languagePrompt} (language: ${language}) 创作选项文本。

      **核心要求:**
      1. **多样性**: 选项提供不同的方向。
      2. **参考蓝图**: 至少有一个选项引导故事向蓝图中的节点发展。
      3. 每个选项有唯一的id (1, 2, 3) 和描述性的text。

      **故事蓝图:**
      ${JSON.stringify(storyMap)}

      **当前场景:**
      ${startNode.details}
    `;
    const choicesResult = await this.ai.generateObject(
      choicesPrompt,
      ChoicesResponseSchema,
      0.9,
    );

    // 5. Assemble initial scene
    const initialScene: SceneData = {
      content: startNode.details,
      choices: choicesResult.choices,
      current_node_id: startNode.id,
    };

    const storyHistory: StoryHistoryEntry[] = [
      { role: "assistant", content: startNode.details },
    ];

    // 6. Update game record with generated content
    await db
      .update(games)
      .set({
        writingStyle: concept.writing_style,
        author: concept.author,
        title: concept.title,
        storyMap: storyMap as unknown as Record<string, unknown>,
        storyHistory: storyHistory,
        currentSceneJson: initialScene as unknown as Record<string, unknown>,
        currentNodeId: startNode.id,
        updatedAt: new Date(),
      })
      .where(eq(games.id, gameId));

    return gameId;
  }

  /**
   * Advance the game by processing a player's choice.
   *
   * @param gameId - The ID of the game to advance
   * @param choiceText - The text of the player's choice
   * @param language - Language for content generation
   * @returns The next scene data
   */
  async advanceGame(
    gameId: number,
    choiceText: string,
    language: SupportedLanguage,
  ): Promise<SceneData> {
    const db = getDb(this.env);
    const languagePrompt = getLanguagePrompt(language);

    // Fetch current game state
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
    });

    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    const storyMap = game.storyMap as unknown as StoryMap;
    const storyHistory = (game.storyHistory as StoryHistoryEntry[]) || [];

    // Add user choice to history
    storyHistory.push({ role: "user", content: choiceText });

    // Generate next scene
    const systemPrompt = `
      ${game.writingStyle} 你的任务是作为一名才华横溢的互动小说家，动态地推进故事并创造引人入胜的选择。
      请使用 ${languagePrompt} (language: ${language}) 进行创作。
      **核心指令:**
      1. **续写故事**: 基于历史和选择创作下一段。
      2. **生成选项**: 生成3个选项。
      3. **参考蓝图**: 引用蓝图节点。
      4. **严格的节点ID**: current_node_id 必须存在于蓝图中。
    `;

    const userPrompt = `
      **故事蓝图:** ${JSON.stringify(storyMap)}
      **故事历史:** ${JSON.stringify(storyHistory.slice(-6))}
      **玩家选择:** "${choiceText}"
    `;

    const nextScene = await this.ai.generateObjectWithHistory(
      systemPrompt,
      userPrompt,
      storyHistory.slice(-6),
      SceneDataSchema,
      0.9,
    );

    // Add AI response to history
    storyHistory.push({ role: "assistant", content: nextScene.content });

    // Update game state
    await db
      .update(games)
      .set({
        storyHistory: storyHistory,
        currentSceneJson: nextScene as unknown as Record<string, unknown>,
        currentNodeId: nextScene.current_node_id,
        updatedAt: new Date(),
      })
      .where(eq(games.id, gameId));

    return nextScene;
  }

  /**
   * Get a game by ID.
   *
   * @param gameId - The ID of the game to fetch
   * @returns The game record or null if not found
   */
  async getGame(gameId: number) {
    const db = getDb(this.env);
    return await db.query.games.findFirst({
      where: eq(games.id, gameId),
    });
  }
}
