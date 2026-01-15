import { describe, it, expect } from "vitest";
import { simulateStory } from "../scripts/story/simulate";
import { existsSync } from "node:fs";

describe("story demo pipeline", () => {
  it("compiled story.json should execute and end", async () => {
    const storyJson = "stories/compiled/mystery/20260114_001/story.json";

    // Skip test if story.json doesn't exist (not generated yet)
    if (!existsSync(storyJson)) {
      console.log(
        "⚠️  Skipping test: story.json not found. Run generation pipeline first."
      );
      return;
    }

    const res = await simulateStory(storyJson, 60);
    expect(res.turns.length).toBeGreaterThan(1);
    // 至少每回合应有文本
    expect(res.turns.every((t) => typeof t.text === "string")).toBe(true);
    // demo 结构通常能在有限 turn 内结束
    expect(res.ended).toBe(true);
  });
});
