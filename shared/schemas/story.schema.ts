/**
 * @file story.schema.ts
 * @description Shared Zod schemas for story-related types.
 * These schemas are safe for both client and server usage.
 * @module SharedSchemas
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { z } from "zod";

// --- Story Concept ---

export const StoryConceptSchema = z.object({
  author: z.string().describe("A representative author name for this genre"),
  title: z.string().describe("A creative novel title"),
  writing_style: z
    .string()
    .describe(
      "A concise and imaginative writing style description that can be used directly in AI instructions"
    ),
});

export type StoryConcept = z.infer<typeof StoryConceptSchema>;

// --- Story Map ---

export const StoryNodeSchema = z.object({
  id: z.string().describe("Unique node identifier"),
  label: z.string().describe("Short, impactful node label"),
  details: z.string().describe("Vivid, specific scene details"),
});

export type StoryNode = z.infer<typeof StoryNodeSchema>;

export const StoryEdgeSchema = z.object({
  from: z.string().describe("Source node ID"),
  to: z.string().describe("Target node ID"),
  label: z.string().describe("Choice text that leads to this path"),
});

export type StoryEdge = z.infer<typeof StoryEdgeSchema>;

export const StoryMapSchema = z.object({
  nodes: z.array(StoryNodeSchema).describe("All story nodes"),
  edges: z.array(StoryEdgeSchema).describe("Connections between nodes"),
});

export type StoryMap = z.infer<typeof StoryMapSchema>;

// --- Scene and Choices ---

export const ChoiceSchema = z.object({
  id: z.number().describe("Choice identifier"),
  text: z.string().describe("Choice text displayed to player"),
});

export type Choice = z.infer<typeof ChoiceSchema>;

export const SceneDataSchema = z.object({
  current_node_id: z
    .string()
    .describe("Current node ID from the story map blueprint"),
  content: z.string().describe("Story content for this scene"),
  choices: z.array(ChoiceSchema).describe("Available choices for the player"),
});

export type SceneData = z.infer<typeof SceneDataSchema>;

export const ChoicesResponseSchema = z.object({
  choices: z.array(ChoiceSchema),
});

export type ChoicesResponse = z.infer<typeof ChoicesResponseSchema>;

// --- Story History ---

export const StoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export type StoryMessage = z.infer<typeof StoryMessageSchema>;

export const StoryHistorySchema = z.array(StoryMessageSchema);

export type StoryHistory = z.infer<typeof StoryHistorySchema>;
