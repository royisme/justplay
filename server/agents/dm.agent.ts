import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { Message, GameScenario, Game } from "@server/db/schema";

interface DMContext {
  game: Game;
  scenario: GameScenario;
  history: Message[];
  providerConfig: {
    baseUrl: string;
    apiKey: string;
  };
}

export class DMAgent {
  private model: any;

  constructor(private context: DMContext) {
    const provider = createOpenAICompatible({
      name: "custom",
      baseURL: context.providerConfig.baseUrl,
      apiKey: context.providerConfig.apiKey,
    });

    // Use the model configured in the scenario
    this.model = provider(context.scenario.modelConfig.dmModel);
  }

  async generateResponse(userAction: string): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();

    // Convert history to AI SDK format (simplified for now)
    const messages = this.context.history.map(m => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content
    }));

    // Add current user action
    messages.push({ role: "user", content: userAction });

    const result = await generateText({
      model: this.model,
      system: systemPrompt,
      messages: messages as any, // Type cast for now
      maxOutputTokens: 1000,
    });

    return result.text;
  }

  private buildSystemPrompt(): string {
    const { scenario, game } = this.context;

    return `
${scenario.dmSystemPrompt}

Current Game Context:
Title: ${game.title}
Chapter: ${game.currentChapter}

Story Metadata:
${JSON.stringify(game.storyMetadata, null, 2)}
    `.trim();
  }
}
