/**
 * @file admin/layout.tsx
 * @description Admin layout with navigation and Better Auth guard.
 * @module routes/admin/layout
 */

import { Outlet, redirect, useLoaderData } from "react-router";
import { createAuth } from "@server/auth/auth";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { user as userTable } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/layout";
import { SidebarLayout } from "~/components/layout/SidebarLayout";
import { AdminSidebar } from "~/components/layout/AdminSidebar";

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

  return (
    <SidebarLayout sidebar={<AdminSidebar />}>
      <Outlet />
    </SidebarLayout>
  );
}
