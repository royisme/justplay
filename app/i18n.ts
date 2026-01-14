/**
 * @file i18n.ts
 * @description i18n configuration with Cookie-based SSR sync.
 * Disables browser auto-detection to prevent hydration mismatches.
 * Language is determined by Cookie, which is set by both SSR (Loader) and client.
 * @author Claude Code
 * @date 2025-01-26
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation modules
import zhApp from "./locales/zh/app";
import zhLanding from "./locales/zh/landing";
import zhHome from "./locales/zh/home";
import zhLogin from "./locales/zh/login";
import zhGame from "./locales/zh/game";
import zhSidebar from "./locales/zh/sidebar";
import zhAdmin from "./locales/zh/admin";
import zhCommon from "./locales/zh/common";
import zhDashboard from "./locales/zh/dashboard";
import zhSettings from "./locales/zh/settings";

import enApp from "./locales/en/app";
import enLanding from "./locales/en/landing";
import enHome from "./locales/en/home";
import enLogin from "./locales/en/login";
import enGame from "./locales/en/game";
import enSidebar from "./locales/en/sidebar";
import enAdmin from "./locales/en/admin";
import enCommon from "./locales/en/common";
import enDashboard from "./locales/en/dashboard";
import enSettings from "./locales/en/settings";

// Inline translation resources for SSR compatibility
const resources = {
  zh: {
    common: {
      app: zhApp,
      landing: zhLanding,
      home: zhHome,
      login: zhLogin,
      game: zhGame,
      sidebar: zhSidebar,
      admin: zhAdmin,
      common: zhCommon,
      dashboard: zhDashboard,
      settings: zhSettings,
    },
  },
  en: {
    common: {
      app: enApp,
      landing: enLanding,
      home: enHome,
      login: enLogin,
      game: enGame,
      sidebar: enSidebar,
      admin: enAdmin,
      common: enCommon,
      dashboard: enDashboard,
      settings: enSettings,
    },
  },
};

// Initialize i18n synchronously for SSR compatibility
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    fallbackLng: "zh",
    // On client, prioritize cookie language to match server render
    lng:
      typeof document !== "undefined"
        ? document.cookie.match(/i18next=([^;]+)/)?.[1] || "zh"
        : "zh", // Default for server (will be overridden)
    supportedLngs: ["zh", "en"],
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false,
    },
    // ⚠️ CRITICAL: Only use Cookie for language detection
    // Removes browser auto-detection (navigator, localStorage) to prevent hydration mismatches
    // Language must come from Cookie (set by Loader in SSR, by client code in browser)
    detection: {
      order: ["cookie"],
      caches: ["cookie"],
    },
    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
    },
  });
}

export default i18n;

/**
 * Helper to set language in Cookie for client-side persistence.
 * Call this when user changes language in the browser.
 * @param lng Language code ('zh' or 'en')
 */
export function setLanguageCookie(lng: string) {
  if (typeof document === "undefined") return; // SSR guard
  // Set cookie for 1 year, path=/, so all routes can access it
  document.cookie = `i18next=${lng}; max-age=31536000; path=/; SameSite=Lax`;
}

/**
 * Get current language from i18n instance
 */
export function getCurrentLanguage(): string {
  return i18n.language || "zh";
}
