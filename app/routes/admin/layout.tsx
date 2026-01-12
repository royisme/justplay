/**
 * @file admin/layout.tsx
 * @description Admin layout with navigation and Better Auth guard.
 * @module routes/admin/layout
 */

import { Outlet, NavLink, Form, redirect, useLoaderData } from "react-router";
import { createAuth } from "@server/auth/auth";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { user as userTable } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/layout";

// --- Loader ---

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return redirect("/auth/login");
  }

  // Get role from database
  const dbUser = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id),
  });

  if (dbUser?.role !== "admin") {
    return redirect("/auth/login");
  }

  return {
    user: {
      email: session.user.email,
      name: session.user.name,
      role: dbUser.role,
    },
  };
}

// --- Component ---

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();

  const navItems = [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/providers", label: "Providers" },
    { to: "/admin/prompts", label: "Prompts" },
    { to: "/admin/playground", label: "Playground" },
  ];

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="bg-background-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <a href="/" className="text-xl font-bold text-text-primary">
                JustPlay
              </a>
              <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                Admin
              </span>
            </div>

            {/* User info */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary">{user.email}</span>
              <Form method="post" action="/auth/logout">
                <button
                  type="submit"
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Logout
                </button>
              </Form>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-background-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 h-12">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-accent text-accent"
                      : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
