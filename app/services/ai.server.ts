/**
 * @file ai.server.ts
 * @description AI service using Vercel AI SDK with OpenRouter provider for flexible LLM access.
 * @module AIService
 *
 * @features
 * - Supports OpenRouter for access to multiple LLM providers (OpenAI, Anthropic, etc.)
 * - Uses `generateObject` for type-safe structured JSON output with Zod schemas
 * - Uses `generateText` for simple text generation
 * - Configurable base URL for custom endpoints
 *
 * @maintenance
 * - Update default model as newer models become available
 * - Add new schema types as needed for different generation tasks
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { generateText, generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import type { ZodType, infer as ZodInfer } from "zod";

// Re-export Zod for convenience in other modules
export { z };

export class AIService {
  private openrouter: ReturnType<typeof createOpenRouter>;
  private model: string;

  constructor(
    apiKey: string,
    baseURL?: string,
    model: string = "openai/gpt-4o",
  ) {
    this.openrouter = createOpenRouter({
      apiKey: apiKey,
      baseURL: baseURL || "https://openrouter.ai/api/v1",
    });
    this.model = model;
  }

  /**
   * Generate structured JSON output using a Zod schema for type safety.
   * This is the preferred method for extracting structured data from LLM responses.
   */
  async generateObject<T extends ZodType>(
    prompt: string,
    schema: T,
    temperature: number = 0.7,
  ): Promise<ZodInfer<T>> {
    try {
      const { object } = await generateObject({
        model: this.openrouter(this.model),
        schema: schema,
        prompt: prompt,
        temperature: temperature,
      });

      return object as ZodInfer<T>;
    } catch (error) {
      console.error("AIService generateObject Error:", error);
      throw error;
    }
  }

  /**
   * Generate structured JSON output with conversation history context.
   * Useful for multi-turn interactions where context matters.
   */
  async generateObjectWithHistory<T extends ZodType>(
    systemPrompt: string,
    userPrompt: string,
    history: { role: "user" | "assistant"; content: string }[],
    schema: T,
    temperature: number = 0.9,
  ): Promise<ZodInfer<T>> {
    try {
      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userPrompt },
      ];

      const { object } = await generateObject({
        model: this.openrouter(this.model),
        schema: schema,
        messages: messages,
        temperature: temperature,
      });

      return object as ZodInfer<T>;
    } catch (error) {
      console.error("AIService generateObjectWithHistory Error:", error);
      throw error;
    }
  }

  /**
   * Generate plain text response without structured output.
   * Use this for creative writing or when structured output is not needed.
   */
  async generateText(
    prompt: string,
    temperature: number = 0.7,
  ): Promise<string> {
    try {
      const { text } = await generateText({
        model: this.openrouter(this.model),
        prompt: prompt,
        temperature: temperature,
      });

      return text;
    } catch (error) {
      console.error("AIService generateText Error:", error);
      throw error;
    }
  }

  /**
   * Generate text with conversation history context.
   */
  async generateTextWithHistory(
    systemPrompt: string,
    userPrompt: string,
    history: { role: "user" | "assistant"; content: string }[],
    temperature: number = 0.9,
  ): Promise<string> {
    try {
      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userPrompt },
      ];

      const { text } = await generateText({
        model: this.openrouter(this.model),
        messages: messages,
        temperature: temperature,
      });

      return text;
    } catch (error) {
      console.error("AIService generateTextWithHistory Error:", error);
      throw error;
    }
  }
}
