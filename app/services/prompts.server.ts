/**
 * @file prompts.server.ts
 * @description Centralized prompt management for AI generation. Supports i18n and dynamic variable injection.
 * @module PromptService
 *
 * @features
 * - Multi-language support (zh/en).
 * - Template injection using `{{variable}}` syntax.
 * - Standardized JSON output requirements for all prompts.
 *
 * @maintenance
 * - When adding new languages, ensure all 4 prompt keys are implemented.
 * - Keep JSON structure instructions consistent with `story.server.ts` types.
 *
 * @author Claude Code
 * @date 2025-01-26
 */

export interface PromptTemplates {
  story_concept: string;
  story_map: string;
  choices: string;
  next_scene: string;
}

export const prompts: Record<string, PromptTemplates> = {
  zh: {
    story_concept: `
你需要为一个'{{storyType}}'类型的故事，生成一个包含作家、标题和写作风格的核心概念。
请使用 中文 (language: zh) 创作内容。
请严格按照以下JSON格式返回，不要有任何其他文字或markdown标记:
{
  "author": "一个有代表性的作家名字",
  "title": "一个创意小说标题",
  "writing_style": "一句简洁且富有想象力的写作风格描述，可以直接用在给AI的指示中"
}
`,
    story_map: `
你是一位顶级的游戏叙事设计师。请为一部名为《{{title}}》、由'{{author}}'创作的'{{storyType}}'风格的互动小说，设计一个结构丰富、引人入胜的“故事蓝图”。
请使用 中文 (language: zh) 创作所有内容（包括label和details）。

**核心要求:**
1. **结构复杂性**: 设计一个包含至少{{nodeNum}}个关键节点的非线性结构。
2. **完整节点**: 必须包含 "start" 节点和至少两个结局节点。
3. **清晰连接**: 包含 nodes 和 edges。
4. **严格的JSON格式**: 仅返回JSON。
`,
    choices: `
{{writingStyle}} 你是一位互动小说家。
根据下面的“当前场景”和“故事蓝图”，为玩家生成3个引人入胜的后续选择。
请使用 中文 (language: zh) 创作选项文本。
{
  "choices": [
    { "id": 1, "text": "..." },
    { "id": 2, "text": "..." },
    { "id": 3, "text": "..." }
  ]
}
`,
    next_scene: `
{{writingStyle}} 你是一位互动小说家，动态地推进故事。
请使用 中文 (language: zh) 进行创作。
1. **续写故事**: 基于历史和选择。
2. **生成选项**: 生成3个选项。
3. **参考蓝图**: current_node_id 必须存在于蓝图中。
{
  "current_node_id": "...",
  "content": "...",
  "choices": [...]
}
`
  },
  en: {
    story_concept: `
Generate a story concept (author, title, writing style) for a '{{storyType}}' story.
Use English (language: en).
Return strictly JSON:
{
  "author": "Representative author name",
  "title": "Creative novel title",
  "writing_style": "A concise and imaginative description of the writing style"
}
`,
    story_map: `
You are a top game narrative designer. Design an engaging "Story Blueprint" for '{{title}}' by '{{author}}' in '{{storyType}}' style.
Use English (language: en) for all content.

**Requirements:**
1. **Structure**: At least {{nodeNum}} key nodes with branches and merges.
2. **Nodes**: Must include "start" and at least two endings.
3. **Format**: Return strictly JSON with nodes and edges.
`,
    choices: `
{{writingStyle}} You are an interactive novelist.
Based on the "Current Scene" and "Story Blueprint", generate 3 engaging choices.
Use English (language: en).
{
  "choices": [
    { "id": 1, "text": "..." },
    { "id": 2, "text": "..." },
    { "id": 3, "text": "..." }
  ]
}
`,
    next_scene: `
{{writingStyle}} You are an interactive novelist advancing the story.
Use English (language: en).
1. **Next Scene**: Based on history and choice.
2. **Choices**: Generate 3 choices.
3. **Blueprint**: current_node_id must exist in the blueprint.
{
  "current_node_id": "...",
  "content": "...",
  "choices": [...]
}
`
  }
};

export function getPrompt(type: keyof PromptTemplates, language: string, variables: Record<string, any>): string {
  const lang = language.startsWith("zh") ? "zh" : "en";
  let template = prompts[lang][type];

  for (const [key, value] of Object.entries(variables)) {
    template = template.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  return template;
}
