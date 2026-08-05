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
    reporters: process.env.CI
      ? ["default", ["junit", { outputFile: "test-results/vitest/junit.xml" }]]
      : ["default"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/vitest",
      reporter: ["text", "text-summary", "html", "lcov", "json"],
      reportOnFailure: true,
      include: [
        "packages/core/src/**/*.{ts,tsx}",
        "apps/web/src/components/**/*.{ts,tsx}",
        "apps/web/src/lib/**/*.{ts,tsx}",
        "apps/web/src/app/api/**/route.ts",
        "apps/web/src/app/auth/**/route.ts",
        "scripts/content/**/*.ts",
      ],
      // Generated assets, type/barrel files, and thin route composition are
      // validated by content checks, typecheck, and E2E rather than line coverage.
      exclude: [
        "**/*.{test,spec}.{ts,tsx}",
        "**/generated/**",
        "**/test/**",
        "**/index.ts",
        "apps/web/src/lib/content/**",
        "apps/web/src/lib/{search,interviews,flashcards,practice}/**",
        "apps/web/src/lib/progress/{progress,server}.ts",
        "apps/web/src/lib/section-themes.ts",
        // Thin CLI composition delegates entirely to the covered core index builder.
        "scripts/content/build-index.ts",
      ],
      thresholds: {
        lines: 75,
        statements: 75,
        functions: 75,
        branches: 70,
        "packages/core/src/**": { lines: 90, statements: 90, functions: 90, branches: 85 },
        "apps/web/src/lib/**": { lines: 85, statements: 85, functions: 85, branches: 80 },
        "apps/web/src/app/**/route.ts": { lines: 85, statements: 85, functions: 85, branches: 80 },
        "scripts/content/**": { lines: 85, statements: 85, functions: 85, branches: 80 },
        "apps/web/src/components/**": { lines: 75, statements: 75, functions: 75, branches: 70 },
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
