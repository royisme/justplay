import { readFile } from "node:fs/promises";
import { Story } from "inkjs";

export type SimResult = {
  turns: Array<{ text: string; choices: string[] }>;
  ended: boolean;
};

export async function simulateStory(
  storyJsonPath: string,
  maxTurns = 50
): Promise<SimResult> {
  const raw = JSON.parse(await readFile(storyJsonPath, "utf-8"));
  const story = new Story(raw);

  const turns: SimResult["turns"] = [];
  for (let i = 0; i < maxTurns; i++) {
    const text = story.ContinueMaximally().trim();
    const choices = story.currentChoices.map((c) => c.text);

    turns.push({ text, choices });

    if (choices.length === 0) break;

    // Demo 策略：永远选第一个（后续可以做 random/coverage）
    story.ChooseChoiceIndex(0);
  }

  const ended = story.currentChoices.length === 0 && !story.canContinue;
  return { turns, ended };
}
