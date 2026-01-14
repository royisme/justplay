/**
 * @file i18next.d.ts
 * @description Type declarations for i18next with TypeScript type safety.
 * Provides autocomplete for known keys while allowing dynamic string keys.
 * @module types/i18next
 */

import "i18next";

// Import all translation modules to infer types
import type zhApp from "~/locales/zh/app";
import type zhLanding from "~/locales/zh/landing";
import type zhHome from "~/locales/zh/home";
import type zhLogin from "~/locales/zh/login";
import type zhGame from "~/locales/zh/game";
import type zhSidebar from "~/locales/zh/sidebar";
import type zhAdmin from "~/locales/zh/admin";
import type zhCommon from "~/locales/zh/common";
import type zhDashboard from "~/locales/zh/dashboard";
import type zhSettings from "~/locales/zh/settings";

/**
 * Flattened translation resources for the "common" namespace.
 * Each module's keys are prefixed with the module name.
 */
interface CommonNamespace {
  app: typeof zhApp;
  landing: typeof zhLanding;
  home: typeof zhHome;
  login: typeof zhLogin;
  game: typeof zhGame;
  sidebar: typeof zhSidebar;
  admin: typeof zhAdmin;
  common: typeof zhCommon;
  dashboard: typeof zhDashboard;
  settings: typeof zhSettings;
}

// Resources structure for i18next
interface Resources {
  common: CommonNamespace;
}

// Helper type to flatten nested object keys with dot notation
type FlattenKeys<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? FlattenKeys<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

/**
 * All valid translation keys for the "common" namespace.
 * Keys are in format: "module.key" (e.g., "sidebar.my_adventures")
 *
 * Use this type for component props that accept translation keys.
 *
 * @example
 * interface Props {
 *   labelKey: TranslationKey;
 * }
 */
export type TranslationKey = FlattenKeys<CommonNamespace>;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: Resources;
    returnNull: false;
  }
}
