/**
 * @file ai.server.ts
 * @description Server-only AI service using Vercel AI SDK with dynamic provider support.
 * Supports any OpenAI-compatible provider configured in the database.
 * This file must NEVER be imported from client code.
 * @module server/services/ai
 */

import { generateText, streamText } from "ai";
import type { ModelMessage } from "@ai-sdk/provider-utils";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { eq, and } from "drizzle-orm";
import { getDb } from "@server/db/client";
import { providers } from "@server/db/schema";
import type { Env } from "@server/config/env";

// --- Types ---

export interface AIServiceConfig {
  providerName: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

// --- Provider Factory ---

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
  env: Env,
): Promise<AIServiceConfig> {
  const db = getDb(env);

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
  if (env.CUSTOM_API_KEY && env.CUSTOM_BASE_URL && env.CUSTOM_MODEL) {
    return {
      providerName: "custom",
      baseURL: env.CUSTOM_BASE_URL,
      apiKey: env.CUSTOM_API_KEY,
      model: env.CUSTOM_MODEL,
    };
  }

  const apiKey = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No AI provider configured. Set up a provider in admin or configure environment variables.",
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
  model?: string,
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
      `Model ${selectedModel} not available for provider ${provider.name}`,
    );
  }

  return {
    providerName: provider.name,
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
    model: selectedModel,
  };
}

// --- JSON Extraction Helper ---

/**
 * Extract JSON from text that may contain markdown code blocks or other content.
 */
function extractJson(text: string): string {
  // Try to extract JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object or array directly
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  return text.trim();
}

// --- JSON Example Generator ---

/**
 * Generate a concrete JSON example from a Zod schema.
 * This helps LLMs understand the exact format expected.
 */
function generateJsonExample(schema: z.ZodType): unknown {
  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(shape)) {
      result[key] = generateJsonExample(value as z.ZodType);
    }
    return result;
  }
  if (schema instanceof z.ZodArray) {
    return [generateJsonExample(schema._def.type)];
  }
  if (schema instanceof z.ZodString) {
    const desc = schema._def.description;
    return desc ? `<${desc}>` : "<string>";
  }
  if (schema instanceof z.ZodNumber) {
    return 1;
  }
  if (schema instanceof z.ZodBoolean) {
    return true;
  }
  if (schema instanceof z.ZodOptional) {
    return generateJsonExample(schema._def.innerType);
  }
  if (schema instanceof z.ZodDefault) {
    return schema._def.defaultValue();
  }
  if (schema instanceof z.ZodUnion) {
    // Return first option as example
    return generateJsonExample(schema._def.options[0]);
  }
  if (schema instanceof z.ZodEffects) {
    // For transformed schemas, use the inner schema
    return generateJsonExample(schema._def.schema);
  }
  return "<value>";
}

// --- AI Service Class ---

/**
 * AI Service class for generating text and structured objects using LLMs.
 * Uses prompt-based JSON generation for maximum provider compatibility.
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

  static async createDefault(env: Env): Promise<AIService> {
    const config = await getDefaultProviderConfig(env);
    return new AIService(config);
  }

  static async createForProvider(
    env: Env,
    providerId: number,
    model?: string,
  ): Promise<AIService> {
    const config = await getProviderConfig(env, providerId, model);
    return new AIService(config);
  }

  getInfo(): { providerName: string; model: string } {
    return { providerName: this.providerName, model: this.model };
  }

  /**
   * Generate structured JSON output using prompt-based approach.
   * Works with any provider, including those without native JSON mode support.
   */
  async generateObject<TSchema extends z.ZodType>(
    prompt: string,
    schema: TSchema,
    temperature: number = 0.7,
  ): Promise<z.infer<TSchema>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonSchema = zodToJsonSchema(schema as any, {
      target: "openApi3",
    });
    const jsonPrompt = `${prompt}

You must respond with a JSON object that matches this schema:
${JSON.stringify(jsonSchema, null, 2)}

IMPORTANT: Respond with ONLY the JSON object. No markdown code blocks, no explanations, no extra text. Just valid JSON.`;

    try {
      const { text } = await generateText({
        model: this.provider(this.model),
        prompt: jsonPrompt,
        temperature: temperature,
      });

      console.log(
        `[AIService:${this.providerName}] Raw response:`,
        text.substring(0, 500),
      );

      const jsonStr = extractJson(text);
      const parsed = JSON.parse(jsonStr);
      return schema.parse(parsed);
    } catch (error) {
      console.error(
        `[AIService:${this.providerName}] generateObject error:`,
        error,
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
    temperature: number = 0.9,
  ): Promise<z.infer<TSchema>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonSchema = zodToJsonSchema(schema as any, {
      target: "openApi3",
    });
    const jsonSystemPrompt = `${systemPrompt}

You must respond with a JSON object that matches this schema:
${JSON.stringify(jsonSchema, null, 2)}

IMPORTANT: Respond with ONLY the JSON object. No markdown code blocks, no explanations, no extra text. Just valid JSON.`;

    try {
      const messages: ModelMessage[] = [
        { role: "system", content: jsonSystemPrompt },
        ...history,
        { role: "user", content: userPrompt },
      ];

      const { text } = await generateText({
        model: this.provider(this.model),
        messages: messages,
        temperature: temperature,
      });

      console.log(
        `[AIService:${this.providerName}] Raw response:`,
        text.substring(0, 500),
      );

      const jsonStr = extractJson(text);
      const parsed = JSON.parse(jsonStr);
      return schema.parse(parsed);
    } catch (error) {
      console.error(
        `[AIService:${this.providerName}] generateObjectWithHistory error:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generate plain text response.
   */
  async generateText(
    prompt: string,
    temperature: number = 0.7,
  ): Promise<string> {
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
        error,
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
    temperature: number = 0.9,
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
        error,
      );
      throw error;
    }
  }

  /**
   * Stream text response for real-time display.
   * Returns the stream result object.
   */
  streamText(prompt: string, temperature: number = 0.7) {
    return streamText({
      model: this.provider(this.model),
      prompt: prompt,
      temperature: temperature,
    });
  }

  /**
   * Stream text with conversation history context.
   * Returns the stream result for use with AI SDK's streaming utilities.
   */
  streamTextWithHistory(
    systemPrompt: string,
    userPrompt: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    temperature: number = 0.9,
  ) {
    const messages: ModelMessage[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userPrompt },
    ];

    return streamText({
      model: this.provider(this.model),
      messages: messages,
      temperature: temperature,
    });
  }

  /**
   * Get a text stream response for use in API routes.
   */
  getStreamResponse(
    systemPrompt: string,
    userPrompt: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    temperature: number = 0.9,
  ): Response {
    const result = this.streamTextWithHistory(
      systemPrompt,
      userPrompt,
      history,
      temperature,
    );

    return result.toTextStreamResponse();
  }
}
