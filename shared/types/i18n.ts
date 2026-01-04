/**
 * @file i18n.ts
 * @description Shared i18n types and constants.
 * Safe to use in both client and server code.
 * @module shared/types/i18n
 */

// --- Language Types ---

export type SupportedLanguage = "zh" | "en";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["zh", "en"];

export const DEFAULT_LANGUAGE: SupportedLanguage = "zh";

// --- Language Labels ---

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  zh: "中文",
  en: "English",
};

// --- Cookie Configuration ---

export const I18N_COOKIE_NAME = "i18next";
export const I18N_COOKIE_MAX_AGE = 31536000; // 1 year in seconds

// --- Utility Functions ---

/**
 * Check if a language code is supported.
 */
export function isSupportedLanguage(lng: string): lng is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lng as SupportedLanguage);
}

/**
 * Normalize language code to supported format.
 * Handles cases like "zh-CN" -> "zh", "en-US" -> "en"
 */
export function normalizeLanguage(lng: string | null | undefined): SupportedLanguage {
  if (!lng) return DEFAULT_LANGUAGE;

  const base = lng.split("-")[0].toLowerCase();
  return isSupportedLanguage(base) ? base : DEFAULT_LANGUAGE;
}
