import { Outlet, redirect, useLoaderData } from "react-router";
import { SidebarLayout } from "~/components/layout/SidebarLayout";
import { UserSidebar } from "~/components/layout/UserSidebar";
import { createAuth } from "@server/auth/auth";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { GameService } from "@server/services/game.server";
import type { Route } from "./+types/layout";

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
    completedGames: completedGames.slice(0, 5), // Show recent 5 in sidebar
    user: session.user,
  };
}

export default function AppLayout() {
  const { activeGames, completedGames, user } = useLoaderData<typeof loader>();

  return (
    <SidebarLayout sidebar={<UserSidebar activeGames={activeGames} completedGames={completedGames} user={user} />}>
      <Outlet />
    </SidebarLayout>
  );
}
