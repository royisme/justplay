/**
 * @file game.ts
 * @description Shared TypeScript types for game entities.
 * These types are safe to import from both client and server code.
 * @module shared/types/game
 */

// --- Story Metadata (Agent-maintained) ---

export interface GameCharacter {
  id: string;
  name: string;
  role: string;
  traits: string[];
}

export interface GameRelationship {
  from: string;
  to: string;
  type: string;
}

export interface StoryMetadata {
  outline: string;
  characters: GameCharacter[];
  relationships: GameRelationship[];
  inventory: Record<string, number>;
  plotSummary: string[];
}

// --- Book Metadata (after completion) ---

export interface BookMetadata {
  coverImage: string;
  wordCount: number;
  endingType: string;
}

// --- Game Entity ---

export type GameStatus = "active" | "completed" | "abandoned";

export interface Game {
  id: string;
  userId: string;
  scenarioId: string;
  title: string;
  status: GameStatus;
  slotIndex: number | null;
  currentChapter: number;
  currentVolume: number;
  storyMetadata: StoryMetadata | null;
  bookMetadata: BookMetadata | null;
  createdAt: Date;
  completedAt: Date | null;

  // Legacy fields for backward compatibility with old GamePage
  // @deprecated - these will be removed in a future version
  storyType?: string;
  storyHistory?: StoryHistoryEntry[];
  currentSceneJson?: SceneData | null;
  storyMap?: StoryMap | null;
  author?: string | null;
  currentNodeId?: string;
}

// --- Message (Tree Structure) ---

export type MessageRole = "system" | "user" | "assistant";

export interface GameMessage {
  id: string;
  gameId: string;
  parentId: string | null;
  role: MessageRole;
  content: string;
  depth: number;
  slotId: number | null;
  isActivePath: boolean;
  chapterNumber: number | null;
  renderData: Record<string, unknown> | null;
  createdAt: Date;
}

// --- Game Scenario (World Builder) ---

export interface ModelConfig {
  dmModel: string;
  writerModel: string;
  summaryModel: string;
}

export interface GameScenario {
  id: string;
  name: string;
  description: string | null;
  storyType: string;
  dmSystemPrompt: string;
  writerSystemPrompt: string;
  visualStylePrompt: string;
  modelConfig: ModelConfig;
  isActive: boolean;
  createdAt: Date;
}

// --- API Response Types ---

export interface AdvanceGameResponse {
  success: boolean;
  error?: string;
  userMessageId?: string;
  assistantMessageId?: string;
  // Legacy field for backward compatibility
  nextScene?: SceneData;
}

// --- Legacy Types (for compatibility) ---

export interface StoryHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

export interface StoryNode {
  id: string;
  label: string;
  details: string;
}

export interface StoryEdge {
  from: string;
  to: string;
  label: string;
}

export interface StoryMap {
  nodes: StoryNode[];
  edges: StoryEdge[];
}

export interface Choice {
  id: number;
  text: string;
}

export interface SceneData {
  current_node_id: string;
  content: string;
  choices: Choice[];
}

// --- Genre Types ---

export type StoryGenre =
  | "东方玄幻"
  | "西方魔幻"
  | "赛博朋克"
  | "悬疑解谜"
  | "末世科幻";

export const GENRE_THEME_MAP: Record<StoryGenre, string> = {
  东方玄幻: "xuanhuan",
  西方魔幻: "magic",
  赛博朋克: "cyberpunk",
  悬疑解谜: "mystery",
  末世科幻: "scifi",
} as const;
