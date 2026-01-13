import type { Game } from "@server/db/schema";

export class ScribeAgent {
  async summarize(text: string): Promise<string> {
    return "Summary...";
  }

  async updateMetadata(game: Game, action: string): Promise<void> {
    // Update inventory, relationships, etc.
  }
}
