import { BarChart3, Globe, Settings2, ShieldAlert, Users } from "lucide-react";
import { SidebarNavGroup } from "./SidebarNavGroup";
import { SidebarNavItem } from "./SidebarNavItem";

export function AdminSidebar() {
  return (
    <>
      <SidebarNavItem to="/admin" icon={<BarChart3 className="h-4 w-4" />} end>
        仪表盘
      </SidebarNavItem>

      <SidebarNavGroup title="世界构建器" icon={<Globe className="h-4 w-4" />} defaultOpen={true}>
        <SidebarNavItem to="/admin/scenarios" icon={<Globe className="h-4 w-4" />}>
           预设剧本库
        </SidebarNavItem>
         <SidebarNavItem to="/admin/scenarios/config" icon={<Settings2 className="h-4 w-4" />}>
           全局配置
        </SidebarNavItem>
      </SidebarNavGroup>

      <SidebarNavGroup title="AI 配置" icon={<Settings2 className="h-4 w-4" />} defaultOpen={false}>
        <SidebarNavItem to="/admin/providers" icon={<Settings2 className="h-4 w-4" />}>
           Providers
        </SidebarNavItem>
         <SidebarNavItem to="/admin/models" icon={<Settings2 className="h-4 w-4" />}>
           模型路由
        </SidebarNavItem>
      </SidebarNavGroup>

      <SidebarNavItem to="/admin/users" icon={<Users className="h-4 w-4" />}>
        用户管理
      </SidebarNavItem>

      <SidebarNavItem to="/admin/audit" icon={<ShieldAlert className="h-4 w-4" />}>
        内容审计
      </SidebarNavItem>
    </>
  );
}
