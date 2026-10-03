import { defineConfig, devices } from "@playwright/test";

const webServerEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key, value]) => key !== "NO_COLOR" && value !== undefined),
) as Record<string, string>;

// Keep public smoke tests independent of a developer's real Supabase project.
// Editorial requests are intercepted by the dedicated regression spec.
webServerEnv.NEXT_PUBLIC_SUPABASE_URL = process.env.EDITORIAL_E2E === "1" ? "https://editorial.supabase.test" : "";
webServerEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.EDITORIAL_E2E === "1" ? "editorial-test-anon-key" : "";
webServerEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";

export default defineConfig({
  testDir: "./specs",
  outputDir: process.env.EDITORIAL_E2E === "1" ? "./test-results/editorial-artifacts" : "./test-results/artifacts",
  timeout: 30_000,
  workers: 4,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: process.env.EDITORIAL_E2E === "1" ? "playwright-report/editorial" : "playwright-report", open: "never" }],
    ["junit", { outputFile: process.env.EDITORIAL_E2E === "1" ? "test-results/editorial-junit.xml" : "test-results/junit.xml" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3100",
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
      grep: /@smoke|@playground|@notebook-catalog/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "mobile-webkit",
      grep: /@smoke|@playground|@notebook-catalog/,
      use: {
        ...devices["iPhone 15"],
      },
    },
  ],
  webServer: {
    // Production serving avoids concurrent on-demand compilation aborting
    // navigations when the release suite uses multiple browser workers.
    command: "env -u NO_COLOR npm run serve:e2e -w @codematica/web",
    env: webServerEnv,
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
