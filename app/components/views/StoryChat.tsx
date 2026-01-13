/**
 * @file StoryChat.tsx
 * @description Story chat view with streaming text support and Motion animations.
 * Displays story history and real-time AI streaming content.
 */

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "~/lib/utils";
import type { StoryHistoryEntry } from "@shared/types/game";
import { Markdown } from "~/components/ui/Markdown";
import { StreamingText } from "~/components/motion/TypewriterText";

export interface StoryChatProps {
  history: StoryHistoryEntry[];
  isTyping?: boolean;
  streamingText?: string;
  isStreaming?: boolean;
}

export function StoryChat({
  history,
  isTyping,
  streamingText,
  isStreaming,
}: StoryChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isTyping, streamingText]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-3xl mx-auto w-full space-y-8 scroll-smooth"
    >
      <AnimatePresence mode="sync">
        {history.map((entry, index) => (
          <motion.div
            key={`${index}-${entry.role}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.4,
              delay: index === history.length - 1 ? 0.1 : 0,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className={cn(
              "flex flex-col",
              entry.role === "user" ? "items-end" : "items-start",
            )}
          >
            {entry.role === "user" ? (
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="px-5 py-2 rounded-2xl bg-secondary/10 text-text-secondary italic font-serif text-base max-w-[85%] border border-transparent hover:bg-secondary/15 transition-colors"
              >
                {entry.content}
              </motion.div>
            ) : (
              <div className="prose prose-lg prose-p:font-serif prose-headings:font-serif max-w-none text-text-primary leading-relaxed">
                <Markdown>{entry.content}</Markdown>
              </div>
            )}
          </motion.div>
        ))}

        {/* Streaming content */}
        {isStreaming && streamingText && (
          <motion.div
            key="streaming"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-start"
          >
            <div className="prose prose-lg prose-p:font-serif prose-headings:font-serif max-w-none text-text-primary leading-relaxed">
              <StreamingText
                text={streamingText}
                isStreaming={isStreaming}
                className="whitespace-pre-wrap"
              />
            </div>
          </motion.div>
        )}

        {/* Typing indicator */}
        {isTyping && !isStreaming && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-2 p-4"
          >
            <TypingIndicator />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} className="h-4" />
    </div>
  );
}

/**
 * Animated typing indicator with bouncing dots
 */
function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1.5 px-4 py-2 bg-muted/30 rounded-full">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-text-secondary/50 rounded-full"
          animate={{
            y: [0, -6, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default StoryChat;
