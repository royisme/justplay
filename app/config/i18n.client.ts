/**
 * @file i18n.client.ts
 * @description Client-side i18n configuration with translation resources.
 * This file contains client-safe code only - no server dependencies.
 * @module app/config/i18n
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  I18N_COOKIE_NAME,
  I18N_COOKIE_MAX_AGE,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from "@shared/types/i18n";

// --- Translation Resources ---

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
} as const;

// --- Initialize i18n ---

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    lng: DEFAULT_LANGUAGE, // Default, will be overridden by Loader context
    supportedLngs: ["zh", "en"],
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false,
    },
    // CRITICAL: Only use Cookie for language detection
    // This prevents hydration mismatches between SSR and client
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

// --- Client-side Cookie Helpers ---

/**
 * Set language preference in Cookie.
 * Call this when the user changes language in the browser.
 *
 * @param lng - Language code to set
 */
export function setLanguageCookie(lng: SupportedLanguage): void {
  if (typeof document === "undefined") return; // SSR guard

  document.cookie = `${I18N_COOKIE_NAME}=${lng}; max-age=${I18N_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

/**
 * Get current language from i18n instance.
 *
 * @returns Current language code
 */
export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE;
}

/**
 * Change language and persist to Cookie.
 *
 * @param lng - Language code to change to
 */
export async function changeLanguage(lng: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lng);
  setLanguageCookie(lng);
}
