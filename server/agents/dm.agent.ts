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

  async generateOpening(): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const openingInstruction = "The user has just started a new game. Provide an engaging opening narrative that sets the scene and asks the user to introduce their character or take their first action. Keep it immersive and true to the scenario style.";

    const result = await generateText({
      model: this.model,
      system: systemPrompt,
      prompt: openingInstruction,
      maxOutputTokens: 1000,
    });

    return result.text;
  }

  /**
   * Generate a dynamic title based on the scenario.
   * Returns a short, evocative title (3-6 words).
   */
  async generateTitle(): Promise<string> {
    const { scenario } = this.context;

    const result = await generateText({
      model: this.model,
      system: "You are a creative writer. Generate short, evocative story titles.",
      prompt: `Based on this scenario type "${scenario.storyType}" and description "${scenario.description || scenario.name}", generate a single creative title for a new adventure story. The title should be 3-6 words, evocative and mysterious. Return ONLY the title, nothing else.`,
      maxOutputTokens: 50,
    });

    // Clean up the result (remove quotes, trim)
    return result.text.replace(/["""]/g, "").trim() || "Untitled Adventure";
  }

  /**
   * Extract and update story metadata from the conversation.
   * Analyzes recent messages to identify characters, items, and plot points.
   */
  async extractMetadata(): Promise<{
    characters: { id: string; name: string; role: string; traits: string[] }[];
    relationships: { from: string; to: string; type: string }[];
    inventory: Record<string, number>;
    plotSummary: string[];
  }> {
    const { history } = this.context;

    // Get recent assistant messages for analysis
    const recentContent = history
      .filter(m => m.role === "assistant")
      .slice(-5)
      .map(m => m.content)
      .join("\n\n");

    if (!recentContent) {
      return { characters: [], relationships: [], inventory: {}, plotSummary: [] };
    }

    const result = await generateText({
      model: this.model,
      system: `You are a story analyst. Extract structured metadata from narrative text.
Return a JSON object with these fields:
- characters: array of {id: string, name: string, role: string, traits: string[]}
- relationships: array of {from: string, to: string, type: string}
- inventory: object mapping item names to quantities
- plotSummary: array of key plot points (1-2 sentences each)

Only include characters, items, and events explicitly mentioned. Be concise.`,
      prompt: `Analyze this story content and extract metadata:\n\n${recentContent}`,
      maxOutputTokens: 500,
    });

    try {
      // Try to parse JSON from the response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse metadata JSON");
    }

    return { characters: [], relationships: [], inventory: {}, plotSummary: [] };
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
