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
import type { Route } from "./+types/game.new";
import { GameService } from "@server/services/game.server";
import { AIService } from "@server/services/ai.server";
import type { AppEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import type { SupportedLanguage } from "@shared/types/i18n";

export async function loader() {
  return redirect("/");
}

export async function action({ request, context }: Route.ActionArgs) {
  // @ts-ignore - Cloudflare context type
  const env = context.cloudflare.env as AppEnv;
  const db = getDb(env);
  const auth = createAuth(db, env);

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/auth/login");
  }

  const formData = await request.formData();
  const storyType = formData.get("story_type") as string;
  const language = (formData.get("language") as SupportedLanguage) || "zh";

  if (!storyType) {
    return Response.json({ error: "Story type is required" }, { status: 400 });
  }

  const aiService = await AIService.createDefault(env);
  const gameService = new GameService(aiService, env);

  try {
    const gameId = await gameService.createNewGame(
      session.user.id,
      storyType,
      language
    );
    return redirect(`/game/${gameId}`);
  } catch (error) {
    console.error("Failed to create game:", error);
    return Response.json({ error: "Failed to create game" }, { status: 500 });
  }
}
