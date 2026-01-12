/**
 * @file admin/playground.tsx
 * @description LLM Playground for testing prompts with different models.
 * @module routes/admin/playground
 */

import { Form, useActionData, useNavigation, useLoaderData } from "react-router";
import { useState } from "react";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { providers, promptTemplates, promptVersions } from "@server/db/schema";
import { eq, desc } from "drizzle-orm";
import { AIService } from "@server/services";
import type { Route } from "./+types/playground";

// --- Types ---

type Provider = typeof providers.$inferSelect;
type PromptTemplate = typeof promptTemplates.$inferSelect;
type PromptVersion = typeof promptVersions.$inferSelect;

interface TemplateWithVersion extends PromptTemplate {
  latestVersion?: PromptVersion;
}

interface ActionData {
  error?: string;
  success?: boolean;
  result?: string;
  duration?: number;
  model?: string;
  provider?: string;
}

// --- Loader ---

export async function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);

  const activeProviders = await db.query.providers.findMany({
    where: eq(providers.isActive, true),
    orderBy: [desc(providers.isDefault)],
  });

  const activeTemplates = await db.query.promptTemplates.findMany({
    where: eq(promptTemplates.isActive, true),
  });

  // Get latest version for each template
  const templatesWithVersions = await Promise.all(
    activeTemplates.map(async (template) => {
      const latestVersion = await db.query.promptVersions.findFirst({
        where: eq(promptVersions.templateId, template.id),
        orderBy: [desc(promptVersions.version)],
      });
      return { ...template, latestVersion };
    })
  );

  return {
    providers: activeProviders,
    templates: templatesWithVersions.filter((t) => t.latestVersion),
  };
}

// --- Action ---

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const providerId = parseInt(formData.get("providerId") as string);
  const model = formData.get("model") as string;
  const systemPrompt = formData.get("systemPrompt") as string;
  const userPrompt = formData.get("userPrompt") as string;
  const temperature = parseFloat(formData.get("temperature") as string) || 0.7;

  if (!providerId || !model || !userPrompt) {
    return { error: "Provider, model, and prompt are required" };
  }

  const env = getEnv(context);

  try {
    const startTime = Date.now();
    const aiService = await AIService.createForProvider(env, providerId, model);

    let result: string;
    if (systemPrompt) {
      result = await aiService.generateTextWithHistory(
        systemPrompt,
        userPrompt,
        [],
        temperature
      );
    } else {
      result = await aiService.generateText(userPrompt, temperature);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      success: true,
      result,
      duration,
      model: aiService.getInfo().model,
      provider: aiService.getInfo().providerName,
    };
  } catch (error) {
    console.error("[playground action]", error);
    return {
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}

// --- Component ---

export default function PlaygroundPage() {
  const { providers: providerList, templates } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(
    providerList[0]?.id ?? null
  );
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");

  const selectedProvider = providerList.find(
    (p: Provider) => p.id === selectedProviderId
  );

  const loadTemplate = (templateId: number) => {
    const template = templates.find(
      (t: TemplateWithVersion) => t.id === templateId
    );
    if (template?.latestVersion) {
      setSystemPrompt(template.latestVersion.systemPrompt);
      setUserPrompt(template.latestVersion.userPromptTemplate);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        LLM Playground
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <Form method="post" className="space-y-4">
            {/* Provider & Model Selection */}
            <div className="bg-background-secondary rounded-xl border border-border p-4">
              <h2 className="text-sm font-medium text-text-secondary mb-3">
                Configuration
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Provider
                  </label>
                  <select
                    name="providerId"
                    value={selectedProviderId ?? ""}
                    onChange={(e) =>
                      setSelectedProviderId(parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent"
                  >
                    {providerList.map((p: Provider) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isDefault && "(Default)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Model
                  </label>
                  <select
                    name="model"
                    className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent"
                  >
                    {selectedProvider?.models.map((m: string) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Temperature
                  </label>
                  <input
                    name="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    defaultValue="0.7"
                    className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Load Template
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) loadTemplate(parseInt(e.target.value));
                    }}
                    className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select template...</option>
                    {templates.map((t: TemplateWithVersion) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.storyType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Prompts */}
            <div className="bg-background-secondary rounded-xl border border-border p-4">
              <h2 className="text-sm font-medium text-text-secondary mb-3">
                Prompts
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    System Prompt (optional)
                  </label>
                  <textarea
                    name="systemPrompt"
                    rows={4}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="You are a helpful assistant..."
                    className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    User Prompt
                  </label>
                  <textarea
                    name="userPrompt"
                    rows={6}
                    required
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedProviderId}
              className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Generating..." : "Generate"}
            </button>
          </Form>
        </div>

        {/* Output Panel */}
        <div className="bg-background-secondary rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-secondary">Output</h2>
            {actionData?.success && (
              <div className="text-xs text-text-secondary">
                {actionData.provider}/{actionData.model} | {actionData.duration}
                ms
              </div>
            )}
          </div>

          {actionData?.error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
              {actionData.error}
            </div>
          )}

          {actionData?.success && actionData.result && (
            <div className="bg-background-primary rounded-lg p-4 min-h-[400px] overflow-auto">
              <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono">
                {actionData.result}
              </pre>
            </div>
          )}

          {!actionData && (
            <div className="flex items-center justify-center min-h-[400px] text-text-secondary text-sm">
              Run a prompt to see results here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
