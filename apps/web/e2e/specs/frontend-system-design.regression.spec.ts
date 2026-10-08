import { expect, test } from "@playwright/test";

const pathSlug = "frontend-system-design-interviews";
const prefix = "frontend/system-design-";
const cases = [
  { topic: "learning-game", company: "Amazon", diagrams: 1, source: "https://www.reddit.com/r/cscareerquestions/comments/1iudddy/rainforest_loop_experience_frontend_l5_12_yoe/", evidence: "I traced a timed-out answer submission and showed how retrying avoids duplicate progress." },
  { topic: "kanban", company: "Atlassian", diagrams: 1, source: "https://discuss.frontendlead.com/t/atlassian-frontend-engineer-p40-onsite/2192", evidence: "I showed that a failed move cannot overwrite a newer confirmed change and provided a keyboard alternative." },
  { topic: "shopping", company: "Wayfair", diagrams: 0, source: "https://saumyadip25.medium.com/wayfair-software-engineer-3-frontend-interview-experience-13112d221611", evidence: "I defined guest/account cart merging and traced a price or inventory change before purchase." },
  { topic: "file-manager", company: "Adobe", diagrams: 1, source: "https://discuss.frontendlead.com/t/adobe-senior-frontend-engineer-gen-studio-full-loop/3316", evidence: "I separated stable file identity from paths and traced a move, failed upload, or access revocation." },
  { topic: "messaging", company: "Salesforce", diagrams: 0, source: "https://saumyadip25.medium.com/salesforce-smts-frontend-interview-experience-5cae01d6a594", evidence: "I distinguished acceptance, delivery, and reading, and traced a lost acknowledgment without duplicate messages." },
  { topic: "calendar", company: "Uber", diagrams: 0, source: "https://leetcode.com/discuss/post/1746929/uber-l4-nyc-did-not-get-offer/", evidence: "I distinguished recurring series from occurrences and traced a time-zone or concurrent-edit case." },
];

test("@regression discovers the frontend system design path and shared rehearsal rubric", async ({ page }) => {
  await page.goto("/browse");
  await page.getByTestId("knowledge-search-input").fill("Frontend System Design Interview Rehearsal");
  await expect(page.getByTestId("search-results").getByRole("heading", { name: "Frontend System Design Interview Rehearsal", exact: true })).toBeVisible();
  await page.goto("/paths");
  await page.getByTestId(`path-card-${pathSlug}`).getByRole("link", { name: /Open path/i }).click();
  await page.getByTestId("path-node-document-frontend-system-design-interview-rehearsal").click();
  await expect(page.getByRole("heading", { name: "Review evidence", exact: true })).toBeVisible();
  await expect(page.getByTestId("markdown-renderer")).toContainText("not an employer hiring threshold");
  await expect(page.getByTestId("document-next-node")).toHaveAttribute("href", `/docs/${prefix}learning-game?path=${pathSlug}`);
});

for (const [index, scenario] of cases.entries()) {
  test(`@regression reads ${scenario.company} report provenance and completes its whiteboard rehearsal`, async ({ page }) => {
    await test.step("open the attributed brief and render its diagrams", async () => {
      await page.goto(`/paths/${pathSlug}`);
      await page.getByTestId(`path-node-document-frontend-system-design-${scenario.topic}`).click();
      await expect(page.getByRole("heading", { level: 1 })).toContainText(scenario.company);
      await expect(page.getByTestId("markdown-renderer")).toContainText("not independently verified");
      await page.getByTestId("source-references-toggle").click();
      await expect(page.getByTestId("source-references").getByRole("link")).toHaveAttribute("href", scenario.source);
      await expect(page.getByTestId("mermaid-diagram")).toHaveCount(scenario.diagrams);
      await expect(page.getByTestId("mermaid-error")).toHaveCount(0);
      if (scenario.topic === "learning-game") {
        await expect(page.getByTestId("mermaid-diagram")).toContainText("Failure, retain answer");
        await expect(page.getByTestId("mermaid-diagram").getByText(";", { exact: true })).toHaveCount(0);
      }
      await page.reload();
      await expect(page.getByTestId("document-next-node")).toHaveAttribute("href", `/practice/${prefix}${scenario.topic}-lab?path=${pathSlug}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (scenario.diagrams) {
        await expect(page.getByTestId("mermaid-diagram")).toHaveCount(scenario.diagrams);
        const diagram = page.getByRole("group", { name: "Diagram", exact: true });
        await diagram.focus();
        await diagram.press("ArrowRight");
        await expect.poll(() => diagram.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
        await page.screenshot({ path: test.info().outputPath(`${scenario.topic}-brief.png`), fullPage: true });
      }
    });

    await test.step("complete only after a prediction and all seven evidence checks", async () => {
      await page.getByTestId("document-next-node").click();
      const lab = page.getByTestId("guided-lab-session");
      await expect(lab).toContainText("not automatically graded");
      await expect(page.getByTestId("guided-lab-complete")).toBeDisabled();
      await page.getByRole("radio", { name: "An uncertain request outcome or recovery gap.", exact: true }).check();
      const checkboxes = lab.getByRole("checkbox");
      await expect(checkboxes).toHaveCount(7);
      for (let item = 0; item < 6; item++) await checkboxes.nth(item).check();
      await expect(page.getByTestId("guided-lab-complete")).toBeDisabled();
      await page.getByRole("checkbox", { name: scenario.evidence, exact: true }).check();
      await page.getByTestId("guided-lab-complete").click();
      await expect(page.getByRole("heading", { name: "Lab complete.", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const next = cases[index + 1];
      if (next) {
        await expect(page.getByRole("link", { name: "Next activity", exact: true })).toHaveAttribute("href", `/docs/${prefix}${next.topic}?path=${pathSlug}`);
        await page.getByRole("link", { name: "Next activity", exact: true }).click();
        await expect(page.getByRole("heading", { level: 1 })).toContainText(next.company);
      } else {
        await expect(page.getByRole("link", { name: "Next activity", exact: true })).toHaveCount(0);
        await page.getByRole("button", { name: "Practice again", exact: true }).click();
        await expect(lab.getByRole("checkbox", { checked: true })).toHaveCount(0);
        await expect(page.getByTestId("guided-lab-complete")).toBeDisabled();
      }
    });
  });
}
