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
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { providers: providerList } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("admin.providers.title")}</h1>
        <p className="text-muted-foreground">{t("admin.providers.subtitle")}</p>
      </div>

      {/* Status Messages */}
      {actionData?.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
          {actionData.error}
        </div>
      )}
      {actionData?.success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 text-sm">
          {actionData.success}
        </div>
      )}

      {/* Add Provider Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.providers.add_new")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="intent" value="create" />

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t("admin.providers.name")}
              </label>
              <Input
                name="name"
                required
                placeholder="e.g., OpenRouter, DeepSeek"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t("admin.providers.base_url")}
              </label>
              <Input
                name="baseURL"
                type="url"
                required
                placeholder="https://api.provider.com/v1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t("admin.providers.api_key")}
              </label>
              <Input
                name="apiKey"
                type="password"
                required
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t("admin.providers.models")}
              </label>
              <Input
                name="models"
                required
                placeholder="gpt-4o, claude-3-5-sonnet"
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
                <span className="text-sm text-muted-foreground">
                  {t("admin.providers.is_default")}
                </span>
              </label>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("admin.providers.adding") : t("admin.providers.add_button")}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Provider List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.providers.list_title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.providers.name")}</TableHead>
                <TableHead>{t("admin.providers.base_url")}</TableHead>
                <TableHead>{t("admin.providers.models_short")}</TableHead>
                <TableHead>{t("admin.common.status")}</TableHead>
                <TableHead className="text-right">{t("admin.common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t("admin.providers.no_providers")}
                  </TableCell>
                </TableRow>
              ) : (
                providerList.map((provider: Provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{provider.name}</span>
                        {provider.isDefault && (
                          <Badge variant="default" className="text-xs">{t("admin.common.default")}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {provider.baseURL}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {provider.models.slice(0, 2).join(", ")}
                      {provider.models.length > 2 && `... +${provider.models.length - 2}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={provider.isActive ? "default" : "secondary"}>
                        {provider.isActive ? t("admin.common.active") : t("admin.common.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!provider.isDefault && provider.isActive && (
                          <Form method="post" className="inline">
                            <input type="hidden" name="intent" value="setDefault" />
                            <input type="hidden" name="id" value={provider.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              {t("admin.common.set_default")}
                            </Button>
                          </Form>
                        )}
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="toggle" />
                          <input type="hidden" name="id" value={provider.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            {provider.isActive ? t("admin.common.inactive") : t("admin.common.active")}
                          </Button>
                        </Form>
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={provider.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={(e: React.MouseEvent) => {
                              if (!confirm(t("admin.common.confirm_delete"))) {
                                e.preventDefault();
                              }
                            }}
                          >
                            {t("admin.common.delete")}
                          </Button>
                        </Form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
