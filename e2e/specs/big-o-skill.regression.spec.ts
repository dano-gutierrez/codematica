import { expect, test } from "@playwright/test";

test("@regression mobile user learns Big O with animation, practice, and reused interview nodes", async ({ page }) => {
  await page.goto("/paths/algorithmic-complexity-big-o");

  await expect(page.getByTestId("path-detail")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Algorithmic Complexity And Big O" })).toBeVisible();
  await expect(page.getByTestId("path-node-document-programming-big-o-program-flow")).toContainText("Big O Program Flow");
  await expect(page.getByTestId("path-node-interview-amazon-two-sum-product-pair")).toContainText("Interview problem");

  await page.getByTestId("path-node-document-programming-big-o-program-flow").click();
  await expect(page.getByTestId("document-page")).toBeVisible();
  await expect(page.getByTestId("complexity-flow-block")).toContainText("Membership Lookup Tradeoff");
  await expect(page.getByRole("button", { name: "List scan" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Prebuilt set" }).click();
  await expect(page.getByRole("button", { name: "Prebuilt set" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("complexity-flow-operation-count")).toContainText("Operations 1");
  await page.getByTestId("complexity-flow-step-next").click();
  await expect(page.getByTestId("complexity-flow-block")).toContainText("Return the membership result");

  await page.goto("/practice/programming/big-o-dominant-term-cloze?path=algorithmic-complexity-big-o");
  await expect(page.getByTestId("practice-page")).toBeVisible();
  await page.getByLabel("Answer").fill("O(n^2)");
  await page.getByRole("button", { name: /Check answer/i }).click();
  await expect(page.getByTestId("cloze-feedback")).toContainText("Correct");

  await page.goto("/docs/programming/big-o-production-tradeoffs?path=algorithmic-complexity-big-o");
  await page.getByTestId("document-next-node").click();
  await expect(page).toHaveURL(/\/interviews\/amazon\/two-sum-product-pair\?path=algorithmic-complexity-big-o/);
  await expect(page.getByTestId("interview-question-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Two Sum Product Pair" })).toBeVisible();
});
