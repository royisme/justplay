/**
 * @file admin/_index.tsx
 * @description Admin dashboard with statistics.
 * @module routes/admin/_index
 */

import { useLoaderData } from "react-router";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { games, user, providers, promptTemplates } from "@server/db/schema";
import { count, eq } from "drizzle-orm";
import type { Route } from "./+types/_index";

// --- Loader ---

export async function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);

  const [gamesCount] = await db.select({ count: count() }).from(games);
  const [usersCount] = await db.select({ count: count() }).from(user);
  const [providersCount] = await db
    .select({ count: count() })
    .from(providers)
    .where(eq(providers.isActive, true));
  const [promptsCount] = await db
    .select({ count: count() })
    .from(promptTemplates)
    .where(eq(promptTemplates.isActive, true));

  return {
    stats: {
      games: gamesCount.count,
      users: usersCount.count,
      providers: providersCount.count,
      prompts: promptsCount.count,
    },
  };
}

// --- Component ---

export default function AdminDashboard() {
  const { stats } = useLoaderData<typeof loader>();

  const statCards = [
    { label: "Total Games", value: stats.games, color: "bg-blue-500" },
    { label: "Users", value: stats.users, color: "bg-green-500" },
    { label: "Active Providers", value: stats.providers, color: "bg-purple-500" },
    { label: "Prompt Templates", value: stats.prompts, color: "bg-orange-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-background-secondary rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg opacity-20`} />
              <div>
                <p className="text-3xl font-bold text-text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-text-secondary">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-background-secondary rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <a
              href="/admin/providers"
              className="block p-4 bg-background-primary rounded-lg border border-border hover:border-accent transition-colors"
            >
              <p className="font-medium text-text-primary">Add Provider</p>
              <p className="text-sm text-text-secondary">
                Configure a new LLM provider
              </p>
            </a>
            <a
              href="/admin/prompts"
              className="block p-4 bg-background-primary rounded-lg border border-border hover:border-accent transition-colors"
            >
              <p className="font-medium text-text-primary">Manage Prompts</p>
              <p className="text-sm text-text-secondary">
                Edit story type prompts
              </p>
            </a>
            <a
              href="/admin/playground"
              className="block p-4 bg-background-primary rounded-lg border border-border hover:border-accent transition-colors"
            >
              <p className="font-medium text-text-primary">Test Playground</p>
              <p className="text-sm text-text-secondary">
                Try prompts with different models
              </p>
            </a>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-background-secondary rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            System Info
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Runtime</dt>
              <dd className="text-text-primary font-mono text-sm">
                Cloudflare Workers
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Database</dt>
              <dd className="text-text-primary font-mono text-sm">
                Cloudflare D1
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">AI SDK</dt>
              <dd className="text-text-primary font-mono text-sm">
                Vercel AI SDK
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
