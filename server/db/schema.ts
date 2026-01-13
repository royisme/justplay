/**
 * @file schema.ts
 * @description Drizzle ORM schema definitions for the JustPlay database.
 * This file is server-only and must NEVER be imported by client code.
 * @module server/db/schema
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// --- Game Scenarios Table (World Builder) ---

export const gameScenarios = sqliteTable("game_scenarios", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  description: text("description"),
  storyType: text("story_type").notNull(), // 'cyberpunk', 'fantasy', etc.

  // Agent Prompts
  dmSystemPrompt: text("dm_system_prompt").notNull(),
  writerSystemPrompt: text("writer_system_prompt").notNull(),
  visualStylePrompt: text("visual_style_prompt").notNull(),

  // Model Config
  modelConfig: text("model_config", { mode: "json" })
    .$type<{ dmModel: string; writerModel: string; summaryModel: string }>()
    .notNull(),

  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// --- Games Table ---

export const games = sqliteTable("games", {
  id: text("id").primaryKey(), // UUID
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  scenarioId: text("scenario_id")
    .references(() => gameScenarios.id)
    .notNull(),

  title: text("title").notNull(),
  status: text("status").notNull(), // 'active', 'completed', 'abandoned'

  // Slot System
  slotIndex: integer("slot_index"), // 1-3 (required if active)

  // Progress
  currentChapter: integer("current_chapter").default(1).notNull(),
  currentVolume: integer("current_volume").default(1).notNull(),

  // Metadata
  storyMetadata: text("story_metadata", { mode: "json" })
    .$type<{
      outline: string;
      characters: Array<{ id: string; name: string; role: string; traits: string[] }>;
      relationships: Array<{ from: string; to: string; type: string }>;
      inventory: Record<string, number>;
      plotSummary: string[];
    }>(),

  bookMetadata: text("book_metadata", { mode: "json" })
    .$type<{
      coverImage: string;
      wordCount: number;
      endingType: string;
    }>(),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// --- Messages Table (Tree Structure) ---

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(), // {game_id}--{role}-{timestamp}
  gameId: text("game_id")
    .references(() => games.id, { onDelete: "cascade" })
    .notNull(),
  parentId: text("parent_id"), // Tree structure

  role: text("role").notNull(), // 'system', 'user', 'assistant'
  content: text("content").notNull(),

  depth: integer("depth").default(0).notNull(),
  slotId: integer("slot_id").default(0), // Branch numbering
  isActivePath: integer("is_active_path", { mode: "boolean" }).default(true).notNull(),
  chapterNumber: integer("chapter_number"),

  renderData: text("render_data", { mode: "json" }).$type<Record<string, unknown>>(),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  gamePathIdx: index("game_path_idx").on(table.gameId, table.isActivePath),
  parentIdx: index("parent_idx").on(table.parentId),
}));

// --- Better Auth Tables ---

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role").default("user").notNull(), // Custom: admin or user
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`),
});

// --- Prompt Templates Table ---

export const promptTemplates = sqliteTable("prompt_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  storyType: text("story_type").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// --- Prompt Versions Table ---

export const promptVersions = sqliteTable("prompt_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("template_id")
    .notNull()
    .references(() => promptTemplates.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  config: text("config", { mode: "json" })
    .$type<{ temperature: number; maxTokens: number }>()
    .notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  templateVersionIdx: index("template_version_idx").on(table.templateId, table.version),
}));

// --- LLM Providers Table ---

export const providers = sqliteTable("providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  baseURL: text("base_url").notNull(),
  apiKey: text("api_key").notNull(),
  models: text("models", { mode: "json" }).$type<string[]>().notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).default(false).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// --- Inferred Types ---

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type GameScenario = typeof gameScenarios.$inferSelect;
export type NewGameScenario = typeof gameScenarios.$inferInsert;

export type Provider = typeof providers.$inferSelect;

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type NewPromptTemplate = typeof promptTemplates.$inferInsert;

export type PromptVersion = typeof promptVersions.$inferSelect;
export type NewPromptVersion = typeof promptVersions.$inferInsert;
