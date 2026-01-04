/**
 * @file game.server.ts
 * @description Core business logic service for the JustPlay adventure game.
 * Orchestrates AI generation with Vercel AI SDK, database persistence, and game state management.
 * @module GameService
 *
 * @features
 * - createNewGame: Chains AI prompts to generate concept, story map, and initial scene.
 * - advanceGame: Handles user choices, maintains story history context, and generates next scenes.
 * - Integration: Bridges AIService (AI SDK + OpenRouter) and DB (D1) layers.
 *
 * @maintenance
 * - Ensure storyMap structure stays synced with Zod schemas in story.server.ts.
 * - Monitor AI response times; this service performs sequential await calls which can be slow.
 *
 * @author Claude Code (Migrated from legacy Python `story_generator.py`)
 * @date 2025-01-26
 */

import type { AIService } from "./ai.server";
import * as db from "./db.server";
import type { Env } from "../db/client";
import {
  type StoryConcept,
  type StoryMap,
  type SceneData,
  type Choice,
  StoryConceptSchema,
  StoryMapSchema,
  ChoicesResponseSchema,
  SceneDataSchema,
} from "./story.server";

export class GameService {
  constructor(
    private ai: AIService,
    private env: Env,
  ) {}

  async createNewGame(
    storyType: string,
    language: string,
    nodeNum: number = 6,
  ) {
    const gameId = await db.createGame(this.env, storyType);
    const languagePrompt = language.startsWith("zh") ? "中文" : "English";

    // 1. Generate Concept
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

    // 2. Generate Story Map
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

    // 3. Generate Initial Scene Choices
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

    const initialScene: SceneData = {
      content: startNode.details,
      choices: choicesResult.choices,
      current_node_id: startNode.id,
    };

    const storyHistory: { role: "user" | "assistant"; content: string }[] = [
      { role: "assistant", content: startNode.details },
    ];

    // 4. Update DB
    await db.updateGame(this.env, gameId, {
      writingStyle: concept.writing_style,
      author: concept.author,
      title: concept.title,
      storyMap: storyMap,
      storyHistory: storyHistory,
      currentSceneJson: initialScene,
      currentNodeId: startNode.id,
    });

    return gameId;
  }

  async advanceGame(gameId: number, choiceText: string, language: string) {
    const game = await db.getGame(this.env, gameId);
    if (!game) throw new Error("Game not found");

    const languagePrompt = language.startsWith("zh") ? "中文" : "English";
    const storyMap = game.storyMap as StoryMap;
    const storyHistory = game.storyHistory as {
      role: "user" | "assistant";
      content: string;
    }[];

    // Add user choice to history
    storyHistory.push({ role: "user", content: choiceText });

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

    storyHistory.push({ role: "assistant", content: nextScene.content });

    await db.updateGame(this.env, gameId, {
      storyHistory: storyHistory,
      currentSceneJson: nextScene,
      currentNodeId: nextScene.current_node_id,
    });

    return nextScene;
  }
}
