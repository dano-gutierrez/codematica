import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || process.env.PLAYWRIGHT_PORT || 3100);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid PLAYWRIGHT_PORT");
const webServerEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key, value]) => key !== "NO_COLOR" && value !== undefined),
) as Record<string, string>;

// Keep public smoke tests independent of a developer's real Supabase project.
// Editorial requests are intercepted by the dedicated regression spec.
webServerEnv.NEXT_PUBLIC_SUPABASE_URL = process.env.EDITORIAL_E2E === "1" ? "https://editorial.supabase.test" : "";
webServerEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.EDITORIAL_E2E === "1" ? "editorial-test-anon-key" : "";
webServerEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";

const designMatrices = ["design-foundations", "design-game", "design-japanese"];
const designFiles = designMatrices.map(name => `**/${name}.regression.spec.ts`);
// Long-lived WebKit workers stalled after roughly 47 cases in the full audit.
// Give each responsive batch a fresh worker while retaining every case and artifact.
const webkitDesignProjects = process.env.EDITORIAL_E2E === "1" ? [] : [
  ...designMatrices.flatMap(name => [320, 768, 1440].map(width => ({
    name: `mobile-webkit-${name}-${width}`,
    workers: 1,
    testMatch: `**/${name}.regression.spec.ts`,
    grep: new RegExp(`@design .* (?:reflows|adapts) at ${width}px`),
    use: { ...devices["iPhone 15"] },
  }))),
  {
    name: "mobile-webkit-design-interactions",
    workers: 1,
    testMatch: designFiles,
    grep: /@design/,
    grepInvert: /(?:reflows|adapts) at \d+px/,
    use: { ...devices["iPhone 15"] },
  },
];

export default defineConfig({
  testDir: "./specs",
  outputDir: process.env.EDITORIAL_E2E === "1" ? "./test-results/editorial-artifacts" : "./test-results/artifacts",
  timeout: 30_000,
  // Keep concurrent canvas/browser processes within hosted runner capacity.
  workers: process.env.CI ? 2 : 4,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: process.env.EDITORIAL_E2E === "1" ? "playwright-report/editorial" : "playwright-report", open: "never" }],
    ["junit", { outputFile: process.env.EDITORIAL_E2E === "1" ? "test-results/editorial-junit.xml" : "test-results/junit.xml" }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
      },
    },
    {
      name: "desktop-chromium",
      grep: process.env.EDITORIAL_E2E === "1" ? /@regression/ : /@smoke|@playground|@notebook-catalog|@design|@interview-admin|@map-art/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "mobile-webkit",
      // Concurrent WebKit pages stalled navigation on both local macOS and Linux CI.
      workers: 1,
      testIgnore: process.env.EDITORIAL_E2E === "1" ? [] : designFiles,
      grep: process.env.EDITORIAL_E2E === "1" ? /@regression/ : /@smoke|@playground|@notebook-catalog|@design|@interview-admin|@map-art/,
      use: {
        ...devices["iPhone 15"],
      },
    },
    ...webkitDesignProjects,
  ],
  webServer: {
    // Production serving avoids concurrent on-demand compilation aborting
    // navigations when the release suite uses multiple browser workers.
    command: `env -u NO_COLOR npm run serve:e2e -w @codematica/web -- --port ${port}`,
    env: webServerEnv,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
