/**
 * @file tags.ts
 * @description Parses Ink tags into RenderModel events for Pixi/UI consumption.
 * Only whitelisted tags are processed; unknown tags are ignored (logged as warnings).
 * @module server/runtime
 */

import type { RenderEvent } from "./render-model";

const ALLOWED_KEYS = new Set(["bg", "char", "sfx", "music", "fx", "ui"]);

/**
 * Parse Ink tags into structured events for the renderer.
 * Tag format: key:value1:value2:...
 *
 * @example
 * "#bg:alley:fade" -> { type: "bg", id: "alley", transition: "fade" }
 * "#char:fixer:neutral:left:enter" -> { type: "char", id: "fixer", pose: "neutral", slot: "left", action: "enter" }
 */
export function tagsToEvents(tags: string[]): RenderEvent[] {
  const events: RenderEvent[] = [];

  for (const raw of tags) {
    const parts = raw
      .split(":")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length < 2) continue;

    const key = parts[0];
    if (!ALLOWED_KEYS.has(key)) {
      // Log warning for unknown tags in development
      if (process.env.NODE_ENV === "development") {
        console.warn(`[tags] Unknown tag key ignored: ${key}`);
      }
      continue;
    }

    switch (key) {
      case "bg": {
        const id = parts[1];
        const transition =
          parts[2] === "fade" || parts[2] === "cut" ? parts[2] : undefined;
        events.push({ type: "bg", id, transition });
        break;
      }

      case "char": {
        const [id, pose, slot, action] = [
          parts[1],
          parts[2],
          parts[3],
          parts[4],
        ];
        events.push({
          type: "char",
          id,
          pose: pose || undefined,
          slot:
            slot === "left" || slot === "mid" || slot === "right"
              ? slot
              : undefined,
          action:
            action === "enter" || action === "exit" || action === "update"
              ? action
              : undefined,
        });
        break;
      }

      case "sfx": {
        events.push({ type: "sfx", id: parts[1] });
        break;
      }

      case "music": {
        const action =
          parts[2] === "play" || parts[2] === "stop" ? parts[2] : undefined;
        events.push({ type: "music", id: parts[1], action });
        break;
      }

      case "fx": {
        const id = parts[1];
        if (["shake", "flash", "fadein", "fadeout"].includes(id)) {
          events.push({
            type: "fx",
            id: id as "shake" | "flash" | "fadein" | "fadeout",
          });
        }
        break;
      }

      case "ui": {
        const id = parts[1];
        const payload = parts.slice(2).join(":") || undefined;
        if (["inventory_open", "codex_unlock", "toast"].includes(id)) {
          events.push({
            type: "ui",
            id: id as "inventory_open" | "codex_unlock" | "toast",
            payload,
          });
        }
        break;
      }
    }
  }

  return events;
}
