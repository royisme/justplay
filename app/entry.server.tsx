/**
 * @file entry.server.tsx
 * @description Cloudflare Workers compatible server entry point.
 * Uses `renderToReadableStream` instead of Node.js `renderToPipeableStream`.
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

// Initialize i18n for SSR - must be imported before rendering
import "~/i18n";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        console.error(error);
        responseStatusCode = 500;
      },
    }
  );

  // If it's a bot, wait for the entire document to be ready
  if (userAgent && isbot(userAgent)) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
