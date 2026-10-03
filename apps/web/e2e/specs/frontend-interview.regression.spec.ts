import { expect, test } from "@playwright/test";

test("@regression follows frontend recipes, checkpoints, and continuous review", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    Object.assign(window, { __codematicaQuestionnaireRandom: () => 0.999999, __codematicaPassiveFlashcardRandom: () => 0.999999 });
  });
  await page.goto("/paths/frontend-interview-practice");
  await expect(page.getByTestId("path-flashcard-feed-link")).toBeVisible();
  await page.getByTestId("path-node-document-frontend-interview-dynamic-board").click();
  await page.getByRole("link", { name: /Next activity/i }).click();
  await expect(page).toHaveURL(/interviews\/frontend-practice\/dynamic-board\?path=frontend-interview-practice/);
  await page.reload();
  await expect(page.getByTestId("web-recipe-position")).toContainText("Step 1");
  await expect(page.getByTestId("web-playground")).toHaveCount(0);
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByTestId("web-recipe-position")).toContainText("Step 2");
  await page.getByRole("button", { name: "Previous step" }).click();
  await page.getByRole("button", { name: "Show full solution" }).click();
  await page.getByRole("button", { name: "Python", exact: true }).click();
  await expect(page.getByTestId("web-python-companion")).toContainText("def ");
  await page.getByRole("button", { name: /Approach 2/ }).click();
  await expect(page.getByTestId("web-recipe-position")).toContainText("Step 1");
  await page.getByRole("button", { name: "Show full solution" }).click();
  await page.getByRole("button", { name: "TypeScript", exact: true }).click();
  await expect(page.getByTestId("web-playground")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const preview = page.frameLocator('iframe[title="Sandpack Preview"]');
  await expect(preview.getByLabel("Rows", { exact: true })).toBeVisible({ timeout: 30_000 });
  await preview.getByLabel("Rows", { exact: true }).fill("2");
  await preview.getByLabel("Columns", { exact: true }).fill("3");
  await expect(preview.getByText("1,2", { exact: true })).toBeVisible();
  await expect(preview.getByText("2,0", { exact: true })).toHaveCount(0);
  await page.getByTestId("interview-next-node").click();
  await expect(page).toHaveURL(/interview-dynamic-board-questionnaire\?path=/);

  await test.step("finish the last checkpoint and enter review", async () => {
    await page.goto("/practice/frontend/interview-user-matrix-questionnaire?path=frontend-interview-practice");
    await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
    for (let i = 0; i < 8; i++) {
      await expect(page.getByTestId("questionnaire-position")).toContainText(`Question ${i + 1} of 8`);
      if (i < 7) await page.getByTestId(i === 0 ? "questionnaire-choice-misconception-one" : "questionnaire-choice-answer").click();
      await page.getByTestId("questionnaire-check").click();
      await expect(page.getByTestId("questionnaire-feedback")).toBeVisible();
      await page.getByTestId(i === 7 ? "questionnaire-finish" : "questionnaire-next").click();
    }
    await page.getByRole("link", { name: "Start review feed" }).click();
    await expect(page).toHaveURL(/paths\/frontend-interview-practice\/flashcards/);
    const feed = page.getByTestId("passive-flashcard-feed");
    await expect(feed).toHaveAttribute("data-ready", "true");
    await expect(page.getByTestId("passive-flashcard-source-0")).toHaveAttribute("href", /\?path=frontend-interview-practice/);
    await feed.evaluate((node) => { node.scrollTop = node.scrollHeight; });
    await expect(page.getByTestId("passive-flashcard-card-12")).toBeAttached();
    await page.getByTestId("passive-flashcard-card-12").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("passive-flashcard-card-12")).toBeVisible();
  });
});

test("@regression finds the React async-state lesson and completes its checkpoint", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { __codematicaQuestionnaireRandom: () => 0.999999 });
  });
  await page.goto("/browse");
  await page.getByTestId("knowledge-search-input").fill("React State Snapshots");
  await page.getByTestId("search-results").getByRole("link").filter({ has: page.getByRole("heading", { name: "React State Snapshots and Async Callbacks", exact: true }) }).click();
  await expect(page).toHaveURL(/docs\/frontend\/react-state-async-callbacks/);
  await page.reload();
  await expect(page.getByTestId("source-references")).toContainText("State as a Snapshot");
  const article = page.getByTestId("markdown-renderer");
  await expect(article).toContainText("setItems((current) => [...current, item])");
  await expect(article).toContainText("startedIn !== generation.current");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Take the six-question checkpoint" }).click();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
  for (let index = 0; index < 6; index++) {
    await expect(page.getByTestId("questionnaire-position")).toContainText(`Question ${index + 1} of 6`);
    await page.getByTestId(index === 0 ? "questionnaire-choice-misconception-one" : "questionnaire-choice-answer").click();
    await page.getByTestId("questionnaire-check").click();
    await expect(page.getByTestId("questionnaire-feedback")).toContainText(index === 0 ? "A later timer does not refresh a closure" : "Correct");
    await page.getByTestId(index === 5 ? "questionnaire-finish" : "questionnaire-next").click();
  }
  await expect(page.getByTestId("questionnaire-complete")).toBeVisible();
});
