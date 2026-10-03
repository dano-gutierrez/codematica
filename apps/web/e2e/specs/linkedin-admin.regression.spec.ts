import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { analysisFixture, editorialFixture } from "../../../../packages/core/src/test/linkedin-fixture";

test.skip(process.env.EDITORIAL_E2E !== "1", "Run npm run e2e:linkedin for isolated Supabase mocks");

test("@regression editorial design stays compact, accessible and protects unsaved edits", async ({ page }) => {
  const data = structuredClone(editorialFixture);
  const titles = [
    "A benchmark needs context", "A timeout does not prove nothing happened",
    "A cache key can become a privacy boundary", "Name the graph before solving the grid",
    "Type annotations do not validate requests", "A cheaper update still needs maintenance",
    "A model metric needs a version", "Imports can work before your app starts",
    "Abort stale work, then protect the result", "Invalidation reaches beyond the current page",
  ];
  const topics = ["ML systems", "Production engineering", "Frontend", "Algorithms", "Type contracts", "PostgreSQL", "AI engineering"];
  const body = "A benchmark needs context.\n\nA measured result depends on the workload, environment, data, and measurement method. Record those conditions and verify correctness before comparing speeds. Repetition helps reveal variability, but it does not fix a comparison between different tasks.\n\nInclude the workload, correctness checks, and enough repetitions to understand variability. A useful benchmark is one another engineer can reconstruct.";
  data.posts = Array.from({ length: 100 }, (_, i) => ({
    ...editorialFixture.posts[0], id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    current_revision_id: `20000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    title: titles[i % titles.length], topic: topics[i % topics.length],
  }));
  data.revisions = data.posts.map((p) => ({ ...editorialFixture.revisions[0], post_id: p.id, id: p.current_revision_id, body }));
  data.settings.publishing_enabled = true;
  await page.route("**/rest/v1/rpc/linkedin_*", async (route) => {
    if (route.request().url().endsWith("linkedin_is_admin")) return route.fulfill({ json: true });
    if (route.request().url().endsWith("linkedin_snapshot")) return route.fulfill({ json: data });
    throw new Error("Visual preview must not mutate editorial data");
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/linkedin");
  await page.getByTestId(`linkedin-post-${data.posts[0].id}`).click();
  await expect(page.getByTestId("linkedin-worker-details")).not.toHaveAttribute("open");
  await expect(page.getByTestId("linkedin-sources")).not.toHaveAttribute("open");
  await expect(page.getByTestId("linkedin-first-comment")).not.toHaveAttribute("open");
  const actions = page.getByRole("group", { name: "Post actions" });
  const refine = actions.getByRole("button", { name: "Refine post" });
  await refine.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(refine.getByTestId("ui-button-label")).toBeVisible();
  expect(await refine.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
  await page.getByTestId("linkedin-body").fill("An unsaved lesson");
  await expect(page.getByTestId(`linkedin-post-${data.posts[1].id}`)).toBeDisabled();
  await expect(page.getByRole("button", { name: "Approve & queue" })).toBeDisabled();
  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.getByTestId("linkedin-body")).toHaveValue(body);
  await expect(page.getByTestId(`linkedin-post-${data.posts[1].id}`)).toBeEnabled();
  await expect(page.getByTestId("linkedin-editor-save-state")).toHaveText("Saved");
  await page.getByTestId("linkedin-body").focus();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
  await page.screenshot({ path: test.info().outputPath("linkedin-desktop.png"), fullPage: true });
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("button", { name: "Approve & queue" })).toBeVisible();
    if (width === 390) {
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
      await page.screenshot({ path: test.info().outputPath("linkedin-phone.png"), fullPage: true });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId("linkedin-comment-toggle").click();
  await page.getByTestId("linkedin-comment").fill("Unsaved comment");
  await expect(page.getByRole("button", { name: "Back to collection" })).toBeDisabled();
  await page.getByRole("button", { name: "Discard changes" }).click();
  await page.getByRole("button", { name: "Back to collection" }).click();
  await expect(page.getByTestId("linkedin-post-list")).toBeVisible();
  await page.getByTestId("linkedin-search").fill("timeout");
  await expect(page.getByTestId(`linkedin-post-${data.posts[0].id}`)).toHaveCount(0);
});

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
  await page.getByRole("button", { name: "Refine post", exact: true }).click();
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

test("@regression creates formatted manual text, preserves a failed submission and requires analysis", async ({ page }) => {
  const data = structuredClone(editorialFixture); data.posts = []; data.revisions = [];
  const creates: Record<string, string>[] = []; const actions: string[] = [];
  await page.route("**/rest/v1/rpc/linkedin_*", async (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop();
    if (name === "linkedin_is_admin") return route.fulfill({ json: true });
    if (name === "linkedin_snapshot") return route.fulfill({ json: data });
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
  await expect(page.getByRole("button", { name: "Refinement queued" })).toBeDisabled();
  await page.reload(); await page.getByRole("button", { name: /My manual lesson/ }).click();
  await expect(page.getByTestId("linkedin-body")).toHaveValue(creates[1].p_body);
  data.jobs[0].status = "succeeded";
  data.revisions.push({ ...data.revisions[0], id: "20000000-0000-4000-8000-000000000002", parent_revision_id: data.revisions[0].id, kind: "refine", body: analysisFixture.rewrittenPost, analysis: analysisFixture, prompt_hash: "a".repeat(64) });
  await page.getByRole("button", { name: "Refresh posts", exact: true }).click();
  await expect(page.getByRole("button", { name: "Approve & queue" })).toBeDisabled();
  await page.getByRole("button", { name: "Use revision" }).click();
  await page.getByRole("button", { name: "Approve & queue" }).click();
  await expect(page.getByTestId("linkedin-body")).toBeDisabled(); expect(actions).toEqual(["use", "approve"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("manual-post-mobile.png"), fullPage: true });
});
