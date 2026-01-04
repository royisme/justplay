/**
 * @file server/index.ts
 * @description Barrel export for all server-side modules.
 * This module should NEVER be imported from client code.
 * @module server
 */

// --- Configuration ---
export * from "./config/env";

// --- Database ---
export * from "./db";

// --- Services ---
export { AIService } from "./services/ai.server";
export { GameService } from "./services/game.server";

// --- i18n ---
export {
  extractLanguageFromCookie,
  getLanguageFromRequest,
  getLanguagePrompt,
} from "./i18n.server";
