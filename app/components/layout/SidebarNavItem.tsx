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
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-bg-secondary",
          isActive ? "bg-bg-secondary text-accent" : "text-text-secondary",
          isCollapsed && "justify-center px-2"
        )
      }
    >
      {icon && <span className="shrink-0 text-lg">{icon}</span>}
      {!isCollapsed && <span className="truncate">{children}</span>}
    </NavLink>
  );
}
