/**
 * @file admin/_index.tsx
 * @description Admin dashboard with statistics.
 * @module routes/admin/_index
 */

import { useLoaderData } from "react-router";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { games, user, providers, gameScenarios } from "@server/db/schema";
import { count, eq, desc } from "drizzle-orm";
import type { Route } from "./+types/_index";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Badge } from "~/components/ui/badge";
import { useTranslation } from "react-i18next";

// --- Loader ---

export async function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);

  // Total counts
  const [gamesCount] = await db.select({ count: count() }).from(games);
  const [usersCount] = await db.select({ count: count() }).from(user);
  const [providersCount] = await db
    .select({ count: count() })
    .from(providers)
    .where(eq(providers.isActive, true));
  const [scenariosCount] = await db
    .select({ count: count() })
    .from(gameScenarios)
    .where(eq(gameScenarios.isActive, true));

  // Games by status (FR-ADMIN-003)
  const [activeGamesCount] = await db
    .select({ count: count() })
    .from(games)
    .where(eq(games.status, "active"));
  const [completedGamesCount] = await db
    .select({ count: count() })
    .from(games)
    .where(eq(games.status, "completed"));
  const [abandonedGamesCount] = await db
    .select({ count: count() })
    .from(games)
    .where(eq(games.status, "abandoned"));

  // Recent activity - last 5 games
  const recentGames = await db
    .select({
      id: games.id,
      title: games.title,
      status: games.status,
      createdAt: games.createdAt,
    })
    .from(games)
    .orderBy(desc(games.createdAt))
    .limit(5);

  return {
    stats: {
      games: gamesCount.count,
      users: usersCount.count,
      providers: providersCount.count,
      scenarios: scenariosCount.count,
      activeGames: activeGamesCount.count,
      completedGames: completedGamesCount.count,
      abandonedGames: abandonedGamesCount.count,
    },
    recentGames,
  };
}

// --- Component ---

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { stats, recentGames } = useLoaderData<typeof loader>();

  const statCards = [
    { label: t("admin.common.total_games"), value: stats.games, color: "text-blue-600" },
    { label: t("admin.common.registered_users"), value: stats.users, color: "text-green-600" },
    { label: t("admin.common.ai_providers"), value: stats.providers, color: "text-purple-600" },
    { label: t("admin.common.scenarios"), value: stats.scenarios, color: "text-orange-600" },
  ];

  const gameStatusCards = [
    { label: t("admin.dashboard.status_active"), value: stats.activeGames, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950" },
    { label: t("admin.dashboard.status_completed"), value: stats.completedGames, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
    { label: t("admin.dashboard.status_abandoned"), value: stats.abandonedGames, color: "text-zinc-500", bg: "bg-zinc-100 dark:bg-zinc-800" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">进行中</Badge>;
      case "completed":
        return <Badge className="bg-green-600">已完结</Badge>;
      case "abandoned":
        return <Badge variant="secondary">已放弃</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">仪表盘</h1>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Game Status Breakdown (FR-ADMIN-003) */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">{t("admin.dashboard.game_status_dist")}</h2>
        <div className="grid grid-cols-3 gap-4">
          {gameStatusCards.map((stat) => (
            <div key={stat.label} className={`p-4 rounded-lg ${stat.bg}`}>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity (FR-ADMIN-003) */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.dashboard.recent_activity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentGames.length > 0 ? (
              <div className="space-y-3">
                {recentGames.map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">{game.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {game.createdAt ? new Date(game.createdAt).toLocaleString() : "Unknown"}
                      </p>
                    </div>
                    {getStatusBadge(game.status)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">{t("admin.dashboard.no_games")}</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.dashboard.quick_actions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/admin/providers"
              className="block p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border hover:border-indigo-500 transition-colors"
            >
              <p className="font-medium text-text-primary">{t("admin.dashboard.add_provider")}</p>
              <p className="text-sm text-text-secondary">
                {t("admin.dashboard.add_provider_desc")}
              </p>
            </a>
            <a
              href="/admin/scenarios"
              className="block p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border hover:border-indigo-500 transition-colors"
            >
              <p className="font-medium text-text-primary">{t("admin.dashboard.world_builder")}</p>
              <p className="text-sm text-text-secondary">
                {t("admin.dashboard.world_builder_desc")}
              </p>
            </a>
            <a
              href="/admin/users"
              className="block p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border hover:border-indigo-500 transition-colors"
            >
              <p className="font-medium text-text-primary">{t("admin.dashboard.user_management")}</p>
              <p className="text-sm text-text-secondary">
                {t("admin.dashboard.user_management_desc")}
              </p>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.dashboard.system_info")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <dt className="text-text-secondary text-sm">{t("admin.dashboard.runtime")}</dt>
                <dd className="text-text-primary font-mono text-sm">
                  Cloudflare Workers
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-text-secondary text-sm">{t("admin.dashboard.database")}</dt>
                <dd className="text-text-primary font-mono text-sm">
                  Cloudflare D1
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-text-secondary text-sm">{t("admin.dashboard.ai_sdk")}</dt>
                <dd className="text-text-primary font-mono text-sm">
                  Vercel AI SDK
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-text-secondary text-sm">{t("admin.dashboard.framework")}</dt>
                <dd className="text-text-primary font-mono text-sm">
                  React Router v7
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
