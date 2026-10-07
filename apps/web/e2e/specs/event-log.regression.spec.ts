import { expect, test } from "@playwright/test";

test("@regression @playground studies event logs, executes all approaches, and enters scrolling review", async ({ page }) => {
  test.setTimeout(150_000);
  await page.addInitScript(() => {
    Object.assign(window, { __codematicaQuestionnaireRandom: () => 0.999999, __codematicaPassiveFlashcardRandom: () => 0.999999 });
  });
  await page.goto("/paths/partitioned-event-log");
  await page.getByTestId("path-node-document-system-design-partitioned-event-log").click();
  await expect(page.getByTestId("markdown-renderer")).toContainText("Review of your attempt");
  await page.getByRole("link", { name: /Next activity/i }).click();
  await expect(page).toHaveURL(/interviews\/real-world\/partitioned-event-log\?path=partitioned-event-log/);
  await page.reload();
  await expect(page.getByTestId("web-recipe-position")).toContainText("Step 1");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByTestId("web-recipe-position")).toContainText("Step 2");
  for (const id of ["indexed-arrays", "linked-anchors", "segmented-log"]) {
    await test.step(`run ${id} and inspect its Python companion`, async () => {
      await page.getByTestId(`web-solution-tab-${id}`).click();
      await page.getByRole("button", { name: "Show full solution" }).click();
      await page.getByRole("button", { name: "TypeScript", exact: true }).click();
      const preview = page.getByTitle("Sandpack Preview", { exact: true }).contentFrame();
      await expect(preview.getByRole("heading", { name: "Partitioned event log", exact: true })).toBeVisible({ timeout: 30_000 });
      await preview.getByLabel("Global offset (inclusive)", { exact: true }).fill("1");
      await preview.getByRole("button", { name: "Read next page", exact: true }).click();
      await expect(preview.getByLabel("Read result", { exact: true })).toContainText('"id": "2"');
      await expect(preview.getByRole("status")).toContainText("offset: 3");
      // user-2 is the eligible whole key moved by this fixture's addNode.
      await preview.getByLabel("Key", { exact: true }).fill("user-2");
      await preview.getByLabel("Global offset (inclusive)", { exact: true }).fill("0");
      await preview.getByRole("button", { name: "Read next page", exact: true }).click();
      await expect(preview.getByLabel("Read result", { exact: true })).toContainText('"id": "1"');
      await preview.getByRole("button", { name: "Add node", exact: true }).click();
      await expect(preview.getByLabel("Node ownership", { exact: true })).toContainText('"id": 1');
      await preview.getByRole("button", { name: "Append event", exact: true }).click();
      await preview.getByRole("button", { name: "Read next page", exact: true }).click();
      await expect(preview.getByLabel("Read result", { exact: true })).toContainText('"id": "3"');
      await page.getByRole("button", { name: "Python", exact: true }).click();
      await expect(page.getByTestId("web-python-companion")).toContainText("class EventLog:");
      await expect(page.getByTestId("web-python-companion")).toContainText("with self._lock:");
    });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByTestId("interview-next-node").click();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
  for (let i = 0; i < 8; i++) {
    await page.getByTestId(i === 0 ? "questionnaire-choice-misconception-1" : "questionnaire-choice-answer").click();
    await page.getByTestId("questionnaire-check").click();
    await expect(page.getByTestId("questionnaire-feedback")).toBeVisible();
    if (i === 0) await expect(page.getByTestId("questionnaire-feedback")).toContainText("offset is compared with event.id");
    await page.getByTestId(i === 7 ? "questionnaire-finish" : "questionnaire-next").click();
  }
  await page.getByRole("link", { name: "Start review feed" }).click();
  await expect(page).toHaveURL(/paths\/partitioned-event-log\/flashcards/);
  const feed = page.getByTestId("passive-flashcard-feed");
  await expect(feed).toHaveAttribute("data-ready", "true");
  await feed.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await expect(page.getByTestId("passive-flashcard-card-12")).toBeAttached();
  await page.getByTestId("passive-flashcard-card-12").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("passive-flashcard-card-12")).toBeVisible();
});
