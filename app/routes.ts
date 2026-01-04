import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("game/new", "routes/game.new.ts"),
  route("game/:id", "routes/game.$id.tsx"),
] satisfies RouteConfig;
