/**
 * @file useStoryStream.ts
 * @description Hook for streaming story content from the AI with typewriter effect.
 * Uses AI SDK's streaming utilities for real-time text display.
 */

import { useState, useCallback, useRef } from "react";

export interface UseStoryStreamOptions {
  gameId: number;
  language?: string;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export interface UseStoryStreamReturn {
  streamedText: string;
  isStreaming: boolean;
  error: Error | null;
  streamChoice: (choiceText: string) => Promise<string>;
  reset: () => void;
}

/**
 * Hook for streaming story content with typewriter effect.
 * Uses the /api/game/stream endpoint for real-time AI text streaming.
 */
export function useStoryStream({
  gameId,
  language = "zh",
  onComplete,
  onError,
}: UseStoryStreamOptions): UseStoryStreamReturn {
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setStreamedText("");
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const streamChoice = useCallback(
    async (choiceText: string): Promise<string> => {
      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setStreamedText("");
      setIsStreaming(true);
      setError(null);

      let fullText = "";

      try {
        const response = await fetch("/api/game/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gameId,
            choiceText,
            language,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Stream request failed: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          // Parse AI SDK data stream format
          // Format: 0:"text chunk"\n
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                // Extract the JSON string after "0:"
                const jsonStr = line.slice(2);
                const text = JSON.parse(jsonStr);
                if (typeof text === "string") {
                  fullText += text;
                  setStreamedText(fullText);
                }
              } catch {
                // Skip malformed lines
              }
            }
          }
        }

        setIsStreaming(false);
        onComplete?.(fullText);
        return fullText;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Intentional abort, not an error
          return fullText;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsStreaming(false);
        onError?.(error);
        throw error;
      }
    },
    [gameId, language, onComplete, onError]
  );

  return {
    streamedText,
    isStreaming,
    error,
    streamChoice,
    reset,
  };
}

/**
 * Simple hook for typewriter effect on static text.
 * Useful for displaying non-streamed content with animation.
 */
export function useTypewriter(
  text: string,
  speed: number = 30
): {
  displayedText: string;
  isComplete: boolean;
  restart: () => void;
} {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const restart = useCallback(() => {
    indexRef.current = 0;
    setDisplayedText("");
    setIsComplete(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!text) {
      setIsComplete(true);
      return;
    }

    const intervalMs = 1000 / speed;

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setIsComplete(true);
      }
    }, intervalMs);
  }, [text, speed]);

  // Auto-start when text changes
  useState(() => {
    restart();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  });

  return {
    displayedText,
    isComplete,
    restart,
  };
}

export default useStoryStream;
