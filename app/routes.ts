import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("game/new", "routes/game.new.ts"),
  route("game/:id", "routes/game.$id.tsx"),

  // Better Auth API routes
  route("api/auth/*", "routes/api.auth.$.ts"),

  // Auth UI routes
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/logout", "routes/auth.logout.ts"),

  // Admin routes
  layout("routes/admin/layout.tsx", [
    route("admin", "routes/admin/_index.tsx", { index: true }),
    route("admin/providers", "routes/admin/providers.tsx"),
    route("admin/prompts", "routes/admin/prompts.tsx"),
    route("admin/playground", "routes/admin/playground.tsx"),
  ]),
] satisfies RouteConfig;
