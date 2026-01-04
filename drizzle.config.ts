import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: "your-cf-account-id",
    databaseId: "your-database-id-here", // Match wrangler.toml
    token: "your-api-token",
  },
});
