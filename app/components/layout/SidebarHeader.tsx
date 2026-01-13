import { ChevronsLeft, ChevronsRight, Command } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { Button } from "~/components/ui/Button";

export function SidebarHeader() {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex h-14 items-center border-b px-3 dark:border-zinc-800">
      <div className={`flex w-full items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Command className="h-5 w-5" />
            </div>
            <span>PixelWeaver</span>
          </div>
        )}

        {isCollapsed && (
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white" onClick={toggleSidebar}>
               <Command className="h-5 w-5" />
             </div>
        )}

        {!isCollapsed && (
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
               <ChevronsLeft className="h-4 w-4" />
             </Button>
        )}
      </div>
    </div>
  );
}
