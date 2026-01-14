import { BookOpen, Gamepad2, Plus, Skull, Sword, Rocket, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SidebarNavGroup } from "./SidebarNavGroup";
import { SidebarNavItem } from "./SidebarNavItem";

// Type for games returned from the loader (matches DB schema)
interface GameData {
  id: string;
  title: string;
  currentVolume: number;
  currentChapter: number;
  bookMetadata?: {
    coverImage: string;
    wordCount: number;
    endingType: string;
  } | null;
}

interface UserSidebarProps {
  activeGames: GameData[];
  completedGames: GameData[];
}

// Simple icon selection based on story type or random
const gameIcons = [Sword, Rocket, Wand2, Skull];
const getGameIcon = (index: number) => {
  const Icon = gameIcons[index % gameIcons.length];
  return <Icon className="h-4 w-4" />;
};

export function UserSidebar({ activeGames, completedGames }: UserSidebarProps) {
  const { t } = useTranslation();
  const maxSlots = 3;
  const hasEmptySlot = activeGames.length < maxSlots;

  return (
    <>
      <SidebarNavGroup title={t("sidebar.my_adventures")} icon={<Gamepad2 className="h-4 w-4" />} defaultOpen={true}>
        {activeGames.map((game, index) => (
          <SidebarNavItem
            key={game.id}
            to={`/game/${game.id}`}
            icon={getGameIcon(index)}
          >
            {game.title} (V{game.currentVolume}-C{game.currentChapter})
          </SidebarNavItem>
        ))}
        {hasEmptySlot && (
          <SidebarNavItem to="/game/new" icon={<Plus className="h-4 w-4" />}>
            {t("sidebar.new_game")}
          </SidebarNavItem>
        )}
      </SidebarNavGroup>

      <SidebarNavGroup title={t("sidebar.library")} icon={<BookOpen className="h-4 w-4" />} defaultOpen={false}>
        {completedGames.map((game) => (
          <SidebarNavItem
            key={game.id}
            to={`/library/${game.id}`}
            icon={
              game.bookMetadata?.endingType === "Bad" ? (
                <Skull className="h-4 w-4" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )
            }
          >
            {game.title}
          </SidebarNavItem>
        ))}
        {completedGames.length === 0 && (
          <div className="px-3 py-2 text-xs text-zinc-500">{t("sidebar.no_completed_stories")}</div>
        )}
      </SidebarNavGroup>
    </>
  );
}
