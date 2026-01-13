/**
 * @file GamePage.tsx
 * @description Game page component with PixiJS background, streaming AI text, and Motion animations.
 * Features immersive particle effects, real-time text streaming, and smooth transitions.
 * @module app/pages/GamePage
 */

import { useState, useCallback, useEffect } from "react";
import { useFetcher } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { StoryChat } from "~/components/views/StoryChat";
import { StoryMapView } from "~/components/views/StoryMapView";
import { ChoiceList } from "~/components/views/ChoiceList";
import { GameHeader } from "~/components/views/GameHeader";
import { PixiBackground } from "~/components/engine/PixiBackground";
import { PageTransition } from "~/components/motion/PageTransition";
import { useStoryStream } from "~/hooks/useStoryStream";
import type {
  Game,
  SceneData,
  StoryMap,
  StoryHistoryEntry,
  AdvanceGameResponse,
} from "@shared/types/game";

// --- Types ---

export interface GamePageProps {
  game: Game;
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
    (game.storyHistory as StoryHistoryEntry[]) || [],
  );
  const [currentScene, setCurrentScene] = useState<SceneData>(
    (game.currentSceneJson as SceneData) || {
      content: "",
      choices: [],
      current_node_id: "start",
    },
  );
  const [useStreaming, setUseStreaming] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const storyMap = (game.storyMap as StoryMap) || { nodes: [], edges: [] };
  const theme = genreToTheme[game.storyType] || "default";
  const isLoading = fetcher.state === "submitting";

  // Streaming hook
  const {
    streamedText,
    isStreaming,
    streamChoice,
    reset: resetStream,
  } = useStoryStream({
    gameId: game.id,
    language: i18n.language,
    onComplete: (fullText) => {
      // After streaming completes, add to history and fetch choices
      setStoryHistory((prev) => [
        ...prev,
        { role: "assistant", content: fullText },
      ]);
      resetStream();
      // Fetch the updated scene with choices using the fetcher
      fetchChoices(fullText);
    },
    onError: () => {
      // Fall back to non-streaming mode on error
      setUseStreaming(false);
    },
  });

  // Client-only rendering for PixiJS
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set theme based on genre
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /**
   * Fetch choices after streaming completes
   */
  const fetchChoices = useCallback(
    (storyContent: string) => {
      const formData = new FormData();
      formData.append("choice", "__fetch_choices__");
      formData.append("lng", i18n.language);
      formData.append("content", storyContent);
      fetcher.submit(formData, { method: "post" });
    },
    [i18n.language, fetcher],
  );

  /**
   * Handle choice submission with streaming or fallback
   */
  const handleChoiceSelect = useCallback(
    async (choiceText: string) => {
      // Add user choice to history immediately
      setStoryHistory((prev) => [
        ...prev,
        { role: "user", content: choiceText },
      ]);

      if (useStreaming) {
        // Use streaming mode
        try {
          await streamChoice(choiceText);
        } catch {
          // Fall back to non-streaming on error
          setUseStreaming(false);
          submitNonStreaming(choiceText);
        }
      } else {
        // Non-streaming mode
        submitNonStreaming(choiceText);
      }
    },
    [useStreaming, streamChoice],
  );

  /**
   * Non-streaming fallback submission
   */
  const submitNonStreaming = useCallback(
    (choiceText: string) => {
      const formData = new FormData();
      formData.append("choice", choiceText);
      formData.append("lng", i18n.language);
      fetcher.submit(formData, { method: "post" });
    },
    [i18n.language, fetcher],
  );

  /**
   * Handle fetcher response for non-streaming mode
   */
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success && fetcher.data.nextScene) {
        const nextScene = fetcher.data.nextScene;
        // Only add to history if not using streaming (streaming adds via callback)
        if (!useStreaming) {
          setStoryHistory((prev) => [
            ...prev,
            { role: "assistant", content: nextScene.content },
          ]);
        }
        setCurrentScene(nextScene);
      } else if (!fetcher.data.success) {
        // Error: remove optimistic user choice
        setStoryHistory((prev) => prev.slice(0, -1));
      }
    }
  }, [fetcher.state, fetcher.data, useStreaming]);

  // Toggle map visibility
  const handleToggleMap = useCallback(() => {
    setShowMap((prev) => !prev);
  }, []);

  const showChoices =
    !isLoading &&
    !isStreaming &&
    currentScene.choices &&
    currentScene.choices.length > 0;

  return (
    <PageTransition variant="fade" className="h-screen">
      {/* PixiJS Background - Client only */}
      {isClient && <PixiBackground theme={theme} className="opacity-50" />}

      <div
        className={`relative z-10 flex flex-col h-screen max-w-4xl mx-auto bg-background-secondary/95 backdrop-blur-sm shadow-2xl overflow-hidden transition-colors duration-500 ${className}`}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GameHeader
            title={game.title || "Untitled Story"}
            author={game.author}
            storyType={game.storyType}
            showMap={showMap}
            onToggleMap={handleToggleMap}
          />
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
          {/* Story Chat */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`flex-1 flex flex-col h-full ${
              showMap ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Chat messages with streaming support */}
            <StoryChat
              history={storyHistory}
              isTyping={isLoading && !isStreaming}
              streamingText={streamedText}
              isStreaming={isStreaming}
            />

            {/* Choices Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="p-4 bg-background-primary/80 backdrop-blur-sm border-t border-border shrink-0"
            >
              <AnimatePresence mode="wait">
                {showChoices && (
                  <ChoiceList
                    choices={currentScene.choices}
                    onSelect={handleChoiceSelect}
                    disabled={isLoading || isStreaming}
                    isLoading={isLoading}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Story Map Panel */}
          <AnimatePresence>
            {showMap && (
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <StoryMapView
                  storyMap={storyMap}
                  currentNodeId={game.currentNodeId}
                  isVisible={showMap}
                  onClose={() => setShowMap(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}

export default GamePage;
