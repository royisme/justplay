import { useRef, useEffect, useState } from "react";
import { useLoaderData, useFetcher, redirect, Form } from "react-router";
import { Send, Settings, Flag, XCircle, ChevronDown, Map } from "lucide-react";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import { GameService } from "@server/services/game.server";
import type { Route } from "./+types/game.$id";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/Card";
import { StoryMap } from "~/components/game/StoryMap";
import { useTranslation } from "react-i18next";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) return redirect("/login");

  const gameService = new GameService(env);
  const gameState = await gameService.getGameState(params.id, session.user.id);

  if (!gameState) {
    throw new Response("Game not found", { status: 404 });
  }

  return {
    game: gameState.game,
    history: gameState.history,
    user: session.user
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) return redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const gameService = new GameService(env);

  try {
    switch (intent) {
      case "advance": {
        const input = formData.get("input") as string;
        if (!input?.trim()) {
          return { error: "Please enter something" };
        }
        await gameService.advanceGame(params.id, session.user.id, input.trim());
        return { success: true };
      }
      case "complete": {
        await gameService.completeGame(params.id, session.user.id);
        return redirect(`/library/${params.id}`);
      }
      case "abandon": {
        await gameService.abandonGame(params.id, session.user.id);
        return redirect("/dashboard");
      }
      default:
        return { error: "Unknown action" };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An error occurred";
    return { error: message };
  }
}

export default function GamePage() {
  const { game, history, user } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStoryMap, setShowStoryMap] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  const isSubmitting = fetcher.state !== "idle";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-zinc-50 dark:bg-zinc-950">
      {/* Visual / Scene Area */}
      <div className="flex-1 bg-black relative flex flex-col items-center justify-center lg:border-r border-zinc-800 p-8 text-center overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 to-black pointer-events-none" />

        {/* Story Map Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowStoryMap(!showStoryMap)}
          className="absolute top-4 left-4 z-10 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300"
        >
          <Map className="h-4 w-4 mr-2" />
          {showStoryMap ? t("game.toggle_map").replace("Toggle ", "Hide ") : t("game.toggle_map")}
        </Button>

        {showStoryMap ? (
          <div className="absolute inset-0 p-8 overflow-auto z-20 bg-black/80 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              <StoryMap game={game} history={history} />
            </div>
          </div>
        ) : (
          <div className="relative z-10 max-w-2xl w-full">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{game.title}</h2>
                <div className="flex items-center justify-center gap-3 text-zinc-400">
                    <span className="px-2 py-0.5 border border-zinc-700/50 bg-zinc-900/50 rounded text-xs">V{game.currentVolume}</span>
                    <span className="px-2 py-0.5 border border-zinc-700/50 bg-zinc-900/50 rounded text-xs">Chapter {game.currentChapter}</span>
                </div>
            </div>

            <div className="prose prose-invert prose-lg max-w-none mb-12">
               <p className="text-zinc-300 font-serif italic leading-relaxed line-clamp-4">
                  "{history.filter(m => m.role === "assistant").slice(-1)[0]?.content.slice(0, 200) || t("game.starting")}..."
               </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs text-zinc-500 max-w-lg mx-auto">
                <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30 backdrop-blur-sm">
                   <div className="mb-1 font-semibold text-zinc-400 uppercase tracking-wider">Characters</div>
                   <div className="text-2xl font-light text-white">{game.storyMetadata?.characters?.length || 0}</div>
                </div>
                <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30 backdrop-blur-sm">
                   <div className="mb-1 font-semibold text-zinc-400 uppercase tracking-wider">Inventory</div>
                   <div className="text-2xl font-light text-white">{Object.keys(game.storyMetadata?.inventory || {}).length || 0}</div>
                </div>
                <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30 backdrop-blur-sm">
                   <div className="mb-1 font-semibold text-zinc-400 uppercase tracking-wider">Turns</div>
                   <div className="text-2xl font-light text-white">{history.length}</div>
                </div>
            </div>

            <div className="mt-12 text-zinc-600 text-xs font-mono">
                [RENDERER_STATUS: OFFLINE] • [AI_CORE: ACTIVE]
            </div>
          </div>
        )}
      </div>

      {/* Narrative / Chat Area */}
      <div className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-zinc-900">
        {/* Game Header */}
        <div className="p-4 border-b dark:border-zinc-800 flex justify-between items-center">
            <div>
                <h2 className="font-bold">{game.title}</h2>
                <div className="text-xs text-muted-foreground">Chapter {game.currentChapter}</div>
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-1" />
                <ChevronDown className="h-3 w-3" />
              </Button>

              {showSettings && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-lg z-10">
                  <Form method="post" className="p-1">
                    <input type="hidden" name="intent" value="complete" />
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-left"
                      onClick={() => setShowSettings(false)}
                    >
                      <Flag className="h-4 w-4 text-green-600" />
                      完结故事
                    </button>
                  </Form>
                  <Form method="post" className="p-1">
                    <input type="hidden" name="intent" value="abandon" />
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-left text-red-600"
                      onClick={() => {
                        setShowSettings(false);
                        if (!confirm("确定要放弃这个游戏吗？你可以释放槽位开始新的冒险。")) {
                          return false;
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      放弃游戏
                    </button>
                  </Form>
                </div>
              )}
            </div>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
                {history.filter(msg => msg.role !== "system").map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8 mt-1">
                            {msg.role === 'user' ? (
                                <>
                                    <AvatarImage src={user.image || ""} />
                                    <AvatarFallback>ME</AvatarFallback>
                                </>
                            ) : (
                                <AvatarFallback className="bg-indigo-600 text-white">DM</AvatarFallback>
                            )}
                        </Avatar>
                        <Card className={`p-3 text-sm max-w-[85%] ${
                            msg.role === 'user'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-transparent'
                        }`}>
                            {msg.content}
                        </Card>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t dark:border-zinc-800">
            <fetcher.Form method="post" className="flex gap-2">
                <input type="hidden" name="intent" value="advance" />
                <Input
                    name="input"
                    placeholder="What do you want to do?"
                    autoComplete="off"
                    className="flex-1"
                    disabled={isSubmitting}
                />
                <Button type="submit" size="icon" disabled={isSubmitting}>
                    <Send className="h-4 w-4" />
                </Button>
            </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
