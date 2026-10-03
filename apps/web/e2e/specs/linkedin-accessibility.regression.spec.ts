import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { analysisFixture, editorialFixture } from "../../../../packages/core/src/test/linkedin-fixture";

test.skip(process.env.EDITORIAL_E2E !== "1", "Run the isolated editorial lane with synthetic data");

async function expectTarget(locator: import("@playwright/test").Locator, size: number) {
  const bounds = await locator.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(size);
  expect(bounds?.height).toBeGreaterThanOrEqual(size);
}

for (const width of [320, 390, 768, 1024, 1180, 1440]) {
  test(`@regression editorial touch and keyboard actions reflow at ${width}px`, async ({ page, isMobile }) => {
    const data = structuredClone(editorialFixture);
    data.revisions[0].analysis = { ...analysisFixture, verificationNotes: ["Verify the limit"] };
    // Any write indicates a defect: this journey only edits and discards browser-local input.
    await page.route("**/rest/v1/rpc/linkedin_*", async (route) => {
      if (route.request().url().endsWith("linkedin_is_admin")) return route.fulfill({ json: true });
      if (route.request().url().endsWith("linkedin_snapshot")) return route.fulfill({ json: data });
      throw new Error("Accessibility checks must not mutate editorial data");
    });
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/admin/linkedin");
    const draft = page.getByTestId(`linkedin-post-${data.posts[0].id}`);
    await draft.click();
    const heading = page.getByRole("heading", { name: data.posts[0].title });
    await expect(heading).toBeFocused();
    const compact = width <= 1024;
    if (compact) await expect(page.getByTestId("linkedin-post-list")).toBeHidden();
    else await expect(page.getByTestId("linkedin-post-list")).toBeVisible();
    const touch = isMobile || width < 1024;
    for (const name of ["Save revision", "Refine post", "Reject post", "Approve & queue", "Bold", "Plain text"]) {
      const button = page.getByRole("button", { name, exact: true });
      await expectTarget(button, touch ? 48 : 44);
      if (touch) await expect(button.getByTestId("ui-button-label")).toBeVisible();
    }
    if (!touch) {
      const refine = page.getByRole("button", { name: "Refine post", exact: true });
      await refine.hover();
      await expect(refine.getByTestId("ui-button-tooltip")).toBeVisible();
      await refine.getByTestId("ui-button-tooltip").hover();
      await expect(refine.getByTestId("ui-button-tooltip")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(refine.getByTestId("ui-button-tooltip")).toBeHidden();
      await refine.focus();
      await expect(refine.getByTestId("ui-button-tooltip")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(refine).toBeFocused();
    }
    await expectTarget(page.getByTestId("linkedin-verification-control"), touch ? 48 : 20);
    await page.getByTestId("linkedin-verification-control").click();
    await expect(page.getByRole("checkbox")).toBeChecked();
    await page.getByTestId("linkedin-body").fill("Keep these unsaved notes");
    await expect(page.getByTestId("linkedin-editor-save-state")).toContainText("Save or discard to switch drafts");
    await page.getByRole("button", { name: "Discard changes" }).click();
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    // Desktop can also return to its collection through a viewport change.
    await page.setViewportSize({ width: Math.min(width, 768), height: 844 });
    await page.getByRole("button", { name: "Back to collection" }).click();
    await expect(draft).toBeFocused();
    await page.getByTestId("linkedin-create").click();
    await expect(page.getByTestId("linkedin-create-title")).toBeFocused();
    const titleSize = await page.getByTestId("linkedin-create-title").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(titleSize).toBeGreaterThanOrEqual(16);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByTestId("linkedin-create")).toBeFocused();
    await page.setViewportSize({ width, height: 844 });
    await draft.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: test.info().outputPath(`editorial-${width}.png`), fullPage: true });
    await page.getByRole("group", { name: "Post actions", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath(`editorial-controls-${width}.png`) });
  });
}

test("@regression editorial text enlargement and a short landscape viewport keep every action reachable", async ({ page }) => {
  await page.route("**/rest/v1/rpc/linkedin_*", async (route) => {
    if (route.request().url().endsWith("linkedin_is_admin")) return route.fulfill({ json: true });
    if (route.request().url().endsWith("linkedin_snapshot")) return route.fulfill({ json: editorialFixture });
    throw new Error("Reflow checks must not mutate editorial data");
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/admin/linkedin");
  await page.getByTestId(`linkedin-post-${editorialFixture.posts[0].id}`).click();
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  for (const name of ["Bold", "Plain text", "Refine post", "Approve & queue"]) {
    const action = page.getByRole("button", { name, exact: true });
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeInViewport();
    await expectTarget(action, 48);
  }
  expect(await page.getByTestId("linkedin-body").evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBe(32);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("editorial-large-text.png"), fullPage: true });
});
