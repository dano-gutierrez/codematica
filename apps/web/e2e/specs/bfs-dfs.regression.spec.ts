import { expect, test } from "@playwright/test";

test("@regression studies BFS and DFS, reviews the feed, and opens the dual-solution interview", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaPassiveFlashcardRandom?: () => number }).__codematicaPassiveFlashcardRandom = () => 0.999999;
  });

  await page.goto("/paths");
  const pathCard = page.getByTestId("path-card-breadth-first-and-depth-first-search");
  await expect(pathCard).toContainText("Breadth-First Search And Depth-First Search");
  await pathCard.getByRole("link", { name: /Open path/i }).click();

  await expect(page.getByTestId("path-node-document-programming-bfs-dfs-fundamentals")).toBeVisible();
  await page.getByTestId("path-node-document-programming-bfs-dfs-fundamentals").click();
  await expect(page.getByTestId("document-page")).toContainText("Choose By The Question");
  await expect(page.getByTestId("document-page")).toContainText("export function bfs");

  await page.goto("/paths/breadth-first-and-depth-first-search");
  await page.getByTestId("path-flashcard-feed-link").click();
  await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("passive-flashcard-card-0")).toContainText("BFS Uses A Queue");

  await page.goto("/interviews/google/number-of-islands");
  await expect(page.getByRole("heading", { name: "Number Of Islands" })).toBeVisible();
  await expect(page.getByTestId("interview-question-page")).toContainText(/breadth-first/i);
  await expect(page.getByTestId("interview-question-page")).toContainText(/depth-first/i);
});
