/**
 * @file TypewriterText.tsx
 * @description Typewriter effect component for streaming AI text.
 * Uses motion for smooth character reveal animations.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface TypewriterTextProps {
  text: string;
  speed?: number; // characters per second
  onComplete?: () => void;
  className?: string;
  cursor?: boolean;
}

export function TypewriterText({
  text,
  speed = 30,
  onComplete,
  className = "",
  cursor = true,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    setIsComplete(false);
    indexRef.current = 0;

    if (!text) return;

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
        onComplete?.();
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      <AnimatePresence>
        {cursor && !isComplete && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="inline-block w-0.5 h-[1.1em] bg-accent ml-0.5 align-middle"
            style={{
              animation: "blink 1s step-end infinite",
            }}
          />
        )}
      </AnimatePresence>
    </span>
  );
}

/**
 * StreamingText - For real-time streaming text that grows
 */
export interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

export function StreamingText({
  text,
  isStreaming = false,
  className = "",
}: StreamingTextProps) {
  const prevLengthRef = useRef(0);
  const [newChars, setNewChars] = useState("");

  useEffect(() => {
    if (text.length > prevLengthRef.current) {
      const newPart = text.slice(prevLengthRef.current);
      setNewChars(newPart);

      // Clear highlight after animation
      const timer = setTimeout(() => {
        setNewChars("");
      }, 100);

      prevLengthRef.current = text.length;
      return () => clearTimeout(timer);
    }
  }, [text]);

  const existingText = text.slice(0, text.length - newChars.length);

  return (
    <span className={className}>
      {existingText}
      <motion.span
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="text-accent"
      >
        {newChars}
      </motion.span>
      {isStreaming && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-[1.1em] bg-accent ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

export default TypewriterText;
