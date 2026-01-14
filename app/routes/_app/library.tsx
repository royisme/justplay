import { useLoaderData, Link } from "react-router";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import { games } from "@server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { Route } from "./+types/library";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/badge";
import { BookOpen } from "lucide-react";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) return { games: [] };

  const completedGames = await db.query.games.findMany({
    where: and(
        eq(games.userId, session.user.id),
        eq(games.status, "completed")
    ),
    orderBy: desc(games.completedAt),
  });

  return { games: completedGames };
}

export default function LibraryPage() {
  const { games } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center gap-2 mb-8">
        <BookOpen className="h-8 w-8 text-indigo-600" />
        <h1 className="text-3xl font-bold">藏书阁</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {games.map((game) => (
          <Card key={game.id} className="group hover:shadow-lg transition-all border-zinc-200 dark:border-zinc-800">
            <CardHeader className="p-0">
               <div className="aspect-[2/3] bg-zinc-800 w-full rounded-t-lg flex items-center justify-center text-zinc-500">
                   {game.bookMetadata?.coverImage ? (
                       <img src={game.bookMetadata.coverImage} alt={game.title} className="w-full h-full object-cover rounded-t-lg" />
                   ) : (
                       <span>No Cover</span>
                   )}
               </div>
            </CardHeader>
            <CardContent className="p-4">
               <CardTitle className="text-lg line-clamp-1">{game.title}</CardTitle>
               <div className="flex items-center gap-2 mt-2">
                   <Badge variant="outline" className="text-xs">{game.bookMetadata?.endingType || "Ending"}</Badge>
                   <span className="text-xs text-muted-foreground">{new Date(game.completedAt!).toLocaleDateString()}</span>
               </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
               <Button as={Link} to={`/library/${game.id}`} className="w-full" variant="secondary">
                   阅读故事
               </Button>
            </CardFooter>
          </Card>
        ))}

        {games.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground border-dashed border rounded-lg">
                你还没有完成任何冒险。去创造你的传奇吧！
            </div>
        )}
      </div>
    </div>
  );
}
