/**
 * @file game.$id.tsx
 * @description The main game interface where users play the interactive novel.
 * @module GameDetailRoute
 *
 * @features
 * - Displays story content history.
 * - Renders current scene choices.
 * - Visualizes story map using Mermaid.js.
 * - Handles user choices via Form submission.
 *
 * @maintenance
 * - Mermaid rendering can be tricky with hydration; ensure it runs client-side only.
 * - Scroll to bottom on new content.
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import {
  useLoaderData,
  Form,
  useNavigation,
  useActionData,
} from "react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import mermaid from "mermaid";
import { CaretRight, MapTrifold, Scroll } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { eq } from "drizzle-orm";
import { GameService } from "~/services/game.server";
import { getDb } from "~/services/db.server";
import { games } from "~/db/schema";
import { AIService } from "~/services/ai.server";
import type { Route } from "./+types/game.$id";
import type { SceneData, StoryMap } from "~/services/story.server";

// --- Loader ---
export async function loader({ params, context }: Route.LoaderArgs) {
  const env =
    (context as any).cloudflare?.env || (globalThis as any).process?.env;
  const gameId = parseInt(params.id);
  const db = getDb(env);

  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
  });

  if (!game) {
    throw new Response("Game Not Found", { status: 404 });
  }

  return { game };
}

// --- Action ---
export async function action({ request, params, context }: Route.ActionArgs) {
  const env =
    (context as any).cloudflare?.env || (globalThis as any).process?.env;
  const formData = await request.formData();
  const choiceText = formData.get("choice") as string;
  const language = (formData.get("lng") as string) || "zh";
  const gameId = parseInt(params.id);

  const aiService = new AIService(
    env.OPENROUTER_API_KEY || env.OPENAI_API_KEY,
    env.OPENROUTER_BASE_URL || env.OPENAI_BASE_URL,
    env.OPENROUTER_MODEL || env.OPENAI_MODEL || "openai/gpt-4o",
  );
  const gameService = new GameService(aiService, env);

  try {
    const nextScene = await gameService.advanceGame(
      gameId,
      choiceText,
      language,
    );
    return { success: true, nextScene };
  } catch (error) {
    console.error("Failed to advance game:", error);
    return { success: false, error: "Failed to generate next scene." };
  }
}

// --- Component ---
export default function GameDetail() {
  const { game } = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();

  const [showMap, setShowMap] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  const isSubmitting = navigation.state === "submitting";
  const storyHistory = game.storyHistory as {
    role: "user" | "assistant";
    content: string;
  }[];
  const currentScene = game.currentSceneJson as SceneData;
  const storyMap = game.storyMap as StoryMap;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [storyHistory, isSubmitting]);

  // Set theme based on genre (persist from DB)
  useEffect(() => {
    const genreToTheme: Record<string, string> = {
      东方玄幻: "xuanhuan",
      西方魔幻: "magic",
      赛博朋克: "cyberpunk",
      悬疑解谜: "mystery",
      末世科幻: "scifi",
    };
    const theme = genreToTheme[game.storyType] || "default";
    document.documentElement.setAttribute("data-theme", theme);
  }, [game.storyType]);

  // Render Mermaid Chart
  useEffect(() => {
    if (showMap && mermaidRef.current) {
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
            (n.id === game.currentNodeId ? ":::current" : ""),
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
  }, [showMap, storyMap, game.currentNodeId]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background-secondary shadow-2xl overflow-hidden transition-colors duration-500">
      {/* Header */}
      <header className="p-4 bg-background-primary border-b border-border flex justify-between items-center z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold truncate max-w-xs md:max-w-md">
            {game.title}
          </h1>
          <p className="text-sm text-text-secondary">
            {game.author} · {game.storyType}
          </p>
        </div>
        <div className="flex gap-2">
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
          className={`flex-1 flex flex-col h-full ${showMap ? "hidden md:flex" : "flex"}`}
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

            {isSubmitting && (
              <div className="self-start items-start max-w-[90%] animate-pulse">
                <div className="rounded-2xl px-5 py-3 bg-background-primary border border-border rounded-bl-none text-text-secondary italic">
                  {t("game.generating", "Writing next chapter...")}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Choices Footer */}
          <div className="p-4 bg-background-primary border-t border-border shrink-0">
            {!isSubmitting &&
            currentScene.choices &&
            currentScene.choices.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-1">
                {currentScene.choices.map((choice) => (
                  <Form method="post" key={choice.id} className="w-full">
                    <input type="hidden" name="choice" value={choice.text} />
                    <input type="hidden" name="lng" value={i18n.language} />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full text-left px-5 py-4 rounded-xl border border-border hover:border-accent hover:bg-background-secondary transition-all group flex items-center justify-between"
                    >
                      <span className="font-medium text-text-primary group-hover:text-accent transition-colors">
                        {choice.text}
                      </span>
                      <CaretRight
                        size={20}
                        className="text-text-secondary group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
                      />
                    </button>
                  </Form>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Story Map Panel (Desktop Sidebar / Mobile Overlay) */}
        {showMap && (
          <div className="md:w-1/3 w-full bg-background-primary border-l border-border flex flex-col absolute md:static inset-0 z-20">
            <div className="p-4 border-b border-border flex justify-between items-center md:hidden">
              <h3 className="font-bold">Story Map</h3>
              <button onClick={() => setShowMap(false)}>Close</button>
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
}
