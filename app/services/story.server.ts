import type { OpenAI } from "openai";

export interface StoryConcept {
  author: string;
  title: string;
  writing_style: string;
}

export interface StoryNode {
  id: string;
  label: string;
  details: string;
}

export interface StoryEdge {
  from: string;
  to: string;
  label: string;
}

export interface StoryMap {
  nodes: StoryNode[];
  edges: StoryEdge[];
}

export interface Choice {
  id: number;
  text: string;
}

export interface SceneData {
  content: string;
  choices: Choice[];
  current_node_id: string;
}

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

export async function generateStoryConcept(
  openai: OpenAI,
  model: string,
  storyType: string,
  language: string = "zh"
): Promise<StoryConcept> {
  const languagePrompt = language.startsWith("zh") ? "中文" : "English";
  const prompt = `
    你需要为一个'${storyType}'类型的故事，生成一个包含作家、标题和写作风格的核心概念。
    请使用 ${languagePrompt} (language: ${language}) 创作内容。
    请严格按照以下JSON格式返回，不要有任何其他文字或markdown标记:
    {
      "author": "一个有代表性的作家名字",
      "title": "一个创意小说标题",
      "writing_style": "一句简洁且富有想象力的写作风格描述，可以直接用在给AI的指示中"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    const jsonStr = extractJsonFromString(content);
    if (!jsonStr) throw new Error("Invalid JSON from LLM");

    return JSON.parse(jsonStr) as StoryConcept;
  } catch (error) {
    console.error("Failed to generate story concept:", error);
    return {
      author: "一位神秘的作家",
      title: "失落的传说",
      writing_style: "你是一位模仿大师，正在以一位神秘作家的风格，讲述一个关于失落传说的故事。",
    };
  }
}

export async function generateStoryMap(
  openai: OpenAI,
  model: string,
  storyType: string,
  author: string,
  title: string,
  nodeNum: number,
  language: string = "zh"
): Promise<StoryMap> {
  const languagePrompt = language.startsWith("zh") ? "中文" : "English";
  const prompt = `
    你是一位顶级的游戏叙事设计师。请为一部名为《${title}》、由'${author}'创作的'${storyType}'风格的互动小说，设计一个结构丰富、引人入胜的“故事蓝图”。
    请使用 ${languagePrompt} (language: ${language}) 创作所有内容（包括label和details）。

    **核心要求:**
    1. **结构复杂性**: 故事蓝图必须具备非线性的特点。请设计一个包含**至少${nodeNum}个关键节点**的结构，并确保其中有**明确的分支与汇合**的路径。
    2. **完整节点**: 必须包含一个开端 (id: "start") 和至少两个不同的结局 (e.g., id: "end_good", id: "end_bad")。
    3. **清晰连接**: 必须包含 \`nodes\` 和 \`edges\` 两个部分。\`edges\` 用于定义节点之间的所有连接。
    4. **内容质量**: 节点 label 简短有力，details 生动具体；边 label 是具体的选择。
    5. **角色设定**: 包含主角及关联角色。
    6. **视角要求**: 第三人称视角。
    7. **严格的JSON格式**: 仅返回JSON。
  `;

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    const jsonStr = extractJsonFromString(content);
    if (!jsonStr) throw new Error("Invalid JSON from LLM for story map");

    return JSON.parse(jsonStr) as StoryMap;
  } catch (error) {
    console.error("Failed to generate story map:", error);
    return {
      nodes: [
        { id: "start", label: "故事开端", details: "故事正等待着你..." },
        { id: "end_bad", label: "迷失", details: "你迷失在了无尽的黑暗中。" }
      ],
      edges: [
        { from: "start", to: "end_bad", label: "走入黑暗。" }
  }
}

export async function generateChoices(
  openai: OpenAI,
  model: string,
  writingStyle: string,
  storyMap: StoryMap,
  sceneContent: string,
  language: string = "zh"
): Promise<Choice[]> {
  const languagePrompt = language.startsWith("zh") ? "中文" : "English";
  const prompt = `
    ${writingStyle} 你是一位互动小说家。
    **你的任务:**
    根据下面的“当前场景”和“故事蓝图”，为玩家生成3个引人入胜的后续选择。
    请使用 ${languagePrompt} (language: ${language}) 创作选项文本。

    **核心要求:**
    1. **多样性**: 选项提供不同的方向。
    2. **参考蓝图**: 至少有一个选项引导故事向蓝图中的节点发展。
    3. **JSON输出**: 仅返回JSON。
    {
      "choices": [
        { "id": 1, "text": "第一个选项" },
        { "id": 2, "text": "第二个选项" },
        { "id": 3, "text": "第三个选项" }
      ]
    }

    **故事蓝图:**
    ${JSON.stringify(storyMap)}

    **当前场景:**
    ${sceneContent}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    });

    const jsonStr = extractJsonFromString(response.choices[0].message.content);
    if (!jsonStr) throw new Error("Invalid choices JSON");

    return JSON.parse(jsonStr).choices as Choice[];
  } catch (error) {
    console.error("Failed to generate choices:", error);
    return [{ id: 1, text: "继续..." }];
  }
}

export async function generateNextScene(
  openai: OpenAI,
  model: string,
  writingStyle: string,
  storyMap: StoryMap,
  storyHistory: { role: string; content: string }[],
  choiceText: string,
  language: string = "zh"
): Promise<{ scene_data: SceneData; story_history: any[] }> {
  const languagePrompt = language.startsWith("zh") ? "中文" : "English";
  const systemPrompt = `
    ${writingStyle} 你的任务是作为一名才华横溢的互动小说家，动态地推进故事并创造引人入胜的选择。
    请使用 ${languagePrompt} (language: ${language}) 进行创作。
    **核心指令:**
    1. **续写故事**: 基于历史和选择创作下一段。
    2. **生成选项**: 生成3个选项。
    3. **参考蓝图**: 引用蓝图节点。
    4. **严格的节点ID**: current_node_id 必须存在于蓝图中。
    5. **JSON输出**: 格式如下:
    {
      "current_node_id": "节点ID",
      "content": "故事内容...",
      "choices": [{ "id": 1, "text": "..." }]
    }
  `;

  const userPrompt = `
    **故事蓝图:** ${JSON.stringify(storyMap)}
    **故事历史:** ${JSON.stringify(storyHistory.slice(-6))}
    **玩家选择:** "${choiceText}"
  `;

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.9,
    });

    const jsonStr = extractJsonFromString(response.choices[0].message.content);
    if (!jsonStr) throw new Error("Invalid next scene JSON");

    const sceneData = JSON.parse(jsonStr) as SceneData;
    const updatedHistory = [...storyHistory, { role: "assistant", content: sceneData.content }];

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
