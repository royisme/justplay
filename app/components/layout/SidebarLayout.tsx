import { SidebarProvider } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import type { ReactNode } from "react";

interface SidebarLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function SidebarLayout({ sidebar, children }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900">
        <Sidebar>
            {sidebar}
        </Sidebar>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
