import { useState } from "react";
import { useLoaderData, Form, Link } from "react-router";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/Card";
import { Badge } from "~/components/ui/badge";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { gameScenarios } from "@server/db/schema";
import { desc } from "drizzle-orm";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/scenarios";

export async function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const scenarios = await db.select().from(gameScenarios).orderBy(desc(gameScenarios.createdAt));
  return { scenarios };
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;

  if (intent === "delete" && id) {
    // await db.delete(gameScenarios).where(eq(gameScenarios.id, id));
    // For safety, let's not implement delete yet or check for active games
    return { success: true };
  }
  return null;
}

export default function ScenariosPage() {
  const { t } = useTranslation();
  const { scenarios } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.scenarios.title")}</h1>
          <p className="text-muted-foreground">{t("admin.scenarios.subtitle")}</p>
        </div>
        <Button as={Link} to="new">
          <Plus className="mr-2 h-4 w-4" /> {t("admin.scenarios.create_new")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl">{scenario.name}</CardTitle>
                <Badge variant={scenario.isActive ? "default" : "secondary"}>
                  {scenario.isActive ? t("admin.common.active") : t("admin.common.draft")}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t("admin.scenarios.type")}:</span> {scenario.storyType}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                    {scenario.modelConfig.dmModel}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" as={Link} to={`${scenario.id}/edit`}>
                <Pencil className="mr-2 h-3 w-3" /> {t("admin.common.edit")}
              </Button>
            </CardFooter>
          </Card>
        ))}

        {scenarios.length === 0 && (
          <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-dashed bg-zinc-50 dark:bg-zinc-900/50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t("admin.scenarios.no_scenarios")}</p>
              <Button variant="link" as={Link} to="new">
                {t("admin.scenarios.create_now")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
