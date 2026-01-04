import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Core fields
  storyType: text("story_type").notNull(),
  writingStyle: text("writing_style"),
  author: text("author"),
  title: text("title"),

  // JSON fields - stored as text but typed as unknown in TS by default
  // You can add runtime validation (like Zod) in the application layer
  storyMap: text("story_map", { mode: "json" }).$type<Record<string, any>>(),
  storyHistory: text("story_history", { mode: "json" })
    .default(sql`'[]'`)
    .$type<any[]>(),
  currentSceneJson: text("current_scene_json", { mode: "json" }).$type<Record<string, any>>(),

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

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
