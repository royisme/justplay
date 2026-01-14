import { SidebarProvider } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import type { ReactNode } from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface SidebarLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  user?: UserData | null;
}

export function SidebarLayout({ sidebar, children, user }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900">
        <Sidebar user={user}>
            {sidebar}
        </Sidebar>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
