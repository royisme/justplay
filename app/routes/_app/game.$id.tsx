import { useRef, useEffect } from "react";
import { useLoaderData, useFetcher, redirect } from "react-router";
import { Send } from "lucide-react";
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

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) return redirect("/auth/login");

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
    // Handle game input (advance game)
    // For now, just a placeholder
    return null;
}

export default function GamePage() {
  const { game, history, user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-zinc-50 dark:bg-zinc-950">
      {/* Visual / Scene Area */}
      <div className="flex-1 bg-black relative flex items-center justify-center lg:border-r border-zinc-800">
         <div className="text-zinc-500 font-mono text-sm">
             [PixelWeaver Renderer Placeholder]
             <br/>
             Scene: {game.title}
         </div>
         {/* PixiJS Canvas will go here */}
      </div>

      {/* Narrative / Chat Area */}
      <div className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-zinc-900">
        {/* Game Header */}
        <div className="p-4 border-b dark:border-zinc-800 flex justify-between items-center">
            <div>
                <h2 className="font-bold">{game.title}</h2>
                <div className="text-xs text-muted-foreground">Chapter {game.currentChapter}</div>
            </div>
            <Button variant="ghost" size="sm">Settings</Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
                {history.map((msg) => (
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
                <Input
                    name="input"
                    placeholder="What do you want to do?"
                    autoComplete="off"
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={fetcher.state !== "idle"}>
                    <Send className="h-4 w-4" />
                </Button>
            </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
