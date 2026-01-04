/**
 * @file ai.server.ts
 * @description Server-only AI service using Vercel AI SDK with OpenRouter provider.
 * This file must NEVER be imported from client code.
 * @module server/services/ai
 *
 * @features
 * - Supports OpenRouter for access to multiple LLM providers (OpenAI, Anthropic, etc.)
 * - Uses `generateText` with `Output` for type-safe structured JSON output with Zod schemas
 * - Uses `generateText` for simple text generation
 * - Configurable base URL for custom endpoints
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { generateText, Output } from "ai";
import type { ModelMessage } from "@ai-sdk/provider-utils";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import type { AIConfig } from "@server/config/env";

/**
 * AI Service class for generating text and structured objects using LLMs.
 * Uses OpenRouter for flexible model selection.
 */
export class AIService {
  private openrouter: ReturnType<typeof createOpenRouter>;
  private model: string;

  constructor(config: AIConfig) {
    this.openrouter = createOpenRouter({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.model = config.model;
  }

  /**
   * Generate structured JSON output using a Zod schema for type safety.
   * This is the preferred method for extracting structured data from LLM responses.
   *
   * @param prompt - The prompt to send to the LLM
   * @param schema - Zod schema defining the expected output structure
   * @param temperature - Sampling temperature (0-1), default 0.7
   * @returns Parsed and validated object matching the schema
   */
  async generateObject<TSchema extends z.ZodType>(
    prompt: string,
    schema: TSchema,
    temperature: number = 0.7
  ): Promise<z.infer<TSchema>> {
    try {
      const { output } = await generateText({
        model: this.openrouter(this.model),
        output: Output.object({
          schema: schema,
        }),
        prompt: prompt,
        temperature: temperature,
      });

      return output as z.infer<TSchema>;
    } catch (error) {
      console.error("[AIService] generateObject error:", error);
      throw error;
    }
  }

  /**
   * Generate structured JSON output with conversation history context.
   * Useful for multi-turn interactions where context matters.
   *
   * @param systemPrompt - System-level instructions
   * @param userPrompt - The current user prompt
   * @param history - Previous conversation messages
   * @param schema - Zod schema defining the expected output structure
   * @param temperature - Sampling temperature (0-1), default 0.9
   * @returns Parsed and validated object matching the schema
   */
  async generateObjectWithHistory<TSchema extends z.ZodType>(
    systemPrompt: string,
    userPrompt: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    schema: TSchema,
    temperature: number = 0.9
  ): Promise<z.infer<TSchema>> {
    try {
      const messages: ModelMessage[] = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userPrompt },
      ];

      const { output } = await generateText({
        model: this.openrouter(this.model),
        output: Output.object({
          schema: schema,
        }),
        messages: messages,
        temperature: temperature,
      });

      return output as z.infer<TSchema>;
    } catch (error) {
      console.error("[AIService] generateObjectWithHistory error:", error);
      throw error;
    }
  }

  /**
   * Generate plain text response without structured output.
   * Use this for creative writing or when structured output is not needed.
   *
   * @param prompt - The prompt to send to the LLM
   * @param temperature - Sampling temperature (0-1), default 0.7
   * @returns Generated text string
   */
  async generateText(prompt: string, temperature: number = 0.7): Promise<string> {
    try {
      const { text } = await generateText({
        model: this.openrouter(this.model),
        prompt: prompt,
        temperature: temperature,
      });

      return text;
    } catch (error) {
      console.error("[AIService] generateText error:", error);
      throw error;
    }
  }

  /**
   * Generate text with conversation history context.
   *
   * @param systemPrompt - System-level instructions
   * @param userPrompt - The current user prompt
   * @param history - Previous conversation messages
   * @param temperature - Sampling temperature (0-1), default 0.9
   * @returns Generated text string
   */
  async generateTextWithHistory(
    systemPrompt: string,
    userPrompt: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    temperature: number = 0.9
  ): Promise<string> {
    try {
      const messages: ModelMessage[] = [
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
      console.error("[AIService] generateTextWithHistory error:", error);
      throw error;
    }
  }
}
