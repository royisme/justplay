/**
 * @file LoadingOverlay.tsx
 * @description Immersive full-screen loading overlay for AI generation phases.
 * Creates a mystical "fate weaving" atmosphere during story generation.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TranslationKey } from "~/types/i18next";

export interface LoadingPhase {
  key: TranslationKey;
  duration: number; // minimum duration in ms
}

export interface LoadingOverlayProps {
  isVisible: boolean;
  phases?: LoadingPhase[];
  currentPhase?: number;
}

const DEFAULT_PHASES: LoadingPhase[] = [
  { key: "game.generating_concept", duration: 2000 },
  { key: "game.generating_map", duration: 3000 },
  { key: "game.starting", duration: 1500 },
];

// Mystical symbols that rotate during loading
const SYMBOLS = ["卦", "命", "缘", "道", "玄", "灵", "幻", "梦"];

export function LoadingOverlay({
  isVisible,
  phases = DEFAULT_PHASES,
  currentPhase = 0,
}: LoadingOverlayProps) {
  const { t } = useTranslation();
  const [symbolIndex, setSymbolIndex] = useState(0);
  const [dots, setDots] = useState("");

  // Rotate symbols
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setSymbolIndex((prev) => (prev + 1) % SYMBOLS.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Animate dots
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const phase = phases[Math.min(currentPhase, phases.length - 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-primary/95 backdrop-blur-sm">
      {/* Mystical background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-6xl text-text-primary font-serif select-none animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
              }}
            >
              {SYMBOLS[i % SYMBOLS.length]}
            </div>
          ))}
        </div>
      </div>

      {/* Central loading content */}
      <div className="relative flex flex-col items-center gap-8 px-8">
        {/* Rotating symbol circle */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-spin-slow" />

          {/* Inner ring - counter rotate */}
          <div className="absolute inset-4 rounded-full border border-accent/20 animate-spin-reverse" />

          {/* Center symbol */}
          <div className="text-5xl font-serif text-accent animate-pulse select-none">
            {SYMBOLS[symbolIndex]}
          </div>

          {/* Orbiting dots */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-accent rounded-full"
              style={{
                animation: `orbit 3s linear infinite`,
                animationDelay: `${i * 1}s`,
              }}
            />
          ))}
        </div>

        {/* Phase text */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-serif text-text-primary tracking-wide">
            {t(phase.key)}
            <span className="inline-block w-8 text-left">{dots}</span>
          </h2>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2">
            {phases.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition-all duration-500 ${
                  i <= currentPhase
                    ? "bg-accent"
                    : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Subtle hint */}
        <p className="text-sm text-text-secondary/60 font-sans animate-fade-in-delayed">
          {t("game.loading_hint", "命运正在编织中...")}
        </p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
