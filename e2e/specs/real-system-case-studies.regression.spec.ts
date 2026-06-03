import { expect, test } from "@playwright/test";

test("@regression opens a real system case study with diagrams and interactive flow", async ({ page }) => {
  await test.step("open real cases from the home screen", async () => {
    await page.goto("/");
    await expect(page.getByTestId("path-home")).toBeVisible();
    await page.getByTestId("home-real-cases-link").click();
    await expect(page.getByTestId("path-detail")).toBeVisible();
    await expect(page).toHaveURL(/\/paths\/system-design-fundamentals#real-production-data-platforms$/);
    await expect(page.getByText("Real Production Data Platforms")).toBeVisible();
  });

  await test.step("open the Netflix case study", async () => {
    await page.getByTestId("path-node-document-system-design-netflix-data-feedback-loop").click();
    await expect(page.getByTestId("document-page")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Netflix Data Feedback Loop" })).toBeVisible();
    await expect(page.getByTestId("markdown-renderer")).toContainText("Core System Pressure");
    await expect(page.getByTestId("markdown-renderer")).toContainText("References");
  });

  await test.step("verify Mermaid and interactive architecture walkthrough", async () => {
    await expect(page.getByTestId("mermaid-block").first()).toBeVisible();
    await expect(page.getByTestId("mermaid-diagram").first()).toBeVisible();
    await expect(page.getByTestId("case-study-flow")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Capture member behavior" })).toBeVisible();

    await page.getByTestId("case-study-flow-step-next").click();
    await expect(page.getByRole("heading", { name: "Process streams in parallel" })).toBeVisible();
  });
});
