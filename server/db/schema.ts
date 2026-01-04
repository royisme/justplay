/**
 * @file schema.ts
 * @description Drizzle ORM schema definitions for the JustPlay database.
 * This file is server-only and must NEVER be imported by client code.
 * @module server/db/schema
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// --- Games Table ---

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Core fields
  storyType: text("story_type").notNull(),
  writingStyle: text("writing_style"),
  author: text("author"),
  title: text("title"),

  // JSON fields - stored as text but typed as unknown in TS by default
  // Runtime validation is handled at the application layer using shared schemas
  storyMap: text("story_map", { mode: "json" }).$type<Record<string, unknown>>(),
  storyHistory: text("story_history", { mode: "json" })
    .default(sql`'[]'`)
    .$type<Array<{ role: "user" | "assistant"; content: string }>>(),
  currentSceneJson: text("current_scene_json", { mode: "json" }).$type<Record<string, unknown>>(),

  // State
  currentNodeId: text("current_node_id").default("start").notNull(),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// --- Inferred Types ---

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
