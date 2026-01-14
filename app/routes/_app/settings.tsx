/**
 * @file settings.tsx
 * @description User settings page for PixelWeaver (Ink & Gold Redesign).
 * Allows users to adjust display preferences (font, theme) with persistence.
 */

import { redirect, useLoaderData, useNavigation } from "react-router";
import { Settings as SettingsIcon, Moon, Sun, Monitor, Type, User } from "lucide-react";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { createAuth } from "@server/auth/auth";
import type { Route } from "./+types/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useTheme } from "~/components/theme-provider";
import { useEffect, useState } from "react";

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
  const { theme, setTheme } = useTheme();
  
  // Font scale state (local for now, could be moved to context)
  const [fontScale, setFontScale] = useState(1);
  
  // Initialize font scale from CSS var if possible, or default to 1
  useEffect(() => {
    const root = document.documentElement;
    const currentScale = getComputedStyle(root).getPropertyValue('--text-scale');
    if (currentScale) {
        setFontScale(parseFloat(currentScale));
    }
  }, []);

  const handleFontScaleChange = (newScale: number) => {
    setFontScale(newScale);
    document.documentElement.style.setProperty('--text-scale', newScale.toString());
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-6">
      <header className="mb-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-accent" strokeWidth={1.5} />
          <h1 className="text-4xl font-serif font-bold text-text-primary">设置</h1>
        </div>
        <p className="text-text-secondary text-lg ml-11 font-serif">配置你的个人偏好与阅读体验</p>
      </header>

      <div className="space-y-8 animate-slide-up stagger-1">
        {/* Profile Section */}
        <Card variant="paper" className="border-accent/20">
          <CardHeader>
            <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-accent" />
                <CardTitle>个人资料</CardTitle>
            </div>
            <CardDescription>你的账户基本信息（只读）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary font-serif">
                  用户名
                </label>
                <div className="text-lg font-serif font-medium text-text-primary bg-surface/50 p-3 rounded-md border border-border/50">
                    {user.name}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary font-serif">
                  邮箱
                </label>
                <div className="text-lg font-serif font-medium text-text-primary bg-surface/50 p-3 rounded-md border border-border/50">
                    {user.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Section */}
        <Card>
          <CardHeader>
             <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-accent" />
                <CardTitle>显示主题</CardTitle>
            </div>
            <CardDescription>选择最适合你的阅读环境</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant={theme === "dark" ? "choice" : "outline"}
                className={theme === "dark" ? "border-accent bg-accent/5 ring-1 ring-accent" : ""}
                onClick={() => setTheme("dark")}
              >
                <div className="flex flex-col items-center gap-3 py-2">
                  <Moon className="h-6 w-6" />
                  <span className="font-serif">深色漆器</span>
                </div>
              </Button>
              <Button
                variant={theme === "light" ? "choice" : "outline"}
                className={theme === "light" ? "border-accent bg-accent/5 ring-1 ring-accent" : ""}
                onClick={() => setTheme("light")}
              >
                 <div className="flex flex-col items-center gap-3 py-2">
                  <Sun className="h-6 w-6" />
                  <span className="font-serif">暖色宣纸</span>
                </div>
              </Button>
              <Button
                variant={theme === "system" ? "choice" : "outline"}
                className={theme === "system" ? "border-accent bg-accent/5 ring-1 ring-accent" : ""}
                onClick={() => setTheme("system")}
              >
                 <div className="flex flex-col items-center gap-3 py-2">
                  <Monitor className="h-6 w-6" />
                  <span className="font-serif">跟随系统</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Font Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-accent" />
                <CardTitle>字体大小</CardTitle>
            </div>
            <CardDescription>调整全局文字大小以提升阅读体验</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-serif text-text-secondary">小</span>
                    <input 
                        type="range" 
                        min="0.8" 
                        max="1.2" 
                        step="0.05" 
                        value={fontScale}
                        onChange={(e) => handleFontScaleChange(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                    <span className="text-lg font-serif text-text-primary">大</span>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-border/50">
                    <p className="text-text-primary font-serif leading-relaxed">
                        “智者乐水，仁者乐山。” —— 这是一段预览文本。调整滑块以查看字体大小在阅读界面的实际效果。
                        (Current Scale: {fontScale.toFixed(2)}x)
                    </p>
                </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
            <p className="text-sm text-text-secondary font-serif italic opacity-60">
                PixelWeaver v1.0 • Ink & Gold Edition
            </p>
        </div>
      </div>
    </div>
  );
}
