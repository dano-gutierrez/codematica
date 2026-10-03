import { expect, test } from "@playwright/test";
test("@smoke restores CSS and SQLite signals and persists unlocks", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("game-level-2")).toBeDisabled();
  await page.getByTestId("game-continue").click();
  await page.getByTestId("game-run").click();
  await expect(page.getByTestId("game-result")).toContainText("does not cover");
  await page
    .getByTestId("game-code")
    .fill("grid-column: 2 / 3; grid-row: 1 / 2;");
  await page.getByTestId("game-run").click();
  await expect(page.getByTestId("game-result")).toContainText(
    "Signal restored!",
  );
  await page.reload();
  await expect(page.getByTestId("game-scenario-mastery-1")).toBeEnabled();
  await page.goto("/");
  await expect(page.getByTestId("game-level-2")).toBeEnabled();
  await expect(page.getByText("100 XP", { exact: true })).toBeVisible();
  await page.getByTestId("game-level-2").click();
  await page.getByTestId("game-code").fill("SELECT id FROM zombies WHERE kind = 'runner';");
  await page.getByTestId("game-run").click();
  await expect(page.getByTestId("game-result")).toContainText("Signal restored!");
});
