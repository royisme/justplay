/**
 * @file ChoiceList.tsx
 * @description Interactive choice list with Motion animations and selection feedback.
 * Features staggered entrance animations, hover effects, and selected state visualization.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

export interface Choice {
  id: number | string;
  text: string;
}

export interface ChoiceListProps {
  choices: Choice[];
  onSelect: (text: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChoiceList({
  choices,
  onSelect,
  disabled,
  isLoading,
}: ChoiceListProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  if (!choices || choices.length === 0) return null;

  const handleSelect = (choice: Choice) => {
    if (disabled || isLoading) return;
    setSelectedId(choice.id);
    onSelect(choice.text);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-3 max-w-3xl mx-auto w-full"
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex items-center gap-3 mb-2"
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 font-sans select-none">
          {t("game.choices", "Make your choice")}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </motion.div>

      {/* Choice buttons */}
      <div className="space-y-3">
        <AnimatePresence mode="sync">
          {choices.map((choice, index) => {
            const isSelected = selectedId === choice.id;
            const isDisabledChoice = disabled || isLoading;
            const isOtherSelected = selectedId !== null && !isSelected;

            return (
              <motion.button
                key={choice.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{
                  opacity: isOtherSelected ? 0.4 : 1,
                  x: 0,
                  scale: isSelected ? 1.02 : 1,
                  y: isSelected ? -2 : 0,
                }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.1,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={
                  !isDisabledChoice
                    ? {
                        scale: 1.02,
                        y: -2,
                        transition: { duration: 0.2 },
                      }
                    : undefined
                }
                whileTap={
                  !isDisabledChoice
                    ? {
                        scale: 0.98,
                        transition: { duration: 0.1 },
                      }
                    : undefined
                }
                onClick={() => handleSelect(choice)}
                disabled={isDisabledChoice}
                className={`
                  choice-button
                  w-full text-left p-5 rounded-xl
                  border transition-colors duration-300
                  font-serif text-base leading-relaxed
                  ${
                    isSelected
                      ? "bg-accent/10 border-accent text-text-primary shadow-lg"
                      : "bg-surface border-border text-text-primary hover:border-accent/50 hover:bg-accent/5"
                  }
                  ${isDisabledChoice && !isSelected ? "cursor-not-allowed" : "cursor-pointer"}
                  ${isSelected && isLoading ? "animate-pulse" : ""}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Choice indicator */}
                  <motion.div
                    animate={{
                      backgroundColor: isSelected
                        ? "var(--accent)"
                        : "rgba(var(--accent-rgb), 0.1)",
                      scale: isSelected ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className={`
                      flex-shrink-0 w-8 h-8 rounded-full
                      flex items-center justify-center
                      text-sm font-sans font-medium
                      ${isSelected ? "text-white" : "text-accent"}
                    `}
                  >
                    {isSelected && isLoading ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      />
                    ) : (
                      index + 1
                    )}
                  </motion.div>

                  {/* Choice text */}
                  <div className="flex-1 pt-1">
                    <p className={isSelected ? "font-medium" : ""}>
                      {choice.text}
                    </p>
                  </div>

                  {/* Selected indicator */}
                  <AnimatePresence>
                    {isSelected && !isLoading && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 25,
                        }}
                        className="flex-shrink-0 pt-1"
                      >
                        <svg
                          className="w-5 h-5 text-accent"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Loading hint when a choice is selected */}
      <AnimatePresence>
        {isLoading && selectedId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center py-4"
          >
            <p className="text-sm text-text-secondary italic">
              {t("game.generating", "AI is writing the next chapter...")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ChoiceList;
