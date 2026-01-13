/**
 * Cloudflare Worker entry point for React Router v7.
 *
 * This file wraps the React Router server build with a proper Cloudflare Workers
 * module format handler (export default { fetch }).
 */

import type { ServerBuild } from "react-router";
import { createPagesFunctionHandler } from "@react-router/cloudflare";

// Import the React Router server build.
// @ts-ignore - TypeScript cannot properly type the minified build output
import * as serverBuildModule from "./build/server/index.js";

// Cast the server build to the expected type
const serverBuild = serverBuildModule as unknown as ServerBuild;

/**
 * Create the React Router Pages function handler.
 * This is designed for Cloudflare Pages but we adapt it for Workers.
 */
const handleRequest = createPagesFunctionHandler({
  build: serverBuild,
  mode: process.env.NODE_ENV,
  getLoadContext: ({ context }) => context,
});

/**
 * Cloudflare Workers module format export.
 * This adapts the Pages function handler to the Workers fetch handler format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Create an EventContext-like object that the Pages function handler expects
    // We use type assertion to satisfy the generic type requirements
    const eventContext = {
      request,
      env,
      params: {},
      data: {},
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException.bind(ctx),
      next: async () => new Response("Not Found", { status: 404 }),
    } as unknown as EventContext<Env, string, Record<string, unknown>>;

    return handleRequest(eventContext);
  },
} satisfies ExportedHandler<Env>;
