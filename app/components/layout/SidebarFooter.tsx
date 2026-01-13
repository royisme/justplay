import { LogOut, Settings, User } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { Button } from "~/components/ui/Button";
import { Link } from "react-router";

export function SidebarFooter() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="border-t p-3 dark:border-zinc-800">
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
                <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
           <Link to="/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
                <Settings className="h-4 w-4" />
                <span>设置</span>
           </Link>
           <div className="flex items-center justify-between gap-2 px-2">
               <div className="flex items-center gap-2">
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                       <User className="h-4 w-4" />
                   </div>
                   <div className="flex flex-col text-xs">
                       <span className="font-medium text-zinc-900 dark:text-zinc-50">User</span>
                       <span className="text-zinc-500 dark:text-zinc-400">user@example.com</span>
                   </div>
               </div>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                   <LogOut className="h-4 w-4" />
               </Button>
           </div>
        </div>
      )}
    </div>
  );
}
