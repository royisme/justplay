import { Outlet } from "react-router";
import { SidebarLayout } from "~/components/layout/SidebarLayout";
import { UserSidebar } from "~/components/layout/UserSidebar";

export default function AppLayout() {
  return (
    <SidebarLayout sidebar={<UserSidebar />}>
      <Outlet />
    </SidebarLayout>
  );
}
