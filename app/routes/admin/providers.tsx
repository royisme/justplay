/**
 * @file admin/providers.tsx
 * @description Provider management page.
 * @module routes/admin/providers
 */

import { Form, useActionData, useNavigation, useLoaderData } from "react-router";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { providers } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/providers";

// --- Types ---

type Provider = typeof providers.$inferSelect;

// --- Loader ---

export async function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);

  const allProviders = await db.query.providers.findMany({
    orderBy: (p, { desc }) => [desc(p.isDefault), desc(p.createdAt)],
  });

  return { providers: allProviders };
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
      const baseURL = formData.get("baseURL") as string;
      const apiKey = formData.get("apiKey") as string;
      const modelsStr = formData.get("models") as string;
      const isDefault = formData.get("isDefault") === "true";

      const models = modelsStr
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      if (!name || !baseURL || !apiKey || models.length === 0) {
        return { error: "All fields are required" };
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await db
          .update(providers)
          .set({ isDefault: false })
          .where(eq(providers.isDefault, true));
      }

      await db.insert(providers).values({
        name,
        baseURL,
        apiKey,
        models,
        isDefault,
        isActive: true,
      });

      return { success: "Provider created successfully" };
    }

    if (intent === "delete") {
      const id = parseInt(formData.get("id") as string);
      await db.delete(providers).where(eq(providers.id, id));
      return { success: "Provider deleted" };
    }

    if (intent === "setDefault") {
      const id = parseInt(formData.get("id") as string);
      await db
        .update(providers)
        .set({ isDefault: false })
        .where(eq(providers.isDefault, true));
      await db
        .update(providers)
        .set({ isDefault: true })
        .where(eq(providers.id, id));
      return { success: "Default provider updated" };
    }

    if (intent === "toggle") {
      const id = parseInt(formData.get("id") as string);
      const provider = await db.query.providers.findFirst({
        where: eq(providers.id, id),
      });
      if (provider) {
        await db
          .update(providers)
          .set({ isActive: !provider.isActive })
          .where(eq(providers.id, id));
      }
      return { success: "Provider status updated" };
    }
  } catch (error) {
    console.error("[providers action]", error);
    return { error: "Operation failed" };
  }

  return null;
}

// --- Component ---

export default function ProvidersPage() {
  const { providers: providerList } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        LLM Providers
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

      {/* Add Provider Form */}
      <div className="bg-background-secondary rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Add New Provider
        </h2>
        <Form method="post" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="hidden" name="intent" value="create" />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Provider Name
            </label>
            <input
              name="name"
              required
              placeholder="e.g., OpenRouter, DeepSeek"
              className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Base URL
            </label>
            <input
              name="baseURL"
              type="url"
              required
              placeholder="https://api.provider.com/v1"
              className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              API Key
            </label>
            <input
              name="apiKey"
              type="password"
              required
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Models (comma separated)
            </label>
            <input
              name="models"
              required
              placeholder="gpt-4o, gpt-4o-mini, claude-3-5-sonnet"
              className="w-full px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isDefault"
                value="true"
                className="rounded border-border"
              />
              <span className="text-sm text-text-secondary">
                Set as default provider
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Provider"}
            </button>
          </div>
        </Form>
      </div>

      {/* Provider List */}
      <div className="bg-background-secondary rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background-primary">
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Base URL
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Models
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {providerList.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-text-secondary"
                >
                  No providers configured. Add one above.
                </td>
              </tr>
            ) : (
              providerList.map((provider: Provider) => (
                <tr key={provider.id} className="border-b border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {provider.name}
                      </span>
                      {provider.isDefault && (
                        <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm font-mono">
                    {provider.baseURL}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm">
                    {provider.models.slice(0, 3).join(", ")}
                    {provider.models.length > 3 && "..."}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        provider.isActive
                          ? "bg-green-500/10 text-green-600"
                          : "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      {provider.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!provider.isDefault && provider.isActive && (
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="setDefault" />
                          <input type="hidden" name="id" value={provider.id} />
                          <button
                            type="submit"
                            className="text-xs text-accent hover:underline"
                          >
                            Set Default
                          </button>
                        </Form>
                      )}
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="toggle" />
                        <input type="hidden" name="id" value={provider.id} />
                        <button
                          type="submit"
                          className="text-xs text-text-secondary hover:text-text-primary"
                        >
                          {provider.isActive ? "Disable" : "Enable"}
                        </button>
                      </Form>
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={provider.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-500 hover:underline"
                          onClick={(e) => {
                            if (!confirm("Delete this provider?")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Delete
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
