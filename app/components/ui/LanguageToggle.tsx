/**
 * @file LanguageToggle.tsx
 * @description Language toggle component for switching between supported languages.
 * @module app/components/ui/LanguageToggle
 */

import { useTranslation } from "react-i18next";
import { setLanguageCookie } from "~/i18n";
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from "@shared/types/i18n";

// --- Types ---

export interface LanguageToggleProps {
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class names */
  className?: string;
}

// --- Styles ---

const sizeStyles = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
} as const;

// --- Component ---

export function LanguageToggle({ size = "sm", className = "" }: LanguageToggleProps) {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.language || DEFAULT_LANGUAGE) as SupportedLanguage;

  const handleLanguageChange = async (lng: SupportedLanguage) => {
    if (lng !== currentLanguage) {
      await i18n.changeLanguage(lng);
      setLanguageCookie(lng);
    }
  };

  return (
    <div className={`flex gap-1 border border-border rounded-lg p-1 ${className}`}>
      {SUPPORTED_LANGUAGES.map((lng) => {
        const isActive = currentLanguage?.startsWith(lng) ?? false;

        return (
          <button
            key={lng}
            type="button"
            onClick={() => handleLanguageChange(lng)}
            className={`
              ${sizeStyles[size]}
              rounded font-medium transition-colors
              ${
                isActive
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }
            `}
            title={LANGUAGE_LABELS[lng]}
            aria-pressed={isActive}
            aria-label={`Switch to ${LANGUAGE_LABELS[lng]}`}
          >
            {lng === "zh" ? "中" : "EN"}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageToggle;
