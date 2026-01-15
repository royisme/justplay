import { z } from "zod";
import type { GenreId, MacroSceneId } from "./genres";

export const zVar = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]{1,24}$/),
  kind: z.enum(["int", "float", "bool"]),
  initial: z.union([z.number(), z.boolean()]),
  description: z.string().min(1).max(120),
});

export const zCharacter = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]{1,24}$/),
  name: z.string().min(1).max(20),
  role: z.enum([
    "protagonist",
    "ally",
    "antagonist",
    "witness",
    "suspect",
    "npc",
  ]),
  public_profile: z.string().min(1).max(120),
  secret: z.string().min(1).max(120),
});

export const zSceneContract = z.object({
  objective: z.string().min(1).max(80),
  allowedChoiceKeys: z
    .array(z.string().regex(/^[a-z][a-z0-9_]{1,32}$/))
    .min(1)
    .max(4),
  mustReference: z.array(z.string()).max(6),
});

export const zGameBible = z.object({
  v: z.literal(1),
  id: z.string().regex(/^\d{8}_\d{3}$/),
  genre: z.enum(["xuanhuan", "western_fantasy", "urban", "romance", "mystery"]),
  title: z.string().min(2).max(30),
  logline: z.string().min(10).max(120),
  setting: z.object({
    time: z.string().min(1).max(30),
    place: z.string().min(1).max(30),
    premise: z.string().min(10).max(200),
  }),
  variables: z.array(zVar).min(2).max(8),
  cast: z.array(zCharacter).min(2).max(6),
  // Demo 固定 4 场景
  macro: z.record(
    z.enum(["intro", "scene1", "scene2", "finale"]),
    zSceneContract
  ),
  seed: z.number().int().nonnegative(),
  meta: z.object({
    model: z.string().min(1),
    createdAt: z.string().min(1),
  }),
});

export type GameBible = z.infer<typeof zGameBible>;
export type GameBibleGenre = GenreId;
export type GameBibleSceneId = MacroSceneId;
