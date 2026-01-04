/**
 * @file db.server.ts
 * @description Database service layer utilizing Drizzle ORM. Handles CRUD operations for the Game entity.
 * @module DBService
 *
 * @features
 * - Type-safe queries using Drizzle Query Builder.
 * - Automatic timestamp management (updatedAt).
 * - Partial update support with undefined filtering.
 *
 * @maintenance
 * - Ensure schema.ts changes are reflected here if new complex types are added.
 * - D1 limits write operations; optimize batch updates if traffic scales.
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { games } from "../db/schema";
import type { Env } from "../db/client";

// Re-export getDb and types for route access
export { getDb };
export type { Env };
export type { Game } from "../db/schema";

export async function createGame(env: Env, storyType: string) {
  const db = getDb(env);

  const result = await db
    .insert(games)
    .values({
      storyType,
    })
    .returning({ id: games.id });

  return result[0].id;
}

export async function getGame(env: Env, id: number) {
  const db = getDb(env);

  return await db.query.games.findFirst({
    where: eq(games.id, id),
  });
}

export async function updateGame(
  env: Env,
  id: number,
  data: Partial<typeof games.$inferInsert>,
) {
  const db = getDb(env);

  // Filter out undefined values to avoid overwriting with NULL if not intended
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined),
  );

  if (Object.keys(updateData).length === 0) return;

  await db
    .update(games)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(games.id, id));
}
