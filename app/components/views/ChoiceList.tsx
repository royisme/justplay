/**
 * @file ChoiceList.tsx
 * @description Choice list view component displaying available story choices.
 * Extracted from game route for better separation of concerns.
 * @module app/components/views/ChoiceList
 */

import { CaretRight } from "@phosphor-icons/react";
import type { Choice } from "@shared/types/game";

// --- Types ---

export interface ChoiceListProps {
  /** Available choices */
  choices: Choice[];
  /** Callback when a choice is selected */
  onChoiceSelect: (choiceText: string) => void;
  /** Whether choices are disabled (e.g., while loading) */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

// --- Component ---

export function ChoiceList({
  choices,
  onChoiceSelect,
  disabled = false,
  className = "",
}: ChoiceListProps) {
  if (!choices || choices.length === 0) {
    return null;
  }

  return (
    <div className={`grid gap-3 ${className}`}>
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          onClick={() => onChoiceSelect(choice.text)}
          disabled={disabled}
          className="w-full text-left px-5 py-4 rounded-xl border border-border hover:border-accent hover:bg-background-secondary transition-all group flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-medium text-text-primary group-hover:text-accent transition-colors">
            {choice.text}
          </span>
          <CaretRight
            size={20}
            className="text-text-secondary group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
          />
        </button>
      ))}
    </div>
  );
}

export default ChoiceList;
