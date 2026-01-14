/**
 * @file audit.tsx
 * @description Admin audit log page - displays game activity and content monitoring.
 */

import { useLoaderData } from "react-router";
import { desc, eq } from "drizzle-orm";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { games, messages, user } from "@server/db/schema";
import type { Route } from "./+types/audit";
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

export async function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);

  // Get recent games with user info
  const recentGames = await db
    .select({
      id: games.id,
      title: games.title,
      status: games.status,
      createdAt: games.createdAt,
      userId: games.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(games)
    .leftJoin(user, eq(games.userId, user.id))
    .orderBy(desc(games.createdAt))
    .limit(20);

  // Get recent messages (for content audit)
  const recentMessages = await db
    .select({
      id: messages.id,
      gameId: messages.gameId,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.role, "assistant"))
    .orderBy(desc(messages.createdAt))
    .limit(10);

  // Get stats
  const totalGames = await db.select().from(games);
  const activeGames = totalGames.filter(g => g.status === "active");
  const completedGames = totalGames.filter(g => g.status === "completed");

  return {
    recentGames,
    recentMessages,
    stats: {
      totalGames: totalGames.length,
      activeGames: activeGames.length,
      completedGames: completedGames.length,
    },
  };
}

export default function AuditPage() {
  const { t } = useTranslation();
  const { recentGames, recentMessages, stats } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.audit.title")}</h1>
        <p className="text-muted-foreground">{t("admin.audit.subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.common.total_games")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalGames}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.audit.active_games")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.activeGames}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.audit.completed_games")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.completedGames}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Games */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.audit.recent_game_activity")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentGames.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.audit.game")}</TableHead>
                  <TableHead>{t("admin.audit.user")}</TableHead>
                  <TableHead>{t("admin.common.status")}</TableHead>
                  <TableHead>{t("admin.common.created_at")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentGames.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell className="font-medium">{game.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {game.userName || game.userEmail || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          game.status === "active"
                            ? "default"
                            : game.status === "completed"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {game.status === "active" ? t("admin.dashboard.status_active") :
                         game.status === "completed" ? t("admin.dashboard.status_completed") :
                         game.status === "abandoned" ? t("admin.dashboard.status_abandoned") :
                         game.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {game.createdAt ? new Date(game.createdAt).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.audit.no_activity")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent AI Content */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.audit.recent_ai_content")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMessages.length > 0 ? (
            <div className="space-y-4">
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      Game: {msg.gameId.slice(0, 8)}...
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "-"}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-3">{msg.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.audit.no_content")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
