import { expect, test } from "@playwright/test";
import { analysisFixture, editorialFixture, preparationFixture } from "../../../../packages/core/src/test/linkedin-fixture";

test.skip(process.env.EDITORIAL_E2E !== "1", "Run npm run e2e:linkedin for isolated Supabase mocks");

test("@regression admin reviews, refines and approves an exact revision", async ({ page }) => {
  const data = structuredClone(editorialFixture); let overviewVersion = 0;
  const actions: string[] = [];
  await page.route("**/rest/v1/rpc/linkedin_*", async (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop();
    if (name === "linkedin_is_admin") return route.fulfill({ json: true });
    if (name === "linkedin_overview") return route.fulfill({ json: { ...data, revisions: [], preparations: [], version: String(++overviewVersion) } });
    if (name === "linkedin_detail") return route.fulfill({ json: data });
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
    if (route.request().url().endsWith("linkedin_overview")) snapshots++;
    await route.fulfill({ json: false });
  });
  await page.goto("/admin/linkedin");
  await expect(page.getByRole("heading", { name: "Admin access required" })).toBeVisible();
  expect(snapshots).toBe(0);
  await expect(page.getByTestId("linkedin-post-list")).toHaveCount(0);
});

test("@regression creates formatted manual text, preserves a failed submission and requires analysis", async ({ page }) => {
  const data = structuredClone(editorialFixture); let overviewVersion = 0; data.posts = []; data.revisions = [];
  const creates: Record<string, string>[] = []; const actions: string[] = [];
  await page.route("**/rest/v1/rpc/linkedin_*", async (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop();
    if (name === "linkedin_is_admin") return route.fulfill({ json: true });
    if (name === "linkedin_overview") return route.fulfill({ json: { ...data, revisions: [], preparations: [], version: String(++overviewVersion) } });
    if (name === "linkedin_detail") return route.fulfill({ json: data });
    const args = route.request().postDataJSON();
    if (name === "linkedin_create") {
      creates.push(args);
      if (creates.length === 1) return route.fulfill({ status: 400, json: { message: "Try again with this draft" } });
      data.posts = [{ ...editorialFixture.posts[0], origin: "manual", title: args.p_title, topic: args.p_topic }];
      data.revisions = [{ ...editorialFixture.revisions[0], body: args.p_body, sources: [] }];
      data.jobs = [{ id: "40000000-0000-4000-8000-000000000001", post_id: data.posts[0].id, revision_id: data.revisions[0].id, kind: "refine", status: "pending", attempts: 0, error: null, result_revision_id: null, created_at: "2026-09-30T00:00:00Z" }];
      return route.fulfill({ json: data.posts[0].id });
    }
    if (name === "linkedin_review") {
      actions.push(args.p_action);
      if (args.p_action === "use") data.posts[0].current_revision_id = args.p_proposal_id;
      if (args.p_action === "approve") { data.posts[0].status = "approved"; data.posts[0].approved_revision_id = data.posts[0].current_revision_id; }
      return route.fulfill({ json: null });
    }
    throw new Error(`Unexpected RPC ${name}`);
  });
  await page.goto("/admin/linkedin");
  await page.getByTestId("linkedin-create").click();
  await expect(page.getByTestId("linkedin-create-submit")).toBeDisabled();
  await page.getByTestId("linkedin-create-title").fill("My manual lesson");
  await page.getByTestId("linkedin-create-topic").fill("Systems");
  const text = page.getByTestId("linkedin-create-body"); await text.fill("Hello engineers 🚀\n#Systems https://example.test");
  await text.selectText(); await page.getByRole("button", { name: "Bold", exact: true }).click();
  await expect(text).toHaveValue("𝗛𝗲𝗹𝗹𝗼 𝗲𝗻𝗴𝗶𝗻𝗲𝗲𝗿𝘀 🚀\n#Systems https://example.test");
  await page.screenshot({ path: test.info().outputPath("manual-create-mobile.png"), fullPage: true });
  await page.getByTestId("linkedin-create-submit").click();
  await expect(page.getByTestId("linkedin-admin").getByRole("alert")).toHaveText("Try again with this draft");
  await page.getByTestId("linkedin-create-submit").click();
  await expect(page.getByTestId("linkedin-review")).toBeVisible();
  expect(creates[0]).toEqual(creates[1]);
  await expect(page.getByRole("button", { name: "Approve & queue" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Preparation / verification queued" })).toBeDisabled();
  await page.reload(); await page.getByRole("button", { name: /My manual lesson/ }).click();
  await expect(page.getByTestId("linkedin-body")).toHaveValue(creates[1].p_body);
  data.jobs[0].status = "succeeded";
  data.revisions.push({ ...data.revisions[0], id: "20000000-0000-4000-8000-000000000002", parent_revision_id: data.revisions[0].id, kind: "refine", body: analysisFixture.rewrittenPost, analysis: analysisFixture, prompt_hash: "a".repeat(64) });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByRole("button", { name: "Approve & queue" })).toBeDisabled();
  await page.getByRole("button", { name: "Use revision" }).click();
  await page.getByRole("button", { name: "Approve & queue" }).click();
  await expect(page.getByTestId("linkedin-body")).toBeDisabled(); expect(actions).toEqual(["use", "approve"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("manual-post-mobile.png"), fullPage: true });
});


test("@regression reviews held local preparation without adopting or approving it", async ({ page }) => {
  const data = structuredClone(editorialFixture); let version = 0; let details = 0;
  data.posts[0].preparation_required = true; data.posts[0].preparation_outcome = "held";
  data.preparations = [preparationFixture]; const overrides: Record<string, string>[] = [];
  await page.route("**/rest/v1/rpc/linkedin_*", async (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop();
    if (name === "linkedin_is_admin") return route.fulfill({ json: true });
    if (name === "linkedin_overview") return route.fulfill({ json: { ...data, revisions: [], preparations: [], version: String(++version) } });
    if (name === "linkedin_detail") { details++; return route.fulfill({ json: data }); }
    if (name === "linkedin_preparation_action") { overrides.push(route.request().postDataJSON()); return route.fulfill({ json: null }); }
    throw new Error(`Unexpected RPC ${name}`);
  });
  await page.goto("/admin/linkedin");
  await expect(page.getByRole("button", { name: /Retries need a budget/ })).toBeVisible(); expect(details).toBe(0);
  await page.getByRole("button", { name: /Retries need a budget/ }).click();
  await expect(page.getByTestId("linkedin-preparation")).toBeVisible(); expect(details).toBe(1);
  await expect(page.getByTestId("linkedin-body")).toHaveValue(data.revisions[0].body);
  await expect(page.getByRole("button", { name: "Approve & queue" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Send to Codex with flags" })).toBeDisabled();
  await page.getByLabel("Reason for sending").fill("I will supply the missing evidence during verification");
  await page.getByRole("button", { name: "Send to Codex with flags" }).click();
  await expect.poll(() => overrides.length).toBe(1);
  expect(overrides[0]).toMatchObject({p_preparation_id:preparationFixture.id,p_action:"send_with_flags",p_expected_revision:data.posts[0].current_revision_id});
  await expect(page.getByRole("button", { name: "Approve & queue" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:test.info().outputPath("local-preparation-mobile.png"),fullPage:true});
});
