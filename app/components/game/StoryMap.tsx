/**
 * @file StoryMap.tsx
 * @description Visual story progress map showing chapters and volumes.
 * Displays the player's journey through the narrative.
 */

import { Map as MapIcon, ChevronRight, CheckCircle2, Circle, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import type { GameStatus, StoryMetadata } from "@shared/types/game";
import { useTranslation } from "react-i18next";

interface StoryMapGame {
  currentChapter: number;
  currentVolume: number;
  status: GameStatus | string;
  storyMetadata: StoryMetadata | null;
}

interface StoryMapMessage {
  role: string;
  chapterNumber: number | null;
}

interface StoryMapProps {
  game: StoryMapGame;
  history: StoryMapMessage[];
}

interface ChapterNode {
  chapter: number;
  messageCount: number;
  isCompleted: boolean;
  isCurrent: boolean;
}

export function StoryMap({ game, history }: StoryMapProps) {
  const { t } = useTranslation();
  // Build chapter nodes from history
  const chapterMap = new Map<number, number>();

  for (const msg of history) {
    if (msg.role !== "system") {
      const chapter = msg.chapterNumber ?? 1;
      chapterMap.set(chapter, (chapterMap.get(chapter) ?? 0) + 1);
    }
  }

  // Generate chapter nodes
  const chapters: ChapterNode[] = [];
  const chapterKeys = Array.from(chapterMap.keys());
  const maxChapter = chapterKeys.length > 0
    ? Math.max(game.currentChapter, ...chapterKeys)
    : game.currentChapter;

  for (let i = 1; i <= maxChapter; i++) {
    chapters.push({
      chapter: i,
      messageCount: chapterMap.get(i) ?? 0,
      isCompleted: i < game.currentChapter,
      isCurrent: i === game.currentChapter,
    });
  }

  // If no chapters yet, show at least chapter 1
  if (chapters.length === 0) {
    chapters.push({
      chapter: 1,
      messageCount: 0,
      isCompleted: false,
      isCurrent: true,
    });
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-700 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-zinc-100 text-lg">
          <MapIcon className="h-5 w-5 text-indigo-400" />
          {t("game.story_map.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Volume indicator */}
        <div className="flex items-center gap-2 mb-4 text-sm text-zinc-400">
          <BookOpen className="h-4 w-4" />
          <span>{t("game.story_map.volume", { volume: game.currentVolume })}</span>
        </div>

        {/* Chapter timeline */}
        <div className="space-y-3">
          {chapters.map((node, index) => (
            <div key={node.chapter} className="flex items-start gap-3">
              {/* Timeline line and node */}
              <div className="flex flex-col items-center">
                {node.isCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                ) : node.isCurrent ? (
                  <div className="relative">
                    <Circle className="h-6 w-6 text-indigo-500 flex-shrink-0" />
                    <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400 opacity-30" />
                  </div>
                ) : (
                  <Circle className="h-6 w-6 text-zinc-600 flex-shrink-0" />
                )}
                {index < chapters.length - 1 && (
                  <div className={`w-0.5 h-8 mt-1 ${
                    node.isCompleted ? "bg-green-500/50" : "bg-zinc-700"
                  }`} />
                )}
              </div>

              {/* Chapter content */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${
                  node.isCurrent
                    ? "text-indigo-400"
                    : node.isCompleted
                      ? "text-zinc-300"
                      : "text-zinc-500"
                }`}>
                  {t("game.story_map.chapter", { chapter: node.chapter })}
                  {node.isCurrent && (
                    <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                      {t("game.story_map.current")}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {node.messageCount > 0
                    ? t("game.story_map.message_count", { count: node.messageCount })
                    : t("game.story_map.not_started")}
                </div>
              </div>

              {/* Progress arrow for completed chapters */}
              {node.isCompleted && (
                <ChevronRight className="h-4 w-4 text-zinc-600 flex-shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>

        {/* Story metadata summary */}
        {game.storyMetadata && (
          <div className="mt-6 pt-4 border-t border-zinc-700">
            <div className="text-xs text-zinc-500 mb-2">{t("game.story_map.characters")}</div>
            <div className="flex flex-wrap gap-1">
              {game.storyMetadata.characters.slice(0, 5).map((char) => (
                <span
                  key={char.id}
                  className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                >
                  {char.name}
                </span>
              ))}
              {game.storyMetadata.characters.length > 5 && (
                <span className="text-xs text-zinc-500">
                  +{game.storyMetadata.characters.length - 5} {t("game.story_map.more")}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="mt-4 pt-4 border-t border-zinc-700">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>{t("game.story_map.progress")}</span>
            <span>{Math.round((game.currentChapter / Math.max(5, game.currentChapter + 2)) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (game.currentChapter / Math.max(5, game.currentChapter + 2)) * 100)}%`
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
