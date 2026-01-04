/**
 * @file i18n.server.ts
 * @description Server-only i18n utilities.
 * This file should NEVER be imported from client code.
 * @module server/i18n
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import {
  I18N_COOKIE_NAME,
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  type SupportedLanguage,
} from "@shared/types/i18n";

/**
 * Extract language from Cookie header string.
 * Server-only: used in loaders/actions to determine user's preferred language.
 *
 * @param cookieHeader - The raw Cookie header from the request
 * @returns The extracted language code, or default if not found
 */
export function extractLanguageFromCookie(
  cookieHeader: string | null
): SupportedLanguage {
  if (!cookieHeader) return DEFAULT_LANGUAGE;

  const regex = new RegExp(`${I18N_COOKIE_NAME}=([^;]+)`);
  const match = cookieHeader.match(regex);

  if (!match || !match[1]) return DEFAULT_LANGUAGE;

  return normalizeLanguage(match[1]);
}

/**
 * Get language from Request object.
 * Convenience wrapper for extractLanguageFromCookie.
 *
 * @param request - The incoming Request object
 * @returns The extracted language code
 */
export function getLanguageFromRequest(request: Request): SupportedLanguage {
  const cookieHeader = request.headers.get("Cookie");
  return extractLanguageFromCookie(cookieHeader);
}

/**
 * Build a language prompt string for AI services.
 *
 * @param language - The target language code
 * @returns Language instruction string for AI prompts
 */
export function getLanguagePrompt(language: SupportedLanguage): string {
  return language === "zh" ? "中文" : "English";
}
