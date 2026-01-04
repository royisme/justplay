/**
 * @file story.ts
 * @description Shared TypeScript types for story-related data structures.
 * These types are safe to use in both client and server code.
 * @module SharedTypes/Story
 */

// --- Story Map Types ---

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

// --- Scene and Choice Types ---

export interface Choice {
  id: number;
  text: string;
}

export interface SceneData {
  current_node_id: string;
  content: string;
  choices: Choice[];
}

// --- Story Concept Types ---

export interface StoryConcept {
  author: string;
  title: string;
  writing_style: string;
}

// --- Story History Types ---

export interface StoryMessage {
  role: "user" | "assistant";
  content: string;
}

export type StoryHistory = StoryMessage[];
