import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const webSrc = fileURLToPath(new URL("./apps/web/src", import.meta.url));
const coreSrc = fileURLToPath(new URL("./packages/core/src", import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./apps/web/src/test/setup.ts"],
    include: ["apps/web/src/**/*.{test,spec}.{ts,tsx}", "packages/core/src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.ts"],
  },
  resolve: {
    alias: [
      { find: "@", replacement: webSrc },
      { find: "@codematica/core/progress/server", replacement: `${coreSrc}/progress/server.ts` },
      { find: "@codematica/core/progress", replacement: `${coreSrc}/progress/progress.ts` },
      { find: /^@codematica\/core\/(.*)$/, replacement: `${coreSrc}/$1` },
      { find: "@codematica/core", replacement: `${coreSrc}/index.ts` },
    ],
  },
});
