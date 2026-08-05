import { defineConfig, devices } from "@playwright/test";

const webServerEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key, value]) => key !== "NO_COLOR" && value !== undefined),
) as Record<string, string>;

export default defineConfig({
  testDir: "./specs",
  outputDir: "./test-results/artifacts",
  timeout: 30_000,
  workers: 4,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
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
      grep: /@smoke/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "mobile-webkit",
      grep: /@smoke/,
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
