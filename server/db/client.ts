/**
 * @file client.ts
 * @description Server-only database client using Drizzle ORM with Cloudflare D1.
 * This file must NEVER be imported from client code.
 * @module server/db/client
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import type { Env } from "@server/config/env";

// Re-export Env type for convenience
export type { Env };

/**
 * Create a Drizzle database client instance.
 * Must be called with the Cloudflare environment containing the D1 binding.
 *
 * @param env - Cloudflare environment with D1 binding
 * @returns Drizzle database client with schema
 *
 * @example
 * ```ts
 * const db = getDb(env);
 * const game = await db.query.games.findFirst({
 *   where: eq(games.id, 1)
 * });
 * ```
 */
export function getDb(env: Env) {
  if (!env.DB) {
    throw new Error("Database binding (DB) not found in environment");
  }
  return drizzle(env.DB, { schema });
}

/**
 * Type helper for the database client instance.
 */
export type Database = ReturnType<typeof getDb>;
