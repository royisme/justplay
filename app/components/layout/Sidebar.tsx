import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { useSidebar } from "./SidebarContext";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarFooter } from "./SidebarFooter";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { ReactNode } from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface SidebarProps {
  children: ReactNode;
  user?: UserData | null;
}

export function Sidebar({ children, user }: SidebarProps) {
  const { isCollapsed } = useSidebar();

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? "4rem" : "16rem" }}
      className={cn(
        "flex h-screen flex-col border-r bg-surface text-text-primary border-border",
        "transition-all duration-300 ease-in-out"
      )}
    >
      <SidebarHeader />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-2">
            {children}
        </nav>
      </ScrollArea>
      <SidebarFooter user={user} />
    </motion.div>
  );
}
