import { redirect, useLoaderData } from "react-router";
import { Plus, BookOpen } from "lucide-react";
import { Link } from "react-router";
import { createAuth } from "@server/auth/auth";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { GameService } from "@server/services/game.server";
import type { Route } from "./+types/dashboard";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/Card";
import { useTranslation } from "react-i18next";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return redirect("/login");
  }

  const gameService = new GameService(env);
  const activeGames = await gameService.getActiveGames(session.user.id);
  const completedGames = await gameService.getCompletedGames(session.user.id);

  return {
    activeGames,
    completedGames: completedGames.slice(0, 4), // Show first 4 in dashboard
  };
}

export default function Dashboard() {
  const { activeGames, completedGames } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const slotsUsed = activeGames.length;
  const maxSlots = 3;

  // Helper to get relative time
  const getRelativeTime = (date: Date | null) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle", { used: slotsUsed, max: maxSlots })}</p>
        </div>
        {slotsUsed < maxSlots && (
          <Button as={Link} to="/game/new">
            <Plus className="mr-2 h-4 w-4" /> {t("dashboard.new_game")}
          </Button>
        )}
      </div>

      {/* Active Games Slots */}
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((slotIndex) => {
          const game = activeGames.find(g => g.slotIndex === slotIndex + 1);

          if (game) {
             return (
              <Card key={game.id} className="flex flex-col border-indigo-200 dark:border-indigo-900 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle>{game.title}</CardTitle>
                  <CardDescription>{t("dashboard.current_progress", { volume: game.currentVolume, chapter: game.currentChapter })}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="aspect-video w-full rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    {t("dashboard.game_preview")}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">{t("dashboard.last_played", { time: getRelativeTime(game.createdAt) })}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" as={Link} to={`/game/${game.id}`}>
                    {t("dashboard.continue")}
                  </Button>
                </CardFooter>
              </Card>
            );
          } else {
            return (
              <Card key={`empty-${slotIndex}`} className="flex flex-col border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent shadow-none">
                <CardContent className="flex flex-1 flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <Plus className="h-6 w-6 text-zinc-400" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold">{t("dashboard.empty_slot")}</h3>
                  <p className="mb-4 text-sm">{t("dashboard.empty_slot_desc")}</p>
                  <Button variant="outline" as={Link} to="/game/new">
                    {t("dashboard.create_game")}
                  </Button>
                </CardContent>
              </Card>
            );
          }
        })}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold tracking-tight">{t("dashboard.library")}</h2>
             <Button variant="ghost" as={Link} to="/library">
                {t("dashboard.view_all")} <BookOpen className="ml-2 h-4 w-4" />
             </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
            {completedGames.map(game => (
                <Card key={game.id} className="group cursor-pointer transition-all hover:border-indigo-500 hover:shadow-md">
                    <CardContent className="p-4">
                        <div className="aspect-[2/3] w-full rounded bg-zinc-800 mb-3 flex items-center justify-center text-white">
                            {game.bookMetadata?.coverImage ? (
                              <img src={game.bookMetadata.coverImage} alt={game.title} className="w-full h-full object-cover rounded" />
                            ) : (
                              "Book Cover"
                            )}
                        </div>
                        <h3 className="font-semibold group-hover:text-indigo-600">{game.title}</h3>
                        <p className="text-xs text-muted-foreground">{game.bookMetadata?.endingType || "Completed"}</p>
                        <p className="text-xs text-zinc-400 mt-1">{game.completedAt ? new Date(game.completedAt).toLocaleDateString() : ""}</p>
                    </CardContent>
                </Card>
            ))}

            {completedGames.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground border-dashed border rounded-lg">
                    {t("dashboard.no_completed_games")}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}