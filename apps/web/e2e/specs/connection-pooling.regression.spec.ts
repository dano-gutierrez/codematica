import { expect, test } from "@playwright/test";

test("@regression studies connection pooling diagrams, calculations, and production decisions", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaQuestionnaireRandom?: () => number }).__codematicaQuestionnaireRandom = () => 0.999999;
    (window as Window & { __codematicaPassiveFlashcardRandom?: () => number }).__codematicaPassiveFlashcardRandom = () => 0.999999;
  });

  await test.step("find the lesson and render its diagrams on a phone", async () => {
    await page.goto("/browse");
    await page.getByTestId("knowledge-search-input").fill("connection pooling");
    await expect(page.getByTestId("search-results")).toContainText("PostgreSQL Connection Pools And Production Resilience");
    await page.goto("/paths/database-indexes-and-search");
    await page.getByTestId("path-node-document-databases-postgres-connection-pooling").click();
    await expect(page.getByTestId("document-page")).toContainText("The Reported Titan Scenario");
    await expect(page.getByTestId("mermaid-diagram")).toHaveCount(3);
    await expect(page.getByTestId("mermaid-error")).toHaveCount(0);
    await expect(page.getByTestId("document-next-node")).toHaveAttribute("href", "/practice/databases/postgres-connection-pooling-questionnaire?path=database-indexes-and-search");
    await expect(page.getByTestId("markdown-renderer").getByRole("link", { name: "interactive checkpoint", exact: true })).toHaveAttribute("href", "/practice/databases/postgres-connection-pooling-questionnaire?path=database-indexes-and-search");
    await page.getByTestId("markdown-renderer").getByRole("link", { name: "interactive checkpoint", exact: true }).click();
    await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
  });

  await test.step("complete the 12-question checkpoint with feedback", async () => {
    const choices: Record<number, string> = {
      1: "Reuse a backend after each completed transaction; excess simultaneous work waits or fails admission.",
      6: "Test the exact pooler release, driver protocols, session features, isolation, and reconnect behavior.",
      8: "Verify provider and Kubernetes timing; preStop consumes grace time and an interruption may allow less usable time.",
      9: "Keep a tested stable-capacity baseline, cap the spot tier, spread replicas, and bound reconnection and retries.",
      10: "Reduce expensive or blocked work and transaction duration; evaluate concurrency limits against measured latency.",
      11: "Treat the outcome as uncertain and reconcile using durable operation identity or a proven idempotent retry design.",
    };
    const numbers: Record<number, string> = { 2: "10", 3: "1,160", 4: "600", 5: "24" };
    for (let position = 1; position <= 12; position += 1) {
      await expect(page.getByTestId("questionnaire-position")).toHaveText(`Question ${position} of 12`);
      if (choices[position]) await page.getByLabel(choices[position], { exact: true }).check();
      if (numbers[position]) await page.getByTestId("questionnaire-cloze-answer-input").fill(numbers[position]);
      if (position === 7) {
        // Exercise the ordering controls, then restore the correct sequence.
        await page.getByRole("button", { name: "Move Await closure of every application pool up", exact: true }).click();
        await page.getByRole("button", { name: "Move Await closure of every application pool down", exact: true }).click();
      }
      if (position === 12) {
        for (const [mode, label] of [
          ["session", "Client disconnects"],
          ["transaction", "Transaction finishes"],
          ["statement", "Statement finishes; explicit multi-statement transactions disallowed"],
        ]) {
          await page.getByTestId(`questionnaire-match-${mode}`).click();
          await page.getByRole("option", { name: label, exact: true }).click();
        }
      }
      await page.getByTestId("questionnaire-check").click();
      if (position === 2) {
        await expect(page.getByTestId("questionnaire-feedback")).toContainText("Review this");
        await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct answer: 8");
        await expect(page.getByTestId("questionnaire-feedback")).toContainText("exceeds the ceiling");
      } else {
        await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
      }
      await page.getByTestId(position === 12 ? "questionnaire-finish" : "questionnaire-next").click();
    }
    await expect(page.getByTestId("questionnaire-complete")).toContainText("Score 92%");
  });

  await test.step("find the added passive review cards", async () => {
    await page.goto("/paths/database-indexes-and-search/flashcards");
    await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
    for (const index of [11, 23, 35]) {
      await page.getByTestId(`passive-flashcard-card-${index}`).scrollIntoViewIfNeeded();
    }
    await expect(page.getByTestId("passive-flashcard-card-40")).toContainText("Clients Are Not Backends");
  });
});
