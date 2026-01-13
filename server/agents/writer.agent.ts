import type { Game, GameScenario, Message } from "@server/db/schema";

export class WriterAgent {
  constructor() {}

  async enhanceText(text: string, style: string): Promise<string> {
    // In v0.2, the Writer might just return the text or do minor polish.
    // For now, we mock it.
    return text;
  }
}
