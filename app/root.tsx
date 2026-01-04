/**
 * @file root.tsx
 * @description Root layout component with i18n SSR synchronization.
 * Uses Cookie-based language detection for hydration consistency.
 * @module app/root
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
<<<<<<< HEAD
import i18n, { extractLanguageFromCookie, setLanguageCookie } from "./i18n";
=======
import i18n, { setLanguageCookie } from "~/config/i18n.client";
import { extractLanguageFromCookie } from "@server/i18n.server";
>>>>>>> feature/architecture-refactor

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

/**
 * Root loader: Extract language from Cookie for SSR synchronization.
 * This ensures the server renders with the same language as the client will use.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
<<<<<<< HEAD
  const language = extractLanguageFromCookie(cookieHeader) || "zh";
=======
  const language = extractLanguageFromCookie(cookieHeader);
>>>>>>> feature/architecture-refactor

  // Initialize i18n for SSR rendering
  // This happens server-side before component render
  if (typeof i18n.changeLanguage === "function") {
    await i18n.changeLanguage(language);
  }

  return { language };
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export function Layout({ children }: { children: React.ReactNode }) {
  const { language } = useLoaderData<LoaderData>();
  const { i18n: i18nInstance } = useTranslation();

  // Client-side hydration sync:
  // After SSR, ensure client i18n matches server language
  useEffect(() => {
    if (i18nInstance.language !== language) {
      i18nInstance.changeLanguage(language);
      setLanguageCookie(language);
    }
  }, [language, i18nInstance]);

  return (
    <html lang={language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation();
  let message = t("common.error_title", "Oops!");
  let details = t("common.error_details", "An unexpected error occurred.");
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : t("common.error");
    details =
      error.status === 404
        ? t("common.not_found")
        : error.statusText || details;
  } else if (error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-4">{message}</h1>
      <p className="text-text-secondary mb-4">{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto bg-background-secondary rounded-lg border border-border">
          <code className="text-sm text-text-secondary">{stack}</code>
        </pre>
      )}
    </main>
  );
}
