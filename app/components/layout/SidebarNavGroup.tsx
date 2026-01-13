import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { cn } from "~/lib/utils";

interface SidebarNavGroupProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function SidebarNavGroup({ title, icon, children, defaultOpen = true }: SidebarNavGroupProps) {
  const { isCollapsed } = useSidebar();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // When collapsed, we might want to show a tooltip or handle differently
  // For now, we'll just hide the group title and show children if it makes sense,
  // or maybe just show the icon as a trigger.
  // A common pattern is to just show the items if they have icons, or hide the group structure.

  if (isCollapsed) {
    return (
      <div className="space-y-1 py-2">
         {/* In collapsed mode, we just render children directly, assuming they handle their own collapsed state */}
        {children}
      </div>
    );
  }

  return (
    <div className="py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1 px-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
