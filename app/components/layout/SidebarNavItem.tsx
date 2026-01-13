import { NavLink } from "react-router";
import { cn } from "~/lib/utils";
import { useSidebar } from "./SidebarContext";
import type { ReactNode } from "react";

interface SidebarNavItemProps {
  to: string;
  icon?: ReactNode;
  children: ReactNode;
  end?: boolean;
}

export function SidebarNavItem({ to, icon, children, end }: SidebarNavItemProps) {
  const { isCollapsed } = useSidebar();

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800",
          isActive ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-400",
          isCollapsed && "justify-center px-2"
        )
      }
    >
      {icon && <span className="shrink-0 text-lg">{icon}</span>}
      {!isCollapsed && <span className="truncate">{children}</span>}
    </NavLink>
  );
}
