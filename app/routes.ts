import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // Public Routes
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/logout", "routes/auth.logout.ts"),

  // User App Routes (Protected by Layout)
  layout("routes/_app/layout.tsx", [
    route("dashboard", "routes/_app/dashboard.tsx"),
    route("game/new", "routes/_app/game.new.tsx"),
    route("game/:id", "routes/_app/game.$id.tsx"),
    route("library", "routes/_app/library.tsx"),
    route("library/:id", "routes/_app/library.$id.tsx"),
    // route("settings", "routes/_app/settings.tsx"), // Not implemented yet
  ]),

  // API Routes
  route("api/auth/*", "routes/api.auth.$.ts"),

  // Admin Routes
  layout("routes/admin/layout.tsx", [
    route("admin", "routes/admin/_index.tsx", { index: true }),
    route("admin/scenarios", "routes/admin/scenarios.tsx"),
    route("admin/users", "routes/admin/users.tsx"),
    route("admin/providers", "routes/admin/providers.tsx"),
    route("admin/audit", "routes/admin/audit.tsx"),
  ]),
] satisfies RouteConfig;
