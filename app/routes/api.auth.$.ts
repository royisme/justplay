/**
 * @file api.auth.$.ts
 * @description API route handler for Better Auth.
 * Handles all /api/auth/* requests.
 * @module routes/api.auth.$
 */

import { createAuth } from "@server/auth/auth";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import type { Route } from "./+types/api.auth.$";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);
  return auth.handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);
  return auth.handler(request);
}
