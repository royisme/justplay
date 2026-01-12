/**
 * @file env.ts
 * @description Server-side environment configuration with Zod validation.
 * This file is server-only and must NEVER be imported by client code.
 * @module server/config/env
 */

/// <reference types="@cloudflare/workers-types" />

import { z } from "zod";

// --- Environment Schema ---

export const EnvSchema = z.object({
  // Database
  DB: z.custom<D1Database>((val) => val !== undefined, {
    message: "DB binding is required",
  }),

  // Better Auth Configuration
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().optional(),
  ADMIN_EMAIL: z.string().email().optional(), // Admin user binding

  // AI Provider Configuration
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().optional(),
  OPENROUTER_MODEL: z.string().optional(),

  // Legacy OpenAI configuration (fallback)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().optional(),

  // Game Configuration
  NODE_NUM: z
    .string()
    .transform(Number)
    .pipe(z.number().min(3).max(20))
    .optional(),
});

export type Env = z.infer<typeof EnvSchema>;
export type AppEnv = Env; // Alias for better-auth compatibility

// --- Cloudflare Context Type ---

export interface CloudflareContext {
  cloudflare?: {
    env?: Env;
  };
}

// --- Environment Extraction ---

/**
 * Extract environment variables from React Router context.
 * Handles both Cloudflare Workers and local development environments.
 */
export function getEnv(context: unknown): Env {
  const ctx = context as CloudflareContext;
  const env = ctx?.cloudflare?.env || (globalThis as any).process?.env;

  if (!env) {
    throw new Error("Environment variables not available");
  }

  return env as Env;
}

// --- AI Configuration ---

export interface AIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

/**
 * Extract AI service configuration from environment.
 * Prioritizes OpenRouter, falls back to OpenAI.
 */
export function getAIConfig(env: Env): AIConfig {
  const apiKey = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No API key configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.",
    );
  }

  return {
    apiKey,
    baseURL:
      env.OPENROUTER_BASE_URL ||
      env.OPENAI_BASE_URL ||
      "https://openrouter.ai/api/v1",
    model: env.OPENROUTER_MODEL || env.OPENAI_MODEL || "openai/gpt-4o",
  };
}

/**
 * Get the number of story nodes to generate.
 */
export function getNodeNum(env: Env): number {
  return env.NODE_NUM || 6;
}
