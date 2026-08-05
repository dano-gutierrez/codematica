import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const webSrc = fileURLToPath(new URL("./apps/web/src", import.meta.url));
const coreSrc = fileURLToPath(new URL("./packages/core/src", import.meta.url));

// Vitest applies `perFile` to every glob threshold in the same config. Keep the
// universal floor in a second pass so the higher layer thresholds remain true
// aggregate gates instead of accidentally becoming per-file requirements.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./apps/web/src/test/setup.ts"],
    include: ["apps/web/src/**/*.{test,spec}.{ts,tsx}", "packages/core/src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.ts"],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/vitest-per-file",
      reporter: ["text-summary", "json-summary"],
      reportOnFailure: true,
      include: [
        "packages/core/src/**/*.{ts,tsx}",
        "apps/web/src/components/**/*.{ts,tsx}",
        "apps/web/src/lib/**/*.{ts,tsx}",
        "apps/web/src/app/api/**/route.ts",
        "apps/web/src/app/auth/**/route.ts",
        "scripts/content/**/*.ts",
      ],
      exclude: [
        "**/*.{test,spec}.{ts,tsx}",
        "**/generated/**",
        "**/test/**",
        "**/index.ts",
        "apps/web/src/lib/content/**",
        "apps/web/src/lib/{search,interviews,flashcards,practice}/**",
        "apps/web/src/lib/progress/{progress,server}.ts",
        "apps/web/src/lib/section-themes.ts",
        "scripts/content/build-index.ts",
      ],
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 60,
        branches: 50,
        perFile: true,
      },
    },
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
