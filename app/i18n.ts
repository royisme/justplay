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

// Inline translation resources for SSR compatibility
const resources = {
  zh: {
    common: {
      app: {
        title: "JustPlay",
        description: "进入无限可能的世界。你的选择决定故事的走向。",
      },
      home: {
        start_adventure: "开始新的冒险",
        select_genre: "选择故事类型",
        generate_story: "生成故事",
        genres: {
          xuanhuan: "东方玄幻",
          magic: "西方魔幻",
          cyberpunk: "赛博朋克",
          mystery: "悬疑解谜",
          scifi: "末世科幻",
        },
      },
      game: {
        loading: "正在构建命运的脉络...",
        generating_concept: "正在构思故事核心...",
        generating_map: "正在构建世界地图...",
        starting: "故事即将开始...",
        choices: "选择",
        back_to_home: "返回首页",
        toggle_map: "查看故事地图",
        generating: "AI 正在书写下一章...",
      },
      common: {
        error: "故事生成失败，请稍后再试。",
        error_title: "哎呀！",
        error_details: "发生了意外错误。",
        not_found: "页面未找到。",
        retry: "重试",
        powered_by: "基于 AI 和 React Router v7",
      },
    },
  },
  en: {
    common: {
      app: {
        title: "JustPlay",
        description:
          "Enter a world of infinite possibilities. Your choices shape the story.",
      },
      home: {
        start_adventure: "Start New Adventure",
        select_genre: "Select Story Genre",
        generate_story: "Generate Story",
        genres: {
          xuanhuan: "Eastern Fantasy",
          magic: "Western Magic",
          cyberpunk: "Cyberpunk",
          mystery: "Mystery",
          scifi: "Post-Apocalyptic Sci-Fi",
        },
      },
      game: {
        loading: "Weaving the threads of fate...",
        generating_concept: "Crafting the story core...",
        generating_map: "Building the world map...",
        starting: "The story is about to begin...",
        choices: "Choices",
        back_to_home: "Back to Home",
        toggle_map: "View Story Map",
        generating: "AI is writing the next chapter...",
      },
      common: {
        error: "Failed to generate story. Please try again later.",
        error_title: "Oops!",
        error_details: "An unexpected error occurred.",
        not_found: "Page not found.",
        retry: "Retry",
        powered_by: "Powered by AI and React Router v7",
      },
    },
  },
};

// Initialize i18n synchronously for SSR compatibility
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    fallbackLng: "zh",
    lng: "zh", // Default, will be overridden by Loader context
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
 * Extract language from Cookie string (used in Loader)
 * @param cookieHeader Request cookie header
 * @returns Language code or null
 */
export function extractLanguageFromCookie(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/i18next=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Get current language from i18n instance
 */
export function getCurrentLanguage(): string {
  return i18n.language || "zh";
}
