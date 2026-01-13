/**
 * @file game.$id.tsx
 * @description Game detail route. Handles loader/action, delegates rendering to GamePage.
 * Protected route - requires authentication.
 * @module routes/game.$id
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { redirect, useLoaderData } from "react-router";
import { eq } from "drizzle-orm";
import { GamePage } from "~/pages/GamePage";
import { getDb } from "@server/db/client";
import { games } from "@server/db/schema";
import { getEnv } from "@server/config/env";
import { createAuth } from "@server/auth/auth";
import { AIService, GameService } from "@server/services";
import { getLanguageFromRequest } from "@server/i18n.server";
import { normalizeLanguage } from "@shared/types/i18n";
import type { Route } from "./+types/game.$id";
import type { Game, AdvanceGameResponse } from "@shared/types/game";

type LoaderData = Awaited<ReturnType<typeof loader>>;

// --- Loader ---

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  // Auth guard
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return redirect(`/login?returnTo=/game/${params.id}`);
  }

  const gameId = parseInt(params.id);

  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
  });

  if (!game) {
    throw new Response("Game Not Found", { status: 404 });
  }

  // Verify user owns this game
  if (game.userId !== session.user.id) {
    throw new Response("Forbidden", { status: 403 });
  }

  return { game: game as Game };
}

// --- Action ---

export async function action({ request, params, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      {
        success: false,
        error: "Method not allowed",
      } satisfies AdvanceGameResponse,
      { status: 405 },
    );
  }

  try {
    const formData = await request.formData();
    const choiceText = formData.get("choice") as string;
    const languageParam = formData.get("lng") as string | null;
    const gameId = parseInt(params.id);

    if (!choiceText) {
      return Response.json(
        {
          success: false,
          error: "Missing choice",
        } satisfies AdvanceGameResponse,
        { status: 400 },
      );
    }

    const env = getEnv(context);
    const language = normalizeLanguage(
      languageParam || getLanguageFromRequest(request),
    );

    const aiService = await AIService.createDefault(env);
    const gameService = new GameService(aiService, env);

    const nextScene = await gameService.advanceGame(
      gameId,
      choiceText,
      language,
    );

    return Response.json({
      success: true,
      nextScene,
    } satisfies AdvanceGameResponse);
  } catch (error) {
    console.error("[game.$id action] Failed to advance game:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to generate next scene. Please try again.",
      } satisfies AdvanceGameResponse,
      { status: 500 },
    );
  }
}

// --- Component ---

export default function GameDetailRoute() {
  const { game } = useLoaderData<typeof loader>();

  return <GamePage game={game} />;
}
