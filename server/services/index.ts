/**
 * @file server/services/index.ts
 * @description Barrel export for server-side services.
 * This module should NEVER be imported from client code.
 * @module server/services
 */

export {
  AIService,
  getDefaultProviderConfig,
  getProviderConfig,
  type AIServiceConfig,
} from "./ai.server";
export { GameService } from "./game.server";
// Auth is now handled by Better Auth - see server/auth/auth.ts
