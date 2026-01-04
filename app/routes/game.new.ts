/**
 * @file game.new.ts
 * @description Action route to handle the creation of a new game session.
 * @module GameNewRoute
 *
 * @features
 * - Form submission handling from Index page.
 * - Environment variable injection (Cloudflare bindings).
 * - Service instantiation (AIService, GameService).
 * - Error handling and redirection.
 *
 * @maintenance
 * - Ensure environment bindings are correctly typed in `Env` interface.
 * - Add form validation (e.g., z.object) if inputs become more complex.
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { redirect, type ActionFunctionArgs } from "react-router";
import { AIService } from "~/services/ai.server";
import { GameService } from "~/services/game.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const storyType = formData.get("story_type") as string;
  const language = (formData.get("lng") as string) || "zh";

  // Access Cloudflare bindings from context
  const env =
    (context as any).cloudflare?.env || (globalThis as any).process?.env;

  // OpenRouter uses OPENROUTER_API_KEY env var by default,
  // but we support custom configuration via env vars
  const aiService = new AIService(
    env.OPENROUTER_API_KEY || env.OPENAI_API_KEY,
    env.OPENROUTER_BASE_URL || env.OPENAI_BASE_URL,
    env.OPENROUTER_MODEL || env.OPENAI_MODEL || "openai/gpt-4o",
  );

  // Pass the entire env to GameService, as it now needs it for getDb(env)
  const gameService = new GameService(aiService, env);

  try {
    const nodeNum = parseInt(env.NODE_NUM || "6");
    const gameId = await gameService.createNewGame(
      storyType,
      language,
      nodeNum,
    );

    return redirect(`/game/${gameId}`);
  } catch (error) {
    console.error("Failed to create new game:", error);
    return redirect("/?error=true");
  }
}
