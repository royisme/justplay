/**
 * @file ThemeToggle.tsx
 * @description 主题切换组件 - 单按钮循环切换 Light/Dark/System
 * @module app/components/ui/ThemeToggle
 */

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "~/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // 循环切换主题：light → dark → system → light
  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  // 根据当前主题显示对应图标
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = theme === "light" ? "浅色模式" : theme === "dark" ? "深色模式" : "跟随系统";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="flex items-center justify-center h-10 px-4 border border-border rounded-lg bg-surface text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export default ThemeToggle;
