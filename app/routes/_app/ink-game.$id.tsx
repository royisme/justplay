/**
 * @file ink-game.$id.tsx
 * @description Main page for playing an Ink narrative game.
 * Renders RenderModel: story blocks, choices, and handles user interactions.
 * @module routes/_app/ink-game.$id
 */

import { useState, useEffect, useRef } from "react";
import { useLoaderData, useFetcher, redirect } from "react-router";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import { inkGames, inkTurns, inkScenarios } from "@server/db/schema";
import { eq, desc } from "drizzle-orm";
import type { RenderModel, RenderBlock, Choice, RenderEvent } from "@server/runtime";
import type { Route } from "./+types/ink-game.$id";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";

// --- Loader ---

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) return redirect("/login");

  const gameId = params.id;

  // Get game
  const game = await db
    .select()
    .from(inkGames)
    .where(eq(inkGames.id, gameId))
    .get();

  if (!game || game.userId !== session.user.id) {
    throw new Response("Game not found", { status: 404 });
  }

  // Get scenario for title
  const scenario = await db
    .select()
    .from(inkScenarios)
    .where(eq(inkScenarios.id, game.scenarioId))
    .get();

  // Get latest turn
  const latestTurn = await db
    .select()
    .from(inkTurns)
    .where(eq(inkTurns.gameId, gameId))
    .orderBy(desc(inkTurns.turnIndex))
    .limit(1)
    .get();

  // Get all turns for history
  const allTurns = await db
    .select()
    .from(inkTurns)
    .where(eq(inkTurns.gameId, gameId))
    .orderBy(inkTurns.turnIndex)
    .all();

  // Build current RenderModel
  const rm: RenderModel | null = latestTurn
    ? {
        gameId: game.id,
        turnIndex: game.turnIndex,
        status: game.status as "active" | "completed" | "abandoned",
        locale: game.locale as "zh-CN" | "en-US",
        blocks: JSON.parse(latestTurn.blocksJson),
        choices: JSON.parse(latestTurn.choicesJson),
        tags: JSON.parse(latestTurn.tagsJson),
        events: JSON.parse(latestTurn.eventsJson),
        checkpoint: {
          inkStateJson: game.inkStateJson,
          systemStateJson: game.systemStateJson,
          rngSeed: game.rngSeed,
        },
      }
    : null;

  // Parse system state for HUD
  const systemState = JSON.parse(game.systemStateJson);

  return {
    game,
    scenario,
    renderModel: rm,
    systemState,
    history: allTurns.map((t) => ({
      turnIndex: t.turnIndex,
      blocks: JSON.parse(t.blocksJson) as RenderBlock[],
      choiceId: t.inputChoiceId,
    })),
    user: session.user,
  };
}

// --- Component ---

export default function InkGamePage() {
  const { game, scenario, renderModel, systemState, history, user } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentBg, setCurrentBg] = useState<string | null>(null);

  const isSubmitting = fetcher.state !== "idle";

  // Handle choice submission
  const handleChoice = (choiceId: string) => {
    fetcher.submit(
      { choiceId },
      {
        method: "POST",
        action: `/api/ink-games/${game.id}/choose`,
        encType: "application/json",
      }
    );
  };

  // Scroll to bottom on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history.length]);

  // Process events for visual effects
  useEffect(() => {
    if (renderModel?.events) {
      for (const event of renderModel.events) {
        if (event.type === "bg") {
          setCurrentBg(event.id);
        }
        // TODO: Handle other event types (char, sfx, music, fx)
      }
    }
  }, [renderModel?.events]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-zinc-50 dark:bg-zinc-950">
      {/* Visual Area */}
      <div
        className="flex-1 relative flex flex-col items-center justify-center lg:border-r border-zinc-800 p-8 text-center overflow-hidden"
        style={{
          background: currentBg
            ? `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('/assets/bg/${currentBg}.jpg')`
            : "linear-gradient(to bottom, #18181b, #09090b)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Scene info */}
        <div className="relative z-10 max-w-2xl w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {scenario?.title || "Story"}
            </h2>
            <div className="flex items-center justify-center gap-3 text-zinc-400">
              <span className="px-2 py-0.5 border border-zinc-700/50 bg-zinc-900/50 rounded text-xs">
                Turn {game.turnIndex}
              </span>
              <span className="px-2 py-0.5 border border-zinc-700/50 bg-zinc-900/50 rounded text-xs capitalize">
                {game.status}
              </span>
            </div>
          </div>

          {/* HUD Stats */}
          <div className="grid grid-cols-3 gap-4 text-xs text-zinc-500 max-w-lg mx-auto">
            <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30 backdrop-blur-sm">
              <div className="mb-1 font-semibold text-zinc-400 uppercase tracking-wider">
                💰 Money
              </div>
              <div className="text-2xl font-light text-white">
                {systemState.money}
              </div>
            </div>
            <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30 backdrop-blur-sm">
              <div className="mb-1 font-semibold text-zinc-400 uppercase tracking-wider">
                🔥 Heat
              </div>
              <div className="text-2xl font-light text-white">
                {systemState.heat}
              </div>
            </div>
            <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30 backdrop-blur-sm">
              <div className="mb-1 font-semibold text-zinc-400 uppercase tracking-wider">
                ⏱ Time
              </div>
              <div className="text-2xl font-light text-white">
                {systemState.time}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Area */}
      <div className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-zinc-900">
        {/* Header */}
        <div className="p-4 border-b dark:border-zinc-800">
          <h2 className="font-bold">{scenario?.title || "Story"}</h2>
          <div className="text-xs text-muted-foreground">
            {game.status === "active"
              ? "进行中"
              : game.status === "completed"
                ? "已完成"
                : "已放弃"}
          </div>
        </div>

        {/* Story History */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {history.map((turn, idx) => (
              <div key={idx} className="space-y-2">
                {turn.blocks.map((block, blockIdx) => (
                  <Card
                    key={blockIdx}
                    className={`p-3 text-sm ${
                      block.kind === "dialogue"
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                        : block.kind === "system"
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                          : "bg-zinc-100 dark:bg-zinc-800 border-transparent"
                    }`}
                  >
                    {block.speaker && (
                      <div className="font-semibold text-xs text-muted-foreground mb-1">
                        {block.speaker}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{block.text}</p>
                  </Card>
                ))}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Choices */}
        <div className="p-4 border-t dark:border-zinc-800">
          {game.status === "active" && renderModel?.choices.length ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={game.turnIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                {renderModel.choices.map((choice) => (
                  <Button
                    key={choice.choiceId}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleChoice(choice.choiceId)}
                    disabled={isSubmitting}
                  >
                    <span className="mr-2 text-muted-foreground">
                      {Number(choice.choiceId) + 1}.
                    </span>
                    {choice.text}
                    {choice.hint?.cost && (
                      <span className="ml-auto text-xs text-amber-600">
                        {choice.hint.cost}
                      </span>
                    )}
                  </Button>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : game.status === "completed" ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                故事已结束
              </p>
              <Button
                variant="default"
                onClick={() => (window.location.href = "/dashboard")}
              >
                返回主页
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {isSubmitting ? t("game.loading") : "等待中..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
