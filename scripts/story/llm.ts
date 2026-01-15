/**
 * @file llm.ts
 * @description LLM 调用封装，复用项目的 AIService
 */

import { AIService, type AIServiceConfig } from "@server/services/ai.server";
import type { z } from "zod";

/**
 * 从环境变量获取 AI 配置
 */
function getAIConfigFromEnv(modelKey?: string): Partial<AIServiceConfig> {
  // 如果指定了模型 key，优先使用对应的环境变量
  if (modelKey) {
    const upperKey = modelKey.toUpperCase();
    const apiKey = process.env[`${upperKey}_API_KEY`];
    const baseUrl = process.env[`${upperKey}_BASE_URL`];
    const model = process.env[`${upperKey}_MODEL`];

    if (apiKey && baseUrl && model) {
      return {
        providerName: modelKey,
        apiKey,
        baseURL: baseUrl,
        model,
      };
    }
  }

  // 回退到通用配置
  return {
    CUSTOM_API_KEY: process.env.CUSTOM_API_KEY,
    CUSTOM_BASE_URL: process.env.CUSTOM_BASE_URL,
    CUSTOM_MODEL: process.env.CUSTOM_MODEL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
  } as any;
}

/**
 * 为脚本环境创建 AIService 实例
 * @param modelKey 可选的模型配置 key，例如 'bible'、'scene'、'dialogue'
 */
export async function createAIService(modelKey?: string): Promise<AIService> {
  const env = getAIConfigFromEnv(modelKey);
  return AIService.createDefault(env as any);
}

/**
 * 生成结构化 JSON 对象
 * @param prompt 提示词
 * @param schema Zod schema
 * @param temperature 温度参数
 * @param modelKey 可选的模型配置 key
 */
export async function generateObject<TSchema extends z.ZodType>(
  prompt: string,
  schema: TSchema,
  temperature: number = 0.8,
  modelKey?: string
): Promise<z.infer<TSchema>> {
  const ai = await createAIService(modelKey);
  return ai.generateObject(prompt, schema, temperature);
}
