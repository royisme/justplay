/**
 * @file story-loader.ts
 * @description Utility for loading compiled Ink story JSON from static assets.
 * Uses env.ASSETS.fetch() for production (no public network round-trip).
 * @module server/runtime
 */

import type { StoryJson } from "./ink-runner";

/**
 * Loads a compiled Ink story JSON from static assets.
 * This uses the ASSETS binding to fetch from Cloudflare's static assets
 * without going through the public network.
 *
 * @param env - Cloudflare environment bindings (must include ASSETS)
 * @param scenarioKey - The scenario key (e.g., "cyberpunk-heist-v1")
 * @returns Parsed story JSON object
 * @throws Error if story not found or ASSETS binding unavailable
 *
 * @example
 * const storyJson = await loadStoryJson(env, "cyberpunk-heist-v1");
 */
export async function loadStoryJson(
  env: { ASSETS?: Fetcher },
  scenarioKey: string
): Promise<StoryJson> {
  // Extract scenario key from path if full path provided
  const key = scenarioKey
    .replace("stories/dist/", "")
    .replace("stories/", "")
    .replace(".json", "");

  const storyUrl = `/stories/${key}.json`;

  // Use ASSETS binding if available (production)
  if (env.ASSETS) {
    try {
      const res = await env.ASSETS.fetch(
        new Request(new URL(storyUrl, "http://assets"))
      );
      if (!res.ok) {
        throw new Error(`Story not found: ${key} (status: ${res.status})`);
      }
      return (await res.json()) as StoryJson;
    } catch (error) {
      throw new Error(
        `Failed to load story via ASSETS: ${key}. Error: ${error}`
      );
    }
  }

  // Fallback: direct fetch (development or when ASSETS not bound)
  try {
    const res = await fetch(new URL(storyUrl, "http://localhost:5173"));
    if (!res.ok) {
      throw new Error(`Story not found: ${key} (status: ${res.status})`);
    }
    return (await res.json()) as StoryJson;
  } catch {
    throw new Error(
      `Failed to load story: ${key}. Ensure 'bun run build:ink' was executed.`
    );
  }
}
