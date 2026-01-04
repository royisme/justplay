/**
 * @file story.server.ts
 * @description Types and utilities for story generation using Vercel AI SDK with Zod schemas.
 * @module StoryService
 *
 * @features
 * - Type definitions for StoryMap, SceneData, and Choices with Zod schemas
 * - Type-safe structured output generation using AI SDK's generateObject
 * - Support for OpenRouter and multiple LLM providers
 *
 * @maintenance
 * - Keep Zod schemas in sync with TypeScript interfaces
 * - Update schemas when adding new story features
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { z } from "zod";
import type { AIService } from "./ai.server";

// --- Zod Schemas ---

export const StoryConceptSchema = z.object({
  author: z.string().describe("A representative author name for this genre"),
  title: z.string().describe("A creative novel title"),
  writing_style: z
    .string()
    .describe(
      "A concise and imaginative writing style description that can be used directly in AI instructions",
    ),
});

export const StoryNodeSchema = z.object({
  id: z.string().describe("Unique node identifier"),
  label: z.string().describe("Short, impactful node label"),
  details: z.string().describe("Vivid, specific scene details"),
});

export const StoryEdgeSchema = z.object({
  from: z.string().describe("Source node ID"),
  to: z.string().describe("Target node ID"),
  label: z.string().describe("Choice text that leads to this path"),
});

export const StoryMapSchema = z.object({
  nodes: z.array(StoryNodeSchema).describe("All story nodes"),
  edges: z.array(StoryEdgeSchema).describe("Connections between nodes"),
});

export const ChoiceSchema = z.object({
  id: z.number().describe("Choice identifier"),
  text: z.string().describe("Choice text displayed to player"),
});

export const SceneDataSchema = z.object({
  current_node_id: z
    .string()
    .describe("Current node ID from the story map blueprint"),
  content: z.string().describe("Story content for this scene"),
  choices: z.array(ChoiceSchema).describe("Available choices for the player"),
});

export const ChoicesResponseSchema = z.object({
  choices: z.array(ChoiceSchema),
});

// --- TypeScript Types (inferred from Zod schemas) ---

export type StoryConcept = z.infer<typeof StoryConceptSchema>;
export type StoryNode = z.infer<typeof StoryNodeSchema>;
export type StoryEdge = z.infer<typeof StoryEdgeSchema>;
export type StoryMap = z.infer<typeof StoryMapSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type SceneData = z.infer<typeof SceneDataSchema>;

// --- Generation Functions ---

export async function generateStoryConcept(
  aiService: AIService,
  storyType: string,
  language: string = "zh",
): Promise<StoryConcept> {
  const languagePrompt = language.startsWith("zh") ? "中文" : "English";
  const prompt = `
    你需要为一个'${storyType}'类型的故事，生成一个包含作家、标题和写作风格的核心概念。
    请使用 ${languagePrompt} (language: ${language}) 创作内容。

    要求：
    - author: 一个有代表性的作家名字
    - title: 一个创意小说标题
    - writing_style: 一句简洁且富有想象力的写作风格描述，可以直接用在给AI的指示中
  `;

  try {
    return await aiService.generateObject(prompt, StoryConceptSchema, 0.8);
  } catch (error) {
    console.error("Failed to generate story concept:", error);
    return {
      author: "一位神秘的作家",
      title: "失落的传说",
      writing_style:
        "你是一位模仿大师，正在以一位神秘作家的风格，讲述一个关于失落传说的故事。",
    };
  }
}

export async function generateStoryMap(
  aiService: AIService,
  storyType: string,
  author: string,
  title: string,
  nodeNum: number,
  language: string = "zh",
): Promise<StoryMap> {
  const languagePrompt = language.startsWith("zh") ? "中文" : "English";
  const prompt = `
    你是一位顶级的游戏叙事设计师。请为一部名为《${title}》、由'${author}'创作的'${storyType}'风格的互动小说，设计一个结构丰富、引人入胜的"故事蓝图"。
    请使用 ${languagePrompt} (language: ${language}) 创作所有内容（包括label和details）。

    **核心要求:**
    1. **结构复杂性**: 故事蓝图必须具备非线性的特点。请设计一个包含**至少${nodeNum}个关键节点**的结构，并确保其中有**明确的分支与汇合**的路径。
    2. **完整节点**: 必须包含一个开端 (id: "start") 和至少两个不同的结局 (e.g., id: "end_good", id: "end_bad")。
    3. **清晰连接**: nodes 定义所有节点，edges 定义节点之间的所有连接。
    4. **内容质量**: 节点 label 简短有力，details 生动具体；边 label 是具体的选择。
    5. **角色设定**: 包含主角及关联角色。
    6. **视角要求**: 第三人称视角。
  `;

  try {
    return await aiService.generateObject(prompt, StoryMapSchema, 0.7);
  } catch (error) {
    console.error("Failed to generate story map:", error);
    return {
      nodes: [
        { id: "start", label: "故事开端", details: "故事正等待着你..." },
        {
          id: "end_bad",
          label: "迷失",
          details: "你迷失在了无尽的黑暗中。",
        },
      ],
      edges: [{ from: "start", to: "end_bad", label: "走入黑暗。" }],
    };
  }
}

export async function generateChoices(
  aiService: AIService,
  writingStyle: string,
  storyMap: StoryMap,
  sceneContent: string,
  language: string = "zh",
): Promise<Choice[]> {
  const languagePrompt = language.startsWith("zh") ? "中文" : "English";
  const prompt = `
    ${writingStyle} 你是一位互动小说家。
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
    ${sceneContent}
  `;

  try {
    const result = await aiService.generateObject(
      prompt,
      ChoicesResponseSchema,
      0.9,
    );
    return result.choices;
  } catch (error) {
    console.error("Failed to generate choices:", error);
    return [{ id: 1, text: "继续..." }];
  }
}

export async function generateNextScene(
  aiService: AIService,
  writingStyle: string,
  storyMap: StoryMap,
  storyHistory: { role: "user" | "assistant"; content: string }[],
  choiceText: string,
  language: string = "zh",
): Promise<{
  scene_data: SceneData;
  story_history: { role: "user" | "assistant"; content: string }[];
}> {
  const languagePrompt = language.startsWith("zh") ? "中文" : "English";
  const systemPrompt = `
    ${writingStyle} 你的任务是作为一名才华横溢的互动小说家，动态地推进故事并创造引人入胜的选择。
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

  try {
    const sceneData = await aiService.generateObjectWithHistory(
      systemPrompt,
      userPrompt,
      storyHistory,
      SceneDataSchema,
      0.9,
    );

    const updatedHistory: { role: "user" | "assistant"; content: string }[] = [
      ...storyHistory,
      { role: "assistant", content: sceneData.content },
    ];

    return { scene_data: sceneData, story_history: updatedHistory };
  } catch (error) {
    console.error("Failed to generate next scene:", error);
    return {
      scene_data: {
        current_node_id: "start",
        content: "神秘的迷雾笼罩了你的思绪...",
        choices: [{ id: 1, text: "重新审视" }],
      },
      story_history: storyHistory,
    };
  }
}

// --- Legacy utility (kept for backward compatibility) ---

export function extractJsonFromString(text: string | null): string | null {
  if (!text) return null;

  let cleaned = text;
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
  }

  cleaned = cleaned.trim();
  const firstBracket = cleaned.indexOf("{");
  const lastBracket = cleaned.lastIndexOf("}");

  if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
    return null;
  }

  return cleaned.substring(firstBracket, lastBracket + 1);
}
