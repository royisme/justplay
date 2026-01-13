/**
 * @file play.tsx
 * @description Protected route for starting a new game.
 * Requires authentication. Redirects to login if not authenticated.
 * @module routes/play
 */

import { redirect } from "react-router";
import type { MetaFunction } from "react-router";
import type { Route } from "./+types/play";
import { createAuth } from "@server/auth/auth";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { HomePage } from "~/pages/HomePage";

export const meta: MetaFunction = () => {
  return [
    { title: "Start Your Adventure - JustPlay" },
    {
      name: "description",
      content: "Choose your story genre and begin your AI-generated adventure.",
    },
  ];
};

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    // Redirect to login with return URL
    const url = new URL(request.url);
    return redirect(`/login?returnTo=${encodeURIComponent(url.pathname)}`);
  }

  return { user: session.user };
}

export default function PlayRoute() {
  return <HomePage />;
}
