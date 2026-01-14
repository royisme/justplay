/**
 * @file TopNav.tsx
 * @description 顶部导航栏 - 右侧显示语言切换和主题切换
 * @module app/components/layout/TopNav
 */

import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { LanguageToggle } from "~/components/ui/LanguageToggle";

export function TopNav() {
  return (
    <div className="h-14 border-b border-border bg-surface px-6 flex items-center justify-end">
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}

export default TopNav;
