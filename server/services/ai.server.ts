/**
 * @file ai.server.ts
 * @description Server-only AI service using Vercel AI SDK with dynamic provider support.
 * Supports any OpenAI-compatible provider configured in the database.
 * This file must NEVER be imported from client code.
 * @module server/services/ai
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { generateText, Output } from "ai";
import type { ModelMessage } from "@ai-sdk/provider-utils";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "@server/db/client";
import { providers } from "@server/db/schema";
import type { Env } from "@server/config/env";
import type { Provider } from "@server/db/schema";

// --- Types ---

export interface AIServiceConfig {
  providerName: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

// --- Provider Factory ---

/**
 * Create an AI provider instance from configuration.
 */
function createProvider(config: AIServiceConfig) {
  return createOpenAICompatible({
    name: config.providerName,
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
}

/**
 * Get the default provider configuration from the database.
 * Falls back to environment variables if no default is set.
 */
export async function getDefaultProviderConfig(
  env: Env
): Promise<AIServiceConfig> {
  const db = getDb(env);

  // Try to find the default active provider
  const defaultProvider = await db.query.providers.findFirst({
    where: and(eq(providers.isDefault, true), eq(providers.isActive, true)),
  });

  if (defaultProvider && defaultProvider.models.length > 0) {
    return {
      providerName: defaultProvider.name,
      baseURL: defaultProvider.baseURL,
      apiKey: defaultProvider.apiKey,
      model: defaultProvider.models[0],
    };
  }

  // Fallback to environment variables
  const apiKey = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No AI provider configured. Set up a provider in admin or configure environment variables."
    );
  }

  return {
    providerName: "openrouter",
    baseURL:
      env.OPENROUTER_BASE_URL ||
      env.OPENAI_BASE_URL ||
      "https://openrouter.ai/api/v1",
    apiKey,
    model: env.OPENROUTER_MODEL || env.OPENAI_MODEL || "openai/gpt-4o",
  };
}

/**
 * Get a specific provider configuration from the database.
 */
export async function getProviderConfig(
  env: Env,
  providerId: number,
  model?: string
): Promise<AIServiceConfig> {
  const db = getDb(env);

  const provider = await db.query.providers.findFirst({
    where: and(eq(providers.id, providerId), eq(providers.isActive, true)),
  });

  if (!provider) {
    throw new Error(`Provider with id ${providerId} not found or inactive`);
  }

  const selectedModel = model || provider.models[0];
  if (!provider.models.includes(selectedModel)) {
    throw new Error(
      `Model ${selectedModel} not available for provider ${provider.name}`
    );
  }

  return {
    providerName: provider.name,
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
    model: selectedModel,
  };
}

// --- AI Service Class ---

/**
 * AI Service class for generating text and structured objects using LLMs.
 * Supports dynamic provider switching via configuration.
 */
export class AIService {
  private provider: ReturnType<typeof createOpenAICompatible>;
  private model: string;
  private providerName: string;

  constructor(config: AIServiceConfig) {
    this.provider = createProvider(config);
    this.model = config.model;
    this.providerName = config.providerName;
  }

  /**
   * Create an AIService instance using the default provider from database/env.
   */
  static async createDefault(env: Env): Promise<AIService> {
    const config = await getDefaultProviderConfig(env);
    return new AIService(config);
  }

  /**
   * Create an AIService instance for a specific provider and model.
   */
  static async createForProvider(
    env: Env,
    providerId: number,
    model?: string
  ): Promise<AIService> {
    const config = await getProviderConfig(env, providerId, model);
    return new AIService(config);
  }

  /**
   * Get the current provider name and model for display.
   */
  getInfo(): { providerName: string; model: string } {
    return { providerName: this.providerName, model: this.model };
  }

  /**
   * Generate structured JSON output using a Zod schema for type safety.
   */
  async generateObject<TSchema extends z.ZodType>(
    prompt: string,
    schema: TSchema,
    temperature: number = 0.7
  ): Promise<z.infer<TSchema>> {
    try {
      const { output } = await generateText({
        model: this.provider(this.model),
        output: Output.object({
          schema: schema,
        }),
        prompt: prompt,
        temperature: temperature,
      });

      return output as z.infer<TSchema>;
    } catch (error) {
      console.error(
        `[AIService:${this.providerName}] generateObject error:`,
        error
      );
      throw error;
    }
  }

  /**
   * Generate structured JSON output with conversation history context.
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
        model: this.provider(this.model),
        output: Output.object({
          schema: schema,
        }),
        messages: messages,
        temperature: temperature,
      });

      return output as z.infer<TSchema>;
    } catch (error) {
      console.error(
        `[AIService:${this.providerName}] generateObjectWithHistory error:`,
        error
      );
      throw error;
    }
  }

  /**
   * Generate plain text response without structured output.
   */
  async generateText(prompt: string, temperature: number = 0.7): Promise<string> {
    try {
      const { text } = await generateText({
        model: this.provider(this.model),
        prompt: prompt,
        temperature: temperature,
      });

      return text;
    } catch (error) {
      console.error(
        `[AIService:${this.providerName}] generateText error:`,
        error
      );
      throw error;
    }
  }

  /**
   * Generate text with conversation history context.
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
        model: this.provider(this.model),
        messages: messages,
        temperature: temperature,
      });

      return text;
    } catch (error) {
      console.error(
        `[AIService:${this.providerName}] generateTextWithHistory error:`,
        error
      );
      throw error;
    }
  }
}
