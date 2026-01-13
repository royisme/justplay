import { BookOpen, Gamepad2, Plus, Rocket, Skull, Sword } from "lucide-react";
import { SidebarNavGroup } from "./SidebarNavGroup";
import { SidebarNavItem } from "./SidebarNavItem";

export function UserSidebar() {
  return (
    <>
      <SidebarNavGroup title="我的冒险" icon={<Gamepad2 className="h-4 w-4" />} defaultOpen={true}>
        <SidebarNavItem to="/game/123" icon={<Sword className="h-4 w-4" />}>
            黑暗森林 (V2-C3)
        </SidebarNavItem>
        <SidebarNavItem to="/game/456" icon={<Rocket className="h-4 w-4" />}>
            星际迷航 (开始)
        </SidebarNavItem>
        <SidebarNavItem to="/game/new" icon={<Plus className="h-4 w-4" />}>
            新游戏
        </SidebarNavItem>
      </SidebarNavGroup>

      <SidebarNavGroup title="藏书阁" icon={<BookOpen className="h-4 w-4" />} defaultOpen={false}>
        <SidebarNavItem to="/library/789" icon={<BookOpen className="h-4 w-4" />}>
            龙之谷 (2025-01)
        </SidebarNavItem>
        <SidebarNavItem to="/library/000" icon={<Skull className="h-4 w-4" />}>
             废土日记 (BAD)
        </SidebarNavItem>
      </SidebarNavGroup>
    </>
  );
}
