/**
 * @file api.game.stream.ts
 * @description Streaming API endpoint for game story generation.
 * Uses AI SDK streamText for real-time text streaming.
 * @module routes/api.game.stream
 */

import { eq } from "drizzle-orm";
import type { Route } from "./+types/api.game.stream";
import { getDb } from "@server/db/client";
import { games } from "@server/db/schema";
import { getEnv } from "@server/config/env";
import { createAuth } from "@server/auth/auth";
import { AIService } from "@server/services/ai.server";
import { getLanguageFromRequest, getLanguagePrompt } from "@server/i18n.server";
import { normalizeLanguage } from "@shared/types/i18n";
import type { StoryHistoryEntry } from "@shared/types/game";

interface StreamRequestBody {
  gameId: number;
  choiceText: string;
  language?: string;
}

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  // Auth check
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = (await request.json()) as StreamRequestBody;
    const { gameId, choiceText, language: langParam } = body;

    if (!gameId || !choiceText) {
      return new Response("Missing gameId or choiceText", { status: 400 });
    }

    // Fetch game
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
    });

    if (!game) {
      return new Response("Game not found", { status: 404 });
    }

    // Verify ownership
    if (game.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const language = normalizeLanguage(
      langParam || getLanguageFromRequest(request),
    );
    const languagePrompt = getLanguagePrompt(language);

    const storyHistory = (game.storyHistory as StoryHistoryEntry[]) || [];

    // Add user choice to history for context
    const updatedHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [...storyHistory, { role: "user" as const, content: choiceText }];

    // Build prompts
    const systemPrompt = `
      ${game.writingStyle} 你的任务是作为一名才华横溢的互动小说家，动态地推进故事。
      请使用 ${languagePrompt} (language: ${language}) 进行创作。

      **核心指令:**
      1. **续写故事**: 基于历史和玩家选择，创作引人入胜的下一段故事内容。
      2. **写作风格**: 保持文学性和沉浸感，使用生动的描写和对话。
      3. **长度控制**: 每段故事内容控制在200-400字之间。
      4. **纯文本输出**: 只输出故事内容本身，不要包含任何JSON、选项或元数据。
    `;

    const userPrompt = `
      **故事信息:**
      - 标题: ${game.title || "未命名故事"}
      - 作者风格: ${game.author || "未知"}
      - 类型: ${game.storyType}

      **近期故事历史:**
      ${updatedHistory
        .slice(-4)
        .map((h) => `[${h.role}]: ${h.content}`)
        .join("\n")}

      **玩家的选择:** "${choiceText}"

      请根据玩家的选择，续写故事的下一段内容。
    `;

    // Create AI service and stream
    const aiService = await AIService.createDefault(env);

    return aiService.getStreamResponse(
      systemPrompt,
      userPrompt,
      updatedHistory.slice(-6),
      0.9,
    );
  } catch (error) {
    console.error("[api.game.stream] Error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
