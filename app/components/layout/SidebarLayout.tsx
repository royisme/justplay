import { SidebarProvider } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
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
      <div className="flex h-screen overflow-hidden bg-bg-primary">
        <Sidebar user={user}>
            {sidebar}
        </Sidebar>
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
