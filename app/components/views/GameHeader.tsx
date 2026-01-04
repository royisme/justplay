/**
 * @file GameHeader.tsx
 * @description Game header view component with title, metadata, and controls.
 * Extracted from game route for better separation of concerns.
 * @module app/components/views/GameHeader
 */

import { MapTrifold, Scroll } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "~/components/ui/LanguageToggle";

// --- Types ---

export interface GameHeaderProps {
  /** Game title */
  title: string;
  /** Author name */
  author: string | null;
  /** Story type/genre */
  storyType: string;
  /** Whether the map is currently shown */
  showMap: boolean;
  /** Callback to toggle map visibility */
  onToggleMap: () => void;
  /** Additional class names */
  className?: string;
}

// --- Component ---

export function GameHeader({
  title,
  author,
  storyType,
  showMap,
  onToggleMap,
  className = "",
}: GameHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className={`p-4 bg-background-primary border-b border-border flex justify-between items-center z-10 shrink-0 ${className}`}
    >
      {/* Game info */}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold truncate max-w-xs md:max-w-md text-text-primary">
          {title}
        </h1>
        <p className="text-sm text-text-secondary">
          {author && `${author} · `}
          {storyType}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2 items-center shrink-0">
        {/* Language Toggle - hidden on small screens */}
        <div className="hidden sm:flex">
          <LanguageToggle size="sm" />
        </div>

        {/* Map Toggle */}
        <button
          type="button"
          onClick={onToggleMap}
          className="p-2 rounded-full hover:bg-background-secondary text-text-secondary transition-colors"
          title={t("game.toggle_map", "Map")}
          aria-label={showMap ? "Hide story map" : "Show story map"}
          aria-pressed={showMap}
        >
          {showMap ? <Scroll size={24} /> : <MapTrifold size={24} />}
        </button>
      </div>
    </header>
  );
}

export default GameHeader;
