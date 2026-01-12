/**
 * @file auth.client.ts
 * @description Better Auth client for the browser.
 * This file is client-only and can be imported in React components.
 * @module app/lib/auth
 */

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

export const { signIn, signUp, signOut, useSession } = authClient;
