import { LogOut, Settings, User, Globe } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { Button } from "~/components/ui/Button";
import { Link, Form } from "react-router";
import { useTranslation } from "react-i18next";
import { setLanguageCookie } from "~/i18n";
import { DEFAULT_LANGUAGE, type SupportedLanguage } from "@shared/types/i18n";

/**
 * Language Switcher - A refined capsule-style toggle with smooth sliding indicator
 * Design: Minimal with a playful sliding animation
 */
function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language?.startsWith("zh") ? "zh" : "en") as SupportedLanguage;

  const handleToggle = async () => {
    const newLang: SupportedLanguage = currentLang === "zh" ? "en" : "zh";
    await i18n.changeLanguage(newLang);
    setLanguageCookie(newLang);
  };

  // Collapsed: Compact globe button with current language indicator
  if (collapsed) {
    return (
      <button
        onClick={handleToggle}
        className="group relative flex h-9 w-9 items-center justify-center rounded-lg
          bg-gradient-to-br from-zinc-100 to-zinc-200
          dark:from-zinc-800 dark:to-zinc-900
          hover:from-indigo-100 hover:to-indigo-200
          dark:hover:from-indigo-950 dark:hover:to-indigo-900
          transition-all duration-300 ease-out
          shadow-sm hover:shadow-md
          border border-zinc-200/50 dark:border-zinc-700/50"
        title={currentLang === "zh" ? "Switch to English" : "切换到中文"}
        aria-label="Toggle language"
      >
        <Globe className="h-4 w-4 text-zinc-600 dark:text-zinc-400
          group-hover:text-indigo-600 dark:group-hover:text-indigo-400
          transition-colors duration-200" />
        {/* Floating language badge */}
        <span className="absolute -bottom-0.5 -right-0.5
          flex h-3.5 w-3.5 items-center justify-center
          rounded-full bg-indigo-600 dark:bg-indigo-500
          text-[8px] font-bold text-white uppercase
          shadow-sm ring-1 ring-white dark:ring-zinc-900
          group-hover:scale-110 transition-transform duration-200">
          {currentLang === "zh" ? "中" : "E"}
        </span>
      </button>
    );
  }

  // Expanded: Elegant capsule toggle with sliding indicator
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Globe className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
      <div className="relative flex rounded-full
        bg-zinc-100 dark:bg-zinc-800
        border border-zinc-200/80 dark:border-zinc-700/80
        p-0.5 shadow-inner">
        {/* Sliding indicator */}
        <div
          className={`absolute top-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)]
            rounded-full bg-white dark:bg-zinc-700
            shadow-sm border border-zinc-200/50 dark:border-zinc-600/50
            transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${currentLang === "zh" ? "left-0.5" : "left-[calc(50%+1px)]"}`}
        />
        {/* Language buttons */}
        <button
          onClick={() => currentLang !== "zh" && handleToggle()}
          className={`relative z-10 px-3 py-1 text-xs font-medium rounded-full
            transition-colors duration-200
            ${currentLang === "zh"
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          aria-pressed={currentLang === "zh"}
        >
          中文
        </button>
        <button
          onClick={() => currentLang !== "en" && handleToggle()}
          className={`relative z-10 px-3 py-1 text-xs font-medium rounded-full
            transition-colors duration-200
            ${currentLang === "en"
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          aria-pressed={currentLang === "en"}
        >
          EN
        </button>
      </div>
    </div>
  );
}

interface SidebarFooterProps {
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
}

export function SidebarFooter({ user }: SidebarFooterProps) {
  const { isCollapsed } = useSidebar();
  const { t } = useTranslation();

  const userName = user?.name || "User";
  const userEmail = user?.email || "user@example.com";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="border-t p-3 dark:border-zinc-800">
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-2">
          <LanguageSwitcher collapsed />
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <User className="h-4 w-4" />
          </Button>
          <Form action="/auth/logout" method="post">
            <Button variant="ghost" size="icon" className="h-9 w-9" type="submit" title={t("sidebar.logout", "退出登录")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </Form>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Divider */}
          <div className="mx-3 my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* Settings Link */}
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
              text-zinc-500 transition-colors
              hover:bg-zinc-100 hover:text-zinc-900
              dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <Settings className="h-4 w-4" />
            <span>{t("sidebar.settings", "设置")}</span>
          </Link>

          {/* User Info */}
          <div className="flex items-center justify-between gap-2 px-2 pt-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full
                bg-gradient-to-br from-indigo-500 to-purple-600
                text-white text-xs font-semibold shadow-sm">
                {userInitial}
              </div>
              <div className="flex flex-col text-xs overflow-hidden">
                <span className="font-medium text-zinc-900 dark:text-zinc-50 truncate">{userName}</span>
                <span className="text-zinc-500 dark:text-zinc-400 truncate max-w-[100px]" title={userEmail}>{userEmail}</span>
              </div>
            </div>
            <Form action="/auth/logout" method="post">
              <Button
                variant="ghost"
                size="icon"
                type="submit"
                className="h-8 w-8 flex-shrink-0 text-zinc-500 hover:text-zinc-900
                  dark:text-zinc-400 dark:hover:text-zinc-50"
                title={t("sidebar.logout", "退出登录")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
