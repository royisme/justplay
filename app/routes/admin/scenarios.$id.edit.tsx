/**
 * @file scenarios.$id.edit.tsx
 * @description Admin page for editing a game scenario.
 */

import { Form, redirect, useActionData, useLoaderData, useNavigation, Link } from "react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { eq } from "drizzle-orm";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { gameScenarios } from "@server/db/schema";
import type { Route } from "./+types/scenarios.$id.edit";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { useTranslation } from "react-i18next";

export async function loader({ params, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);

  const scenario = await db.query.gameScenarios.findFirst({
    where: eq(gameScenarios.id, params.id),
  });

  if (!scenario) {
    throw new Response("Scenario not found", { status: 404 });
  }

  return { scenario };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await db.delete(gameScenarios).where(eq(gameScenarios.id, params.id));
    return redirect("/admin/scenarios");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const storyType = formData.get("storyType") as string;
  const dmSystemPrompt = formData.get("dmSystemPrompt") as string;
  const writerSystemPrompt = formData.get("writerSystemPrompt") as string;
  const visualStylePrompt = formData.get("visualStylePrompt") as string;
  const dmModel = formData.get("dmModel") as string || "claude-3-sonnet";
  const writerModel = formData.get("writerModel") as string || "claude-3-sonnet";
  const summaryModel = formData.get("summaryModel") as string || "claude-3-haiku";
  const isActive = formData.get("isActive") === "on";

  if (!name || !storyType || !dmSystemPrompt || !writerSystemPrompt || !visualStylePrompt) {
    return { error: "error_fill_all" };
  }

  await db.update(gameScenarios)
    .set({
      name,
      description,
      storyType,
      dmSystemPrompt,
      writerSystemPrompt,
      visualStylePrompt,
      modelConfig: { dmModel, writerModel, summaryModel },
      isActive,
    })
    .where(eq(gameScenarios.id, params.id));

  return redirect("/admin/scenarios");
}

export default function EditScenarioPage() {
  const { t } = useTranslation();
  const { scenario } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" as={Link} to="/admin/scenarios">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.scenarios.edit_title")}</h1>
            <p className="text-muted-foreground">{scenario.name}</p>
          </div>
        </div>
        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <Button
            type="submit"
            variant="danger"
            onClick={(e: React.MouseEvent) => {
              if (!confirm(t("admin.scenarios.confirm_delete"))) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("admin.common.delete")}
          </Button>
        </Form>
      </div>

      <Form method="post" className="space-y-6">
        {actionData?.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {actionData.error === "error_fill_all" ? t("admin.scenarios.error_fill_all") : actionData.error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.scenarios.basic_info")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                {t("admin.scenarios.name_label")}
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={scenario.name}
                placeholder={t("admin.scenarios.name_placeholder")}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                {t("admin.scenarios.desc_label")}
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={scenario.description || ""}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                placeholder={t("admin.scenarios.desc_placeholder")}
              />
            </div>
            <div>
              <label htmlFor="storyType" className="block text-sm font-medium mb-1">
                {t("admin.scenarios.type_label")}
              </label>
              <select
                id="storyType"
                name="storyType"
                defaultValue={scenario.storyType}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                required
              >
                <option value="">{t("admin.scenarios.select_type")}</option>
                <option value="东方玄幻">{t("home.genres.xuanhuan")}</option>
                <option value="西方魔幻">{t("home.genres.magic")}</option>
                <option value="赛博朋克">{t("home.genres.cyberpunk")}</option>
                <option value="悬疑解谜">{t("home.genres.mystery")}</option>
                <option value="末世科幻">{t("home.genres.scifi")}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={scenario.isActive}
                className="h-4 w-4"
              />
              <label htmlFor="isActive" className="text-sm">
                {t("admin.scenarios.activate_label")}
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.scenarios.agent_prompts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="dmSystemPrompt" className="block text-sm font-medium mb-1">
                {t("admin.scenarios.dm_prompt_label")}
              </label>
              <textarea
                id="dmSystemPrompt"
                name="dmSystemPrompt"
                rows={6}
                defaultValue={scenario.dmSystemPrompt}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none font-mono text-sm"
                placeholder={t("admin.scenarios.dm_prompt_placeholder")}
                required
              />
            </div>
            <div>
              <label htmlFor="writerSystemPrompt" className="block text-sm font-medium mb-1">
                {t("admin.scenarios.writer_prompt_label")}
              </label>
              <textarea
                id="writerSystemPrompt"
                name="writerSystemPrompt"
                rows={6}
                defaultValue={scenario.writerSystemPrompt}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none font-mono text-sm"
                placeholder={t("admin.scenarios.writer_prompt_placeholder")}
                required
              />
            </div>
            <div>
              <label htmlFor="visualStylePrompt" className="block text-sm font-medium mb-1">
                {t("admin.scenarios.visual_prompt_label")}
              </label>
              <textarea
                id="visualStylePrompt"
                name="visualStylePrompt"
                rows={3}
                defaultValue={scenario.visualStylePrompt}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none font-mono text-sm"
                placeholder={t("admin.scenarios.visual_prompt_placeholder")}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.scenarios.model_config")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="dmModel" className="block text-sm font-medium mb-1">
                {t("admin.scenarios.dm_model_label")}
              </label>
              <Input
                id="dmModel"
                name="dmModel"
                defaultValue={scenario.modelConfig.dmModel}
              />
            </div>
            <div>
              <label htmlFor="writerModel" className="block text-sm font-medium mb-1">
                {t("admin.scenarios.writer_model_label")}
              </label>
              <Input
                id="writerModel"
                name="writerModel"
                defaultValue={scenario.modelConfig.writerModel}
              />
            </div>
            <div>
              <label htmlFor="summaryModel" className="block text-sm font-medium mb-1">
                {t("admin.scenarios.summary_model_label")}
              </label>
              <Input
                id="summaryModel"
                name="summaryModel"
                defaultValue={scenario.modelConfig.summaryModel}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" as={Link} to="/admin/scenarios">
            {t("admin.common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? t("admin.common.saving") : t("admin.scenarios.save_submit")}
          </Button>
        </div>
      </Form>
    </div>
  );
}
