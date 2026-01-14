import { LogOut, Settings, User } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { Button } from "~/components/ui/Button";
import { Link, Form } from "react-router";
import { useTranslation } from "react-i18next";



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
    <div className="border-t p-3 border-border">
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-2">

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
          {/* Settings Link */}
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
              text-text-secondary transition-colors
              hover:bg-bg-secondary hover:text-text-primary"
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
                <span className="font-medium text-text-primary truncate">{userName}</span>
                <span className="text-text-secondary truncate max-w-[100px]" title={userEmail}>{userEmail}</span>
              </div>
            </div>
            <Form action="/auth/logout" method="post">
              <Button
                variant="ghost"
                size="icon"
                type="submit"
                className="h-8 w-8 flex-shrink-0 text-text-secondary hover:text-text-primary"
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
