import { useLoaderData, redirect } from "react-router";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import { games, messages } from "@server/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { Route } from "./+types/library.$id";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) return redirect("/auth/login");

  const game = await db.query.games.findFirst({
    where: and(eq(games.id, params.id), eq(games.userId, session.user.id)),
  });

  if (!game) throw new Response("Not Found", { status: 404 });

  // Get flattened story (only active path)
  const story = await db.select().from(messages)
    .where(and(eq(messages.gameId, game.id), eq(messages.isActivePath, true)))
    .orderBy(asc(messages.createdAt));

  return { game, story };
}

export default function BookReader() {
  const { game, story } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto max-w-3xl py-12 px-6 bg-amber-50 dark:bg-zinc-900 min-h-screen">
       <div className="text-center mb-12">
           <h1 className="text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-100 mb-4">{game.title}</h1>
           <div className="text-sm text-zinc-500 uppercase tracking-widest">
               {game.bookMetadata?.endingType} • {game.bookMetadata?.wordCount} Words
           </div>
       </div>

       <div className="prose prose-lg dark:prose-invert mx-auto font-serif">
           {story.map((msg, index) => {
               if (msg.role === 'system') return null;

               return (
                   <div key={msg.id} className="mb-6">
                       {msg.role === 'assistant' ? (
                           <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                       ) : (
                           <p className="font-sans text-base text-zinc-500 italic pl-4 border-l-2 border-zinc-300">
                               {msg.content}
                           </p>
                       )}
                       {index < story.length - 1 && msg.role === 'assistant' && (
                           <Separator className="my-8 w-1/3 mx-auto opacity-30" />
                       )}
                   </div>
               );
           })}
       </div>

       <div className="mt-20 text-center text-zinc-400 text-sm">
           - END -
       </div>
    </div>
  );
}
