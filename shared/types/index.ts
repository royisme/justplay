/**
 * @file shared/types/index.ts
 * @description Barrel export for all shared types.
 * These types are safe to use in both client and server code.
 */

export * from "./game";
export * from "./i18n";
// Note: story.ts types are duplicated in game.ts, so we don't export them separately
