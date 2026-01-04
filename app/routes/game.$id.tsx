/**
 * @file game.$id.tsx
<<<<<<< HEAD
 * @description The main game interface where users play the interactive novel.
 * Uses useFetcher for non-navigating form submissions to avoid full page reloads.
 * @module GameDetailRoute
 *
 * @features
 * - Displays story content history with optimistic UI updates.
 * - Renders current scene choices via useFetcher (no page reload).
 * - Visualizes story map using Mermaid.js (persists across choice selections).
 * - Handles language switching with Cookie persistence.
 * - Auto-scroll to new content and error handling.
 *
 * @maintenance
 * - Mermaid rendering only runs when map is shown to save resources.
 * - useFetcher manages optimistic updates: choice added immediately, story continues after AI response.
 * - Language toggle persists to Cookie for SSR synchronization.
=======
 * @description Game detail route. Handles loader/action, delegates rendering to GamePage.
 * @module routes/game.$id
>>>>>>> feature/architecture-refactor
 *
 * @author Claude Code
 * @date 2025-01-26
 */

<<<<<<< HEAD
import { useLoaderData, useFetcher } from "react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import mermaid from "mermaid";
import { CaretRight, MapTrifold, Scroll } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { eq } from "drizzle-orm";
import { getDb } from "~/services/db.server";
import { games } from "~/db/schema";
import { setLanguageCookie } from "~/i18n";
import { GameService } from "~/services/game.server";
import { AIService } from "~/services/ai.server";
=======
import { useLoaderData } from "react-router";
import { eq } from "drizzle-orm";
import { GamePage } from "~/pages/GamePage";
import { getDb } from "@server/db/client";
import { games } from "@server/db/schema";
import { getEnv, getAIConfig } from "@server/config/env";
import { AIService, GameService } from "@server/services";
import { getLanguageFromRequest } from "@server/i18n.server";
import { normalizeLanguage } from "@shared/types/i18n";
>>>>>>> feature/architecture-refactor
import type { Route } from "./+types/game.$id";
import type { Game, AdvanceGameResponse } from "@shared/types/game";

type LoaderData = Awaited<ReturnType<typeof loader>>;

// --- Loader ---

export async function loader({ params, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const gameId = parseInt(params.id);
  const db = getDb(env);

  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
  });

  if (!game) {
    throw new Response("Game Not Found", { status: 404 });
  }

  return { game: game as Game };
}

<<<<<<< HEAD
/**
 * Action: Handle game advancement (choice submission).
 * Returns JSON for useFetcher (no page navigation).
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
=======
// --- Action ---

export async function action({ request, params, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      {
        success: false,
        error: "Method not allowed",
      } satisfies AdvanceGameResponse,
      { status: 405 },
>>>>>>> feature/architecture-refactor
    );
  }

  try {
    const formData = await request.formData();
    const choiceText = formData.get("choice") as string;
<<<<<<< HEAD
    const language = (formData.get("lng") as string) || "zh";
    const gameId = parseInt(params.id);

    if (!choiceText) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing choice" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const env =
      (context as any).cloudflare?.env || (globalThis as any).process?.env;

    const aiService = new AIService(
      env.OPENROUTER_API_KEY || env.OPENAI_API_KEY,
      env.OPENROUTER_BASE_URL || env.OPENAI_BASE_URL,
      env.OPENROUTER_MODEL || env.OPENAI_MODEL || "openai/gpt-4o",
    );
=======
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

    const aiConfig = getAIConfig(env);
    const aiService = new AIService(aiConfig);
>>>>>>> feature/architecture-refactor
    const gameService = new GameService(aiService, env);

    const nextScene = await gameService.advanceGame(
      gameId,
      choiceText,
      language,
    );

<<<<<<< HEAD
    // Return JSON (useFetcher will not navigate)
    return new Response(
      JSON.stringify({
        success: true,
        nextScene,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Failed to advance game:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to generate next scene. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
=======
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
>>>>>>> feature/architecture-refactor
    );
  }
}

// --- Component ---
<<<<<<< HEAD
export default function GameDetail() {
  const { game: initialGame } = useLoaderData<LoaderData>();
  const { t, i18n } = useTranslation();

  // useFetcher for non-navigating submission to /api/game/:id/advance
  const advanceFetcher = useFetcher<{
    success: boolean;
    error?: string;
    nextScene?: SceneData;
  }>();

  // Local state
  const [showMap, setShowMap] = useState(false);
  const [storyHistory, setStoryHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >(
    (initialGame.storyHistory as Array<{
      role: "user" | "assistant";
      content: string;
    }>) || [],
  );
  const [currentScene, setCurrentScene] = useState<SceneData>(
    (initialGame.currentSceneJson as SceneData) || { choices: [] },
  );
  const [lastError, setLastError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  const storyMap = (initialGame.storyMap as StoryMap) || {
    nodes: [],
    edges: [],
  };
  const isLoading = advanceFetcher.state === "submitting";

  /**
   * Handle choice submission: add choice to history, submit to API
   */
  const handleChoiceClick = useCallback(
    (choiceText: string) => {
      // Optimistic: immediately add user choice to visible history
      setStoryHistory((prev) => [
        ...prev,
        { role: "user", content: choiceText },
      ]);
      setLastError(null);

      // Submit to API route
      const formData = new FormData();
      formData.append("choice", choiceText);
      formData.append("lng", i18n.language);

      advanceFetcher.submit(formData, {
        method: "post",
      });
    },
    [initialGame.id, i18n.language, advanceFetcher],
  );

  /**
   * Handle fetcher response: when API returns new scene
   */
  useEffect(() => {
    if (advanceFetcher.state === "idle" && advanceFetcher.data) {
      if (advanceFetcher.data.success && advanceFetcher.data.nextScene) {
        // Success: add AI's response and update choices
        const nextScene = advanceFetcher.data.nextScene;
        setStoryHistory((prev) => [
          ...prev,
          { role: "assistant", content: nextScene.content },
        ]);
        setCurrentScene(nextScene);
        setLastError(null);
      } else if (!advanceFetcher.data.success) {
        // Error: show message and remove the optimistic user choice
        const errorMsg =
          advanceFetcher.data.error || "Failed to generate next scene.";
        setLastError(errorMsg);
        setStoryHistory((prev) => prev.slice(0, -1)); // Remove last (user) message
      }
    }
  }, [advanceFetcher.state, advanceFetcher.data]);

  // Auto-scroll to new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [storyHistory, isLoading]);

  // Set theme based on genre
  useEffect(() => {
    const genreToTheme: Record<string, string> = {
      东方玄幻: "xuanhuan",
      西方魔幻: "magic",
      赛博朋克: "cyberpunk",
      悬疑解谜: "mystery",
      末世科幻: "scifi",
    };
    const theme = genreToTheme[initialGame.storyType] || "default";
    document.documentElement.setAttribute("data-theme", theme);
  }, [initialGame.storyType]);

  // Render Mermaid chart when map is shown
  useEffect(() => {
    if (showMap && mermaidRef.current && storyMap?.nodes?.length) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "base",
        themeVariables: {
          primaryColor: "var(--accent)",
          primaryTextColor: "var(--foreground)",
          lineColor: "var(--foreground-secondary)",
        },
      });

      const nodes = storyMap.nodes
        .map(
          (n) =>
            `${n.id}["${n.label}"]` +
            (n.id === initialGame.currentNodeId ? ":::current" : ""),
        )
        .join("\n");

      const edges = storyMap.edges
        .map((e) => `${e.from} -->|"${e.label}"| ${e.to}`)
        .join("\n");

      const graphDefinition = `
        graph TD
        ${nodes}
        ${edges}
        classDef current fill:var(--accent),stroke:var(--foreground),color:var(--background),stroke-width:2px;
      `;

      mermaid.render("mermaid-graph", graphDefinition).then(({ svg }) => {
        if (mermaidRef.current) mermaidRef.current.innerHTML = svg;
      });
    }
  }, [showMap, storyMap, initialGame.currentNodeId]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background-secondary shadow-2xl overflow-hidden transition-colors duration-500">
      {/* Header */}
      <header className="p-4 bg-background-primary border-b border-border flex justify-between items-center z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold truncate max-w-xs md:max-w-md">
            {initialGame.title}
          </h1>
          <p className="text-sm text-text-secondary">
            {initialGame.author} · {initialGame.storyType}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Language Toggle */}
          <div className="hidden gap-1 border border-border rounded-lg p-1 sm:flex">
            <button
              onClick={() => {
                i18n.changeLanguage("zh");
                setLanguageCookie("zh");
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                i18n.language.startsWith("zh")
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              title="中文"
            >
              中
            </button>
            <button
              onClick={() => {
                i18n.changeLanguage("en");
                setLanguageCookie("en");
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                i18n.language.startsWith("en")
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Map Toggle */}
          <button
            onClick={() => setShowMap(!showMap)}
            className="p-2 rounded-full hover:bg-background-secondary text-text-secondary transition-colors"
            title={t("game.toggle_map", "Map")}
          >
            {showMap ? <Scroll size={24} /> : <MapTrifold size={24} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
        {/* Story Chat */}
        <div
          className={`flex-1 flex flex-col h-full ${
            showMap ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {storyHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[90%] ${
                  msg.role === "user"
                    ? "self-end items-end"
                    : "self-start items-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-5 py-3 shadow-sm text-base leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-br-none"
                      : "bg-background-primary border border-border rounded-bl-none text-text-primary"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="self-start max-w-[90%] animate-pulse">
                <div className="rounded-2xl px-5 py-3 bg-background-primary border border-border rounded-bl-none text-text-secondary italic">
                  {t("game.generating", "Writing next chapter...")}
                </div>
              </div>
            )}

            {lastError && (
              <div className="self-start max-w-[90%]">
                <div className="rounded-2xl px-5 py-3 bg-red-500/10 border border-red-500/30 rounded-bl-none text-red-600 text-sm">
                  {lastError}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Choices Footer */}
          <div className="p-4 bg-background-primary border-t border-border shrink-0">
            {!isLoading &&
            currentScene.choices &&
            currentScene.choices.length > 0 ? (
              <div className="grid gap-3">
                {currentScene.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceClick(choice.text)}
                    disabled={isLoading}
                    className="w-full text-left px-5 py-4 rounded-xl border border-border hover:border-accent hover:bg-background-secondary transition-all group flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-medium text-text-primary group-hover:text-accent transition-colors">
                      {choice.text}
                    </span>
                    <CaretRight
                      size={20}
                      className="text-text-secondary group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Story Map Panel */}
        {showMap && (
          <div className="md:w-1/3 w-full bg-background-primary border-l border-border flex flex-col absolute md:static inset-0 z-20">
            <div className="p-4 border-b border-border flex justify-between items-center md:hidden">
              <h3 className="font-bold">Story Map</h3>
              <button
                onClick={() => setShowMap(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-background-secondary/30">
              <div
                ref={mermaidRef}
                className="w-full h-full flex justify-center"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
=======

export default function GameDetailRoute() {
  const { game } = useLoaderData<typeof loader>();

  return <GamePage game={game} />;
>>>>>>> feature/architecture-refactor
}
