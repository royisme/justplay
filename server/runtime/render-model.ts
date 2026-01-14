/**
 * @file render-model.ts
 * @description RenderModel - the authoritative output structure from the narrative engine.
 * The frontend only depends on RenderModel, never on internal Ink or System state.
 * @module server/runtime
 */

import { z } from "zod/v4";

// --- Block Types ---

export const zRenderBlock = z.object({
  kind: z.enum(["narration", "dialogue", "system"]),
  speaker: z.string().optional(),
  text: z.string().min(1),
});

export type RenderBlock = z.infer<typeof zRenderBlock>;

// --- Choice Types ---

export const zChoice = z.object({
  choiceId: z.string().min(1),
  text: z.string().min(1),
  hint: z
    .object({
      cost: z.string().optional(),
      risk: z.string().optional(),
    })
    .optional(),
});

export type Choice = z.infer<typeof zChoice>;

// --- Event Types (for Pixi/UI consumption) ---

export const zBgEvent = z.object({
  type: z.literal("bg"),
  id: z.string().min(1),
  transition: z.enum(["cut", "fade"]).optional(),
});

export const zCharEvent = z.object({
  type: z.literal("char"),
  id: z.string().min(1),
  pose: z.string().optional(),
  slot: z.enum(["left", "mid", "right"]).optional(),
  action: z.enum(["enter", "exit", "update"]).optional(),
});

export const zSfxEvent = z.object({
  type: z.literal("sfx"),
  id: z.string().min(1),
});

export const zMusicEvent = z.object({
  type: z.literal("music"),
  id: z.string().min(1),
  action: z.enum(["play", "stop"]).optional(),
});

export const zFxEvent = z.object({
  type: z.literal("fx"),
  id: z.enum(["shake", "flash", "fadein", "fadeout"]),
});

export const zUiEvent = z.object({
  type: z.literal("ui"),
  id: z.enum(["inventory_open", "codex_unlock", "toast"]),
  payload: z.any().optional(),
});

export const zEvent = z.discriminatedUnion("type", [
  zBgEvent,
  zCharEvent,
  zSfxEvent,
  zMusicEvent,
  zFxEvent,
  zUiEvent,
]);

export type RenderEvent = z.infer<typeof zEvent>;

// --- Checkpoint (serialized state for save/load) ---

export const zCheckpoint = z.object({
  inkStateJson: z.string().min(2),
  systemStateJson: z.string().min(2),
  rngSeed: z.number().int(),
  modelTraceId: z.string().optional(),
});

export type Checkpoint = z.infer<typeof zCheckpoint>;

// --- HUD (optional stats display) ---

export const zHud = z.object({
  stats: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  flags: z.array(z.string()).optional(),
});

export type Hud = z.infer<typeof zHud>;

// --- RenderModel (full output structure) ---

export const zRenderModel = z.object({
  gameId: z.string().min(1),
  turnIndex: z.number().int().nonnegative(),
  status: z.enum(["active", "completed", "abandoned"]),
  locale: z.enum(["zh-CN", "en-US"]),
  blocks: z.array(zRenderBlock),
  choices: z.array(zChoice),
  tags: z.array(z.string()),
  events: z.array(zEvent),
  checkpoint: zCheckpoint,
  hud: zHud.optional(),
});

export type RenderModel = z.infer<typeof zRenderModel>;

// --- Request/Response schemas for API ---

export const zCreateGameRequest = z.object({
  scenarioKey: z.string().min(1),
  locale: z.enum(["zh-CN", "en-US"]).optional(),
});

export const zContinueRequest = z
  .object({
    requestId: z.string().min(8).optional(),
  })
  .optional();

export const zChooseRequest = z.object({
  requestId: z.string().min(8).optional(),
  choiceId: z.string().min(1),
});

export type CreateGameRequest = z.infer<typeof zCreateGameRequest>;
export type ContinueRequest = z.infer<typeof zContinueRequest>;
export type ChooseRequest = z.infer<typeof zChooseRequest>;
