import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
  OPENAI_BASE_URL: string;
  OPENAI_MODEL: string;
  NODE_NUM: string;
}

// Function to get the DB client, passing in the Env from the loader/action context
export const getDb = (env: Env) => {
  return drizzle(env.DB, { schema });
};
