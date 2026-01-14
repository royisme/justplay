/**
 * @file ink-runner.ts
 * @description Core Ink story execution engine.
 * Loads story JSON, restores state, registers external functions, and runs until next choice.
 * @module server/runtime
 */

import { Story } from "inkjs";
import { tagsToEvents } from "./tags";
import {
  mulberry32,
  zSystemState,
  type SystemState,
} from "./system-state";
import { createSystemFns } from "./system-fns";
import type { RenderModel, RenderBlock } from "./render-model";

// --- Input Types ---

/** Type for compiled Ink story JSON */
export type StoryJson = Record<string, unknown>;

export interface RunInput {
  /** Compiled Ink story JSON */
  storyJson: StoryJson;
  /** Game UUID */
  gameId: string;
  /** Player locale */
  locale: "zh-CN" | "en-US";
  /** Current turn index */
  turnIndex: number;
  /** Game status */
  status: "active" | "completed" | "abandoned";
  /** Serialized Ink state */
  inkStateJson: string;
  /** Serialized system state */
  systemStateJson: string;
  /** RNG seed for deterministic randomness */
  rngSeed: number;
  /** Choice to make (required for /choose, omit for /continue) */
  choiceId?: string;
}

export interface RunOutput {
  /** Render model for frontend */
  rm: RenderModel;
  /** Updated Ink state JSON */
  inkStateJson: string;
  /** Updated system state JSON */
  systemStateJson: string;
  /** Updated game status */
  status: "active" | "completed" | "abandoned";
}

// --- Helpers ---

/**
 * Normalizes story text into render blocks.
 * MVP: all text is narration. Future: parse markers for dialogue/system.
 */
function normalizeBlocks(text: string): RenderBlock[] {
  const t = text.trim();
  if (!t) return [];
  // TODO: Parse dialogue markers like "Speaker: text" or [SYSTEM: text]
  return [{ kind: "narration", text: t }];
}

// --- Main Runner ---

/**
 * Executes one turn of the Ink story.
 * Handles state restoration, external function binding, choice selection, and state serialization.
 *
 * @param input - Turn execution parameters
 * @returns Render model and updated state
 *
 * @example
 * // Continue (no choice)
 * const result = runInkTurn({ ...input });
 *
 * // Choose option
 * const result = runInkTurn({ ...input, choiceId: "0" });
 */
export function runInkTurn(input: RunInput): RunOutput {
  // Create story instance and restore state
  const story = new Story(input.storyJson);
  story.state.LoadJson(input.inkStateJson);

  // Parse and validate system state
  const systemState = zSystemState.parse(
    JSON.parse(input.systemStateJson)
  ) as SystemState;

  // Create deterministic RNG (turn-dependent for reproducibility)
  const rng = mulberry32(input.rngSeed + input.turnIndex);

  // Create and bind external functions
  const sys = createSystemFns(systemState, rng);

  // Stats
  story.BindExternalFunction("GetStat", sys.GetStat);
  story.BindExternalFunction("AddStat", sys.AddStat);
  story.BindExternalFunction("Spend", sys.Spend);

  // Inventory
  story.BindExternalFunction("HasItem", sys.HasItem);
  story.BindExternalFunction("AddItem", sys.AddItem);
  story.BindExternalFunction("RemoveItem", sys.RemoveItem);

  // Reputation
  story.BindExternalFunction("GetRep", sys.GetRep);
  story.BindExternalFunction("AddRep", sys.AddRep);

  // Flags
  story.BindExternalFunction("GetFlag", sys.GetFlag);
  story.BindExternalFunction("SetFlag", sys.SetFlag);

  // Skill checks
  story.BindExternalFunction("Check", sys.Check);

  // UI
  story.BindExternalFunction("Toast", sys.Toast);

  // Process choice if provided
  if (typeof input.choiceId === "string") {
    const idx = Number(input.choiceId);
    if (!Number.isInteger(idx) || idx < 0) {
      throw new Error(`Invalid choiceId: ${input.choiceId}`);
    }
    if (idx >= story.currentChoices.length) {
      throw new Error(
        `Choice index ${idx} out of range (${story.currentChoices.length} choices available)`
      );
    }
    story.ChooseChoiceIndex(idx);
  }

  // Continue until next choice or end
  let output = "";
  const seenTags: string[] = [];

  while (story.canContinue) {
    output += story.Continue();
    for (const t of story.currentTags ?? []) {
      seenTags.push(t);
    }
  }

  // Build choices array
  const choices = story.currentChoices.map((c) => ({
    choiceId: String(c.index),
    text: c.text,
  }));

  // Serialize updated states
  const inkStateJson = story.state.toJson();
  const systemStateJson = JSON.stringify(systemState);

  // Collect all tags (deduplicated)
  const tags = Array.from(
    new Set([...(story.currentTags ?? []), ...seenTags])
  );

  // Parse tags into events
  const events = tagsToEvents(tags);

  // Update turn and status
  const nextTurnIndex = input.turnIndex + 1;
  const atEnd = !story.canContinue && choices.length === 0;
  const status =
    input.status === "active" && atEnd ? "completed" : input.status;

  // Build render model
  const rm: RenderModel = {
    gameId: input.gameId,
    turnIndex: nextTurnIndex,
    status,
    locale: input.locale,
    blocks: normalizeBlocks(output),
    choices,
    tags,
    events,
    checkpoint: {
      inkStateJson,
      systemStateJson,
      rngSeed: input.rngSeed,
    },
    hud: {
      stats: {
        money: systemState.money,
        heat: systemState.heat,
        time: systemState.time,
      },
      flags: Object.entries(systemState.flags)
        .filter(([, v]) => v)
        .map(([k]) => k),
    },
  };

  return { rm, inkStateJson, systemStateJson, status };
}

/**
 * Gets the initial Ink state JSON for a new story.
 * Used when creating a new game.
 */
export function getInitialInkState(storyJson: StoryJson): string {
  const story = new Story(storyJson);
  return story.state.toJson();
}
