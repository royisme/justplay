import { redirect, useLoaderData, Form } from "react-router";
import { GameService } from "@server/services/game.server";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import { gameScenarios } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/game.new";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/badge";
import { useTranslation } from "react-i18next";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);

  // Verify auth
  const auth = createAuth(db, env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return redirect("/login");

  // Fetch active scenarios
  const scenarios = await db.select().from(gameScenarios).where(eq(gameScenarios.isActive, true));

  return { scenarios };
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return redirect("/login");

  const formData = await request.formData();
  const scenarioId = formData.get("scenario_id") as string;

  if (!scenarioId) {
    return Response.json({ error: "Please select a scenario" }, { status: 400 });
  }

  const gameService = new GameService(env);
  try {
    const gameId = await gameService.createGame(session.user.id, scenarioId);
    return redirect(`/game/${gameId}`);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export default function NewGamePage() {
  const { scenarios } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">{t("new_game.title")}</h1>
      <p className="text-muted-foreground mb-8">{t("new_game.subtitle")}</p>

      <div className="grid gap-6 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="flex flex-col hover:border-indigo-500 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                 <CardTitle>{scenario.name}</CardTitle>
                 <Badge variant="outline">{scenario.storyType}</Badge>
              </div>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-sm text-muted-foreground">
                 {/* Placeholder for tags or more info */}
                 <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">AI Dungeon Master</Badge>
                    <Badge variant="secondary" className="text-xs">Pixel Art</Badge>
                 </div>
              </div>
            </CardContent>
            <CardFooter>
              <Form method="post" className="w-full">
                <input type="hidden" name="scenario_id" value={scenario.id} />
                <Button type="submit" className="w-full">
                  {t("new_game.select_world")}
                </Button>
              </Form>
            </CardFooter>
          </Card>
        ))}
      </div>

      {scenarios.length === 0 && (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-dashed">
              <h3 className="text-lg font-medium">{t("new_game.no_scenarios")}</h3>
              <p className="text-muted-foreground">{t("new_game.no_scenarios_desc")}</p>
          </div>
      )}
    </div>
  );
}
