/**
 * @file settings.tsx
 * @description User settings page for PixelWeaver.
 * Allows users to adjust display preferences (font, theme).
 */

import { redirect, useLoaderData, Form, useNavigation } from "react-router";
import { Settings, Moon, Sun, Palette } from "lucide-react";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import type { Route } from "./+types/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) return redirect("/login");

  return {
    user: session.user,
  };
}

export default function SettingsPage() {
  const { user } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="container mx-auto max-w-3xl py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">设置</h1>
          <p className="text-muted-foreground">调整你的显示偏好</p>
        </div>
      </div>

      {/* Profile Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>个人资料</CardTitle>
          <CardDescription>你的账户信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                用户名
              </label>
              <div className="text-lg font-medium">{user.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                邮箱
              </label>
              <div className="text-lg font-medium">{user.email}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>主题设置</CardTitle>
          <CardDescription>选择你喜欢的显示主题</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
            >
              <Moon className="h-6 w-6" />
              <span className="font-medium">深色模式</span>
              <span className="text-xs text-muted-foreground">默认主题</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-indigo-300 transition-colors"
            >
              <Sun className="h-6 w-6" />
              <span className="font-medium">浅色模式</span>
              <span className="text-xs text-muted-foreground">明亮风格</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-indigo-300 transition-colors"
            >
              <Palette className="h-6 w-6" />
              <span className="font-medium">跟随系统</span>
              <span className="text-xs text-muted-foreground">自动切换</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Font Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>字体设置</CardTitle>
          <CardDescription>调整阅读时的字体大小</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">A-</Button>
            <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full">
              <div className="h-full w-1/2 bg-indigo-500 rounded-full" />
            </div>
            <Button variant="outline" size="sm">A+</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            当前: 标准 (16px)
          </p>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>通知偏好</CardTitle>
          <CardDescription>管理你的通知设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">游戏提醒</div>
              <div className="text-sm text-muted-foreground">
                当你的游戏有更新时发送邮件提醒
              </div>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5"
              defaultChecked
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">新功能通知</div>
              <div className="text-sm text-muted-foreground">
                了解 PixelWeaver 的最新功能
              </div>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5"
              defaultChecked
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        更多设置功能即将推出
      </div>
    </div>
  );
}
