/**
 * @file StoryChat.tsx
 * @description Story chat view component displaying the conversation history.
 * Extracted from game route for better separation of concerns.
 * @module app/components/views/StoryChat
 */

import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import type { StoryHistoryEntry } from "@shared/types/game";

// --- Types ---

export interface StoryChatProps {
  /** Story history messages */
  history: StoryHistoryEntry[];
  /** Whether a new message is being generated */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Additional class names */
  className?: string;
}

// --- Component ---

export function StoryChat({
  history,
  isLoading = false,
  error = null,
  className = "",
}: StoryChatProps) {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  return (
    <div
      className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent ${className}`}
    >
      {/* Story messages */}
      {history.map((msg, idx) => (
        <div
          key={idx}
          className={`flex flex-col max-w-[90%] ${
            msg.role === "user"
              ? "self-end items-end"
              : "self-start items-start"
          }`}
        >
          <div
            className={`rounded-2xl px-5 py-3 shadow-sm text-base leading-relaxed ${
              msg.role === "user"
                ? "bg-accent text-white rounded-br-none"
                : "bg-background-primary border border-border rounded-bl-none text-text-primary"
            }`}
          >
            {msg.role === "assistant" ? (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="self-start max-w-[90%] animate-pulse">
          <div className="rounded-2xl px-5 py-3 bg-background-primary border border-border rounded-bl-none text-text-secondary italic">
            {t("game.generating", "Writing next chapter...")}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="self-start max-w-[90%]">
          <div className="rounded-2xl px-5 py-3 bg-red-500/10 border border-red-500/30 rounded-bl-none text-red-600 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default StoryChat;
