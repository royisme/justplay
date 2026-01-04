/**
 * @file drizzle.config.ts
 * @description Drizzle Kit configuration for database migrations.
 * Supports both local development and remote Cloudflare D1.
 *
 * Environment Variables:
 * - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
 * - CLOUDFLARE_DATABASE_ID: D1 database ID (from wrangler.toml)
 * - CLOUDFLARE_D1_TOKEN: API token with D1 permissions
 *
 * @see https://orm.drizzle.team/docs/kit-overview
 */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Schema location (updated for new architecture)
  schema: "./server/db/schema.ts",

  // Output directory for migrations
  out: "./drizzle",

  // Database dialect
  dialect: "sqlite",

  // Driver for Cloudflare D1
  driver: "d1-http",

  // D1 credentials from environment variables
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "your-cf-account-id",
    databaseId:
      process.env.CLOUDFLARE_DATABASE_ID ||
      "5264151b-3b5b-4e47-b2d4-ab8c74d1e321",
    token: process.env.CLOUDFLARE_D1_TOKEN || "your-api-token",
  },

  // Verbose logging for debugging
  verbose: true,

  // Strict mode for safer migrations
  strict: true,
});
