/**
 * @file GamePage.tsx
 * @description Game page component for playing the interactive novel.
 * Uses useFetcher for non-navigating form submissions to avoid full page reloads.
 * Extracted from game.$id route for better separation of concerns.
 * @module app/pages/GamePage
 */

import { useState, useCallback, useEffect } from "react";
import { useFetcher } from "react-router";
import { useTranslation } from "react-i18next";
import { StoryChat } from "~/components/views/StoryChat";
import { StoryMapView } from "~/components/views/StoryMapView";
import { ChoiceList } from "~/components/views/ChoiceList";
import { GameHeader } from "~/components/views/GameHeader";
import type {
  Game,
  SceneData,
  StoryMap,
  StoryHistoryEntry,
  AdvanceGameResponse,
  GENRE_THEME_MAP,
} from "@shared/types/game";

// --- Types ---

export interface GamePageProps {
  /** Game data from loader */
  game: Game;
  /** Additional class names */
  className?: string;
}

// --- Genre to Theme Mapping ---

const genreToTheme: Record<string, string> = {
  东方玄幻: "xuanhuan",
  西方魔幻: "magic",
  赛博朋克: "cyberpunk",
  悬疑解谜: "mystery",
  末世科幻: "scifi",
};

// --- Component ---

export function GamePage({ game, className = "" }: GamePageProps) {
  const { i18n } = useTranslation();
  const fetcher = useFetcher<AdvanceGameResponse>();

  // Local state
  const [showMap, setShowMap] = useState(false);
  const [storyHistory, setStoryHistory] = useState<StoryHistoryEntry[]>(
    (game.storyHistory as StoryHistoryEntry[]) || []
  );
  const [currentScene, setCurrentScene] = useState<SceneData>(
    (game.currentSceneJson as SceneData) || { content: "", choices: [], current_node_id: "start" }
  );
  const [lastError, setLastError] = useState<string | null>(null);

  const storyMap = (game.storyMap as StoryMap) || { nodes: [], edges: [] };
  const isLoading = fetcher.state === "submitting";

  // Set theme based on genre
  useEffect(() => {
    const theme = genreToTheme[game.storyType] || "default";
    document.documentElement.setAttribute("data-theme", theme);
  }, [game.storyType]);

  /**
   * Handle choice submission: add choice to history, submit to action
   */
  const handleChoiceSelect = useCallback(
    (choiceText: string) => {
      // Optimistic: immediately add user choice to visible history
      setStoryHistory((prev) => [...prev, { role: "user", content: choiceText }]);
      setLastError(null);

      // Submit to action (same route)
      const formData = new FormData();
      formData.append("choice", choiceText);
      formData.append("lng", i18n.language);

      fetcher.submit(formData, { method: "post" });
    },
    [i18n.language, fetcher]
  );

  /**
   * Handle fetcher response: when action returns new scene
   */
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success && fetcher.data.nextScene) {
        // Success: add AI's response and update choices
        const nextScene = fetcher.data.nextScene;
        setStoryHistory((prev) => [
          ...prev,
          { role: "assistant", content: nextScene.content },
        ]);
        setCurrentScene(nextScene);
        setLastError(null);
      } else if (!fetcher.data.success) {
        // Error: show message and remove the optimistic user choice
        const errorMsg = fetcher.data.error || "Failed to generate next scene.";
        setLastError(errorMsg);
        setStoryHistory((prev) => prev.slice(0, -1)); // Remove last (user) message
      }
    }
  }, [fetcher.state, fetcher.data]);

  // Toggle map visibility
  const handleToggleMap = useCallback(() => {
    setShowMap((prev) => !prev);
  }, []);

  return (
    <div
      className={`flex flex-col h-screen max-w-4xl mx-auto bg-background-secondary shadow-2xl overflow-hidden transition-colors duration-500 ${className}`}
    >
      {/* Header */}
      <GameHeader
        title={game.title || "Untitled Story"}
        author={game.author}
        storyType={game.storyType}
        showMap={showMap}
        onToggleMap={handleToggleMap}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
        {/* Story Chat */}
        <div
          className={`flex-1 flex flex-col h-full ${
            showMap ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Chat messages */}
          <StoryChat
            history={storyHistory}
            isLoading={isLoading}
            error={lastError}
          />

          {/* Choices Footer */}
          <div className="p-4 bg-background-primary border-t border-border shrink-0">
            {!isLoading && currentScene.choices && currentScene.choices.length > 0 && (
              <ChoiceList
                choices={currentScene.choices}
                onChoiceSelect={handleChoiceSelect}
                disabled={isLoading}
              />
            )}
          </div>
        </div>

        {/* Story Map Panel */}
        <StoryMapView
          storyMap={storyMap}
          currentNodeId={game.currentNodeId}
          isVisible={showMap}
          onClose={() => setShowMap(false)}
        />
      </div>
    </div>
  );
}

export default GamePage;
