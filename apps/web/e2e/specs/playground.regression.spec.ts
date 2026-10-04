import { expect, test, type Page } from "@playwright/test";
import { replaceAppCode } from "../code-editor";

async function openBoard(page: Page) {
  await page.goto("/interviews/frontend-practice/dynamic-board?path=frontend-interview-practice");
  await page.getByRole("button", { name: "Show full solution", exact: true }).click();
  await expect(page.getByTestId("web-playground")).toBeVisible();
}

const editedApp = `import { useState } from "react";
export default function App() {
  const [count, setCount] = useState(7);
  return <button onClick={() => {
    console.log("Playground verification: counter clicked");
    setCount(count + 1);
  }}>Edited counter {count}</button>;
}`;

async function editApp(page: Page) {
  await replaceAppCode(page, editedApp);
}

test("@regression @playground starts one preview, runs edits, logs interactions, and resets output", async ({ page }) => {
  test.setTimeout(120_000);
  await openBoard(page);
  const preview = page.frameLocator('iframe[title="Sandpack Preview"]');
  // No Run click: revealing the solution must start the authored project.
  await expect(preview.getByRole("heading", { name: "Dynamic board", exact: true })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId("web-playground").locator("iframe")).toHaveCount(1);
  await editApp(page);
  await expect(preview.getByRole("heading", { name: "Dynamic board", exact: true })).toBeVisible();
  await page.getByTestId("web-playground-run").click();
  await expect(preview.getByRole("button", { name: "Edited counter 7" })).toBeVisible({ timeout: 45_000 });
  await preview.getByRole("button", { name: "Edited counter 7" }).click();
  await expect(preview.getByRole("button", { name: "Edited counter 8" })).toBeVisible();
  await page.getByText("Console", { exact: true }).click();
  // The same string also exists in the editor. Scope to actual console output
  // and log after startup so the assertion does not race bridge initialization.
  await expect(page.getByTestId("web-playground-console").getByText('"Playground verification: counter clicked"', { exact: true })).toHaveCount(1);
  await page.getByTestId("web-playground-reset").click();
  await expect(preview.getByRole("heading", { name: "Dynamic board", exact: true })).toBeVisible({ timeout: 45_000 });
  await expect(preview.getByLabel("Rows", { exact: true })).toHaveValue("3");
  await expect(preview.getByText("2,4", { exact: true })).toBeVisible();
});

test("@regression @playground recovers from a blocked runtime without losing edits", async ({ page }) => {
  test.setTimeout(120_000);
  const bundler = /https:\/\/[^/]*sandpack\.codesandbox\.io\//;
  await page.route(bundler, (route) => route.abort());
  await page.clock.install();
  const blockedRequest = page.waitForRequest(bundler);
  await openBoard(page);
  await blockedRequest;
  await editApp(page);
  // Advance the real connection deadline; no wall-clock sleep or fake app state.
  await page.clock.fastForward(40_001);
  await expect(page.getByTestId("web-playground-connection-error")).toContainText("Your edits are preserved");
  await expect(page.getByRole("textbox", { name: "Code Editor for App.tsx", exact: true }).last()).toContainText("Edited counter");
  await page.unroute(bundler);
  await page.getByRole("button", { name: "Retry preview", exact: true }).click();
  const preview = page.frameLocator('iframe[title="Sandpack Preview"]');
  await expect(preview.getByRole("button", { name: "Edited counter 7" })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId("web-playground-connection-error")).toHaveCount(0);
  await expect(page.getByTestId("web-playground-status")).toContainText("Preview ready");
});
