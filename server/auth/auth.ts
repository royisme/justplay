/**
 * @file auth.ts
 * @description Better Auth configuration for the application.
 * @module server/auth
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@server/db/schema";
import type { AppEnv } from "@server/config/env";

/**
 * Create a Better Auth instance for the given environment.
 * This must be called per-request since D1 binding is request-scoped.
 */
export function createAuth(db: DrizzleD1Database<typeof schema>, env: AppEnv) {
  const adminEmail = env.ADMIN_EMAIL?.toLowerCase();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Set role to 'admin' if email matches ADMIN_EMAIL
          before: async (user) => {
            const email = user.email?.toLowerCase();
            if (adminEmail && email === adminEmail) {
              return {
                data: {
                  ...user,
                  role: "admin",
                },
              };
            }
            return { data: user };
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * Extended user type that includes the role field.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
