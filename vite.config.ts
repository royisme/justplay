import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    cloudflareDevProxy(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
      "@server": path.resolve(__dirname, "./server"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
    mainFields: ["module", "main"],
  },
  ssr: {
    resolve: {
      conditions: ["workerd", "worker", "browser"],
    },
    // Exclude server-only modules from client bundle
    noExternal: [],
  },
  build: {
    minify: true,
    rollupOptions: {
      // Ensure server code is not bundled into client
      external: (id) => {
        // Mark @server/* imports as external for client builds
        if (id.startsWith("@server/") || id.includes("/server/")) {
          return true;
        }
        return false;
      },
    },
  },
  optimizeDeps: {
    // Exclude server modules from pre-bundling
    exclude: ["@server"],
  },
});
