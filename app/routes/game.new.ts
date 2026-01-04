/**
 * @file game.new.ts
 * @description Action route to handle the creation of a new game session.
 * Uses server-isolated modules for AI and database operations.
 * @module routes/game.new
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { getEnv, getAIConfig, getNodeNum } from "@server/config/env";
import { AIService, GameService } from "@server/services";
import { normalizeLanguage } from "@shared/types/i18n";

// --- Action ---

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const storyType = formData.get("story_type") as string;
  const languageParam = formData.get("lng") as string | null;

  // Normalize language
  const language = normalizeLanguage(languageParam);

  // Get environment and configuration
  const env = getEnv(context);
  const aiConfig = getAIConfig(env);
  const nodeNum = getNodeNum(env);

  // Initialize services
  const aiService = new AIService(aiConfig);
  const gameService = new GameService(aiService, env);

  try {
    const gameId = await gameService.createNewGame(
      storyType,
      language,
      nodeNum,
    );
    return redirect(`/game/${gameId}`);
  } catch (error) {
    console.error("[game.new action] Failed to create new game:", error);
    return redirect("/?error=true");
  }
}
