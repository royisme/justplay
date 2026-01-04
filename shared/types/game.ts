/**
 * @file game.ts
 * @description Shared TypeScript types for game entities.
 * These types are safe to import from both client and server code.
 * @module shared/types/game
 */

// --- Story History ---

export interface StoryHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

// --- Story Map ---

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

// --- Scene & Choices ---

export interface Choice {
  id: number;
  text: string;
}

export interface SceneData {
  current_node_id: string;
  content: string;
  choices: Choice[];
}

// --- Story Concept ---

export interface StoryConcept {
  author: string;
  title: string;
  writing_style: string;
}

// --- Game Entity ---

export interface Game {
  id: number;
  storyType: string;
  writingStyle: string | null;
  author: string | null;
  title: string | null;
  storyMap: StoryMap | null;
  storyHistory: StoryHistoryEntry[];
  currentSceneJson: SceneData | null;
  currentNodeId: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- API Response Types ---

export interface AdvanceGameResponse {
  success: boolean;
  error?: string;
  nextScene?: SceneData;
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
