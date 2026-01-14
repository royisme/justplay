/**
 * @file auth.logout.ts
 * @description Logout action using Better Auth.
 * @module routes/auth.logout
 */

import { redirect } from "react-router";
import { createAuth } from "@server/auth/auth";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import type { Route } from "./+types/auth.logout";

export async function action({ request, context }: Route.ActionArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  try {
    const result = await auth.api.signOut({
      headers: request.headers,
      asResponse: true,
    });
    return redirect("/login", {
      headers: result.headers,
    });
  } catch (error) {
    console.error("[auth.logout] Error:", error);
    return redirect("/login");
  }
}

export async function loader() {
  return redirect("/login");
}
