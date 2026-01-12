/**
 * @file admin/prompts.tsx
 * @description Prompt template management page.
 * @module routes/admin/prompts
 */

import { Form, useActionData, useNavigation, useLoaderData } from "react-router";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { promptTemplates, promptVersions } from "@server/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Route } from "./+types/prompts";

// --- Story Types ---

const STORY_TYPES = [
  { value: "东方玄幻", label: "Eastern Fantasy" },
  { value: "西方魔幻", label: "Western Magic" },
  { value: "赛博朋克", label: "Cyberpunk" },
  { value: "悬疑解谜", label: "Mystery" },
  { value: "末世科幻", label: "Post-Apocalyptic Sci-Fi" },
];

// --- Types ---

type PromptTemplate = typeof promptTemplates.$inferSelect;
type PromptVersion = typeof promptVersions.$inferSelect;

interface TemplateWithVersion extends PromptTemplate {
  activeVersion?: PromptVersion;
}

// --- Loader ---

export async function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);

  const templates = await db.query.promptTemplates.findMany({
    orderBy: [desc(promptTemplates.createdAt)],
  });

  // Get active version for each template
  const templatesWithVersions = await Promise.all(
    templates.map(async (template) => {
      const activeVersion = await db.query.promptVersions.findFirst({
        where: eq(promptVersions.templateId, template.id),
        orderBy: [desc(promptVersions.version)],
      });
      return { ...template, activeVersion };
    })
  );

  return { templates: templatesWithVersions };
}

// --- Action ---

export async function action({ request, context }: Route.ActionArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "create") {
      const name = formData.get("name") as string;
      const storyType = formData.get("storyType") as string;
      const description = formData.get("description") as string;
      const systemPrompt = formData.get("systemPrompt") as string;
      const userPromptTemplate = formData.get("userPromptTemplate") as string;
      const temperature = parseFloat(formData.get("temperature") as string) || 0.7;
      const maxTokens = parseInt(formData.get("maxTokens") as string) || 2000;

      if (!name || !storyType || !systemPrompt || !userPromptTemplate) {
        return { error: "Name, story type, and prompts are required" };
      }

      // Create template
      const [template] = await db
        .insert(promptTemplates)
        .values({
          name,
          storyType,
          description,
          isActive: true,
        })
        .returning();

      // Create initial version
      await db.insert(promptVersions).values({
        templateId: template.id,
        version: 1,
        systemPrompt,
        userPromptTemplate,
        config: { temperature, maxTokens },
        isActive: true,
      });

      return { success: "Template created successfully" };
    }

    if (intent === "delete") {
      const id = parseInt(formData.get("id") as string);
      await db.delete(promptTemplates).where(eq(promptTemplates.id, id));
      return { success: "Template deleted" };
    }

    if (intent === "toggle") {
      const id = parseInt(formData.get("id") as string);
      const template = await db.query.promptTemplates.findFirst({
        where: eq(promptTemplates.id, id),
      });
      if (template) {
        await db
          .update(promptTemplates)
          .set({ isActive: !template.isActive })
          .where(eq(promptTemplates.id, id));
      }
      return { success: "Template status updated" };
    }
  } catch (error) {
    console.error("[prompts action]", error);
    return { error: "Operation failed" };
  }

  return null;
}

// --- Component ---

export default function PromptsPage() {
  const { templates } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Prompt Templates
      </h1>

      {/* Status Messages */}
      {actionData?.error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
          {actionData.error}
        </div>
      )}
      {actionData?.success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 text-sm">
          {actionData.success}
        </div>
      )}

      {/* Add Template Form */}
      <div className="bg-background-secondary rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Create New Template
        </h2>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="create" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Template Name
              </label>
              <input
                name="name"
                required
                placeholder="e.g., Story Concept Generator"
                className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Story Type
              </label>
              <select
                name="storyType"
                required
                className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent"
              >
                {STORY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Description
              </label>
              <input
                name="description"
                placeholder="Optional description"
                className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              System Prompt
            </label>
            <textarea
              name="systemPrompt"
              required
              rows={4}
              placeholder="You are a creative storyteller..."
              className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              User Prompt Template
              <span className="text-xs text-text-secondary ml-2">
                (Use {"{{variable}}"} for placeholders)
              </span>
            </label>
            <textarea
              name="userPromptTemplate"
              required
              rows={4}
              placeholder="Generate a story about {{topic}} in the style of {{genre}}..."
              className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Temperature
              </label>
              <input
                name="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                defaultValue="0.7"
                className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Max Tokens
              </label>
              <input
                name="maxTokens"
                type="number"
                min="100"
                max="8000"
                defaultValue="2000"
                className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Template"}
              </button>
            </div>
          </div>
        </Form>
      </div>

      {/* Template List */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <div className="bg-background-secondary rounded-xl border border-border p-8 text-center text-text-secondary">
            No templates yet. Create one above.
          </div>
        ) : (
          templates.map((template: TemplateWithVersion) => (
            <div
              key={template.id}
              className="bg-background-secondary rounded-xl border border-border p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {template.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                      {template.storyType}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        template.isActive
                          ? "bg-green-500/10 text-green-600"
                          : "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-sm text-text-secondary">
                      {template.description}
                    </p>
                  )}
                  {template.activeVersion && (
                    <p className="text-xs text-text-secondary mt-2">
                      Version {template.activeVersion.version} | Temp:{" "}
                      {(template.activeVersion.config as { temperature: number }).temperature} | Max Tokens:{" "}
                      {(template.activeVersion.config as { maxTokens: number }).maxTokens}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Form method="post" className="inline">
                    <input type="hidden" name="intent" value="toggle" />
                    <input type="hidden" name="id" value={template.id} />
                    <button
                      type="submit"
                      className="text-sm text-text-secondary hover:text-text-primary px-3 py-1 border border-border rounded-lg"
                    >
                      {template.isActive ? "Disable" : "Enable"}
                    </button>
                  </Form>
                  <Form method="post" className="inline">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={template.id} />
                    <button
                      type="submit"
                      className="text-sm text-red-500 hover:text-red-600 px-3 py-1 border border-red-500/30 rounded-lg"
                      onClick={(e) => {
                        if (!confirm("Delete this template?")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </Form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
