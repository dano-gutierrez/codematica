import { expect, test } from "@playwright/test";
import { analysisFixture, editorialFixture } from "../../../../packages/core/src/test/linkedin-fixture";

test.skip(process.env.EDITORIAL_E2E !== "1", "Run npm run e2e:linkedin for isolated Supabase mocks");

test("@regression admin reviews, refines and approves an exact revision", async ({ page }) => {
  const data = structuredClone(editorialFixture);
  const actions: string[] = [];
  await page.route("**/rest/v1/rpc/linkedin_*", async (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop();
    if (name === "linkedin_is_admin") return route.fulfill({ json: true });
    if (name === "linkedin_snapshot") return route.fulfill({ json: data });
    if (name === "linkedin_review") {
      const args = route.request().postDataJSON(); actions.push(args.p_action);
      expect(args.p_expected_revision).toBe(data.posts[0].current_revision_id);
      if (args.p_action === "refine") data.revisions.push({ ...data.revisions[0], id: "20000000-0000-4000-8000-000000000002", kind: "refine", parent_revision_id: data.revisions[0].id, body: analysisFixture.rewrittenPost, analysis: analysisFixture });
      if (args.p_action === "use") data.posts[0].current_revision_id = args.p_proposal_id;
      if (args.p_action === "approve") { data.posts[0].status = "approved"; data.posts[0].approved_revision_id = data.posts[0].current_revision_id; data.posts[0].approved_at = "2026-09-29T00:00:00Z"; }
      return route.fulfill({ json: null });
    }
    throw new Error(`Unexpected editorial RPC ${name}`);
  });
  await page.goto("/admin/linkedin");
  await expect(page.getByTestId("linkedin-post-list")).toBeVisible();
  await page.getByRole("button", { name: /Retries need a budget/ }).click();
  await expect(page.getByTestId("linkedin-post-list")).toBeHidden();
  await expect(page.getByTestId("linkedin-body")).toHaveValue(editorialFixture.revisions[0].body);
  await page.getByRole("button", { name: "Refine", exact: true }).click();
  await page.getByRole("button", { name: "Use revision" }).click();
  await expect(page.getByTestId("linkedin-body")).toHaveValue(analysisFixture.rewrittenPost);
  await page.screenshot({ path: test.info().outputPath("editorial-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Approve & queue" }).click();
  await expect(page.getByTestId("linkedin-body")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Return to review" })).toBeVisible();
  expect(actions).toEqual(["refine", "use", "approve"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Back to collection" }).click();
  await expect(page.getByTestId("linkedin-post-list")).toBeVisible();
  await expect(page.getByTestId("linkedin-review")).toHaveCount(0);
});

test("@regression ordinary users cannot load the editorial collection", async ({ page }) => {
  let snapshots = 0;
  await page.route("**/rest/v1/rpc/linkedin_*", async (route) => {
    if (route.request().url().endsWith("linkedin_snapshot")) snapshots++;
    await route.fulfill({ json: false });
  });
  await page.goto("/admin/linkedin");
  await expect(page.getByRole("heading", { name: "Admin access required" })).toBeVisible();
  expect(snapshots).toBe(0);
  await expect(page.getByTestId("linkedin-post-list")).toHaveCount(0);
});
