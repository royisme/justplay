import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { useSidebar } from "./SidebarContext";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarFooter } from "./SidebarFooter";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { ReactNode } from "react";

export function Sidebar({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? "4rem" : "16rem" }}
      className={cn(
        "flex h-screen flex-col border-r bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 dark:border-zinc-800",
        "transition-all duration-300 ease-in-out"
      )}
    >
      <SidebarHeader />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-2">
            {children}
        </nav>
      </ScrollArea>
      <SidebarFooter />
    </motion.div>
  );
}
