/**
 * @file system-state.ts
 * @description System state management and deterministic PRNG for the narrative engine.
 * All randomness must be reproducible for save/load and replay functionality.
 * @module server/runtime
 */

import { z } from "zod/v4";

// --- System State Schema ---

export const zSystemState = z.object({
  /** Schema version for migrations */
  v: z.literal(1),
  /** Player money/currency */
  money: z.number().int(),
  /** Heat/wanted level */
  heat: z.number().int(),
  /** In-game time units */
  time: z.number().int(),
  /** Faction reputation scores */
  rep: z.record(z.string(), z.number().int()),
  /** Inventory: itemId -> quantity */
  inv: z.record(z.string(), z.number().int()),
  /** Boolean flags for story state */
  flags: z.record(z.string(), z.boolean()),
});

export type SystemState = z.infer<typeof zSystemState>;

/**
 * Creates a fresh default system state for new games.
 */
export function defaultSystemState(): SystemState {
  return {
    v: 1,
    money: 50,
    heat: 0,
    time: 0,
    rep: {},
    inv: {},
    flags: {},
  };
}

/**
 * Mulberry32 PRNG - deterministic pseudo-random number generator.
 * Used for all game randomness to enable save/load and replay.
 *
 * @param seed - Initial seed value
 * @returns Function that returns next random number in [0, 1)
 *
 * @example
 * const rng = mulberry32(12345);
 * const roll = Math.floor(rng() * 100) + 1; // 1-100
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a random seed for new games.
 * Uses crypto.getRandomValues for better entropy when available.
 */
export function generateRngSeed(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0];
  }
  return Math.floor(Math.random() * 2 ** 31);
}
