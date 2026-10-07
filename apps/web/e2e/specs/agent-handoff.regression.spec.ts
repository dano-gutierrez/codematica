import { expect, test } from "@playwright/test";

test("@regression follows evidence-bound handoff practice into risk governance", async ({ page }) => {
  await page.goto("/paths/ai-engineering-langfuse-langchain");
  await page.getByTestId("path-node-document-ai-engineering-evidence-first-agent-handoffs").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Evidence-First Agent Handoffs");
  await expect(page.getByTestId("source-references")).toContainText("Learn Harness Engineering");
  await expect(page.getByTestId("source-references")).toContainText("Architecture contract review in saas_tmplt");
  await expect(page.getByRole("heading", { name:"Audit contract drift without rewriting the contract",exact:true })).toBeVisible();
  await expect(page.getByTestId("markdown-renderer")).toContainText("silently weakening an approved constraint");
  await expect(page.getByRole("heading", { name: "Bound retrieval without hiding missing evidence", exact: true })).toBeVisible();
  await expect(page.getByTestId("source-references")).toContainText("TSIndex — Scoped Structural Navigation");
  await expect(page.getByTestId("source-references")).toContainText("Codebase Memory MCP — v0.11.0 Index Contracts");
  await expect(page.getByTestId("markdown-renderer")).toContainText("a symbol-replacement write tool over MCP");
  await expect(page.getByRole("heading", { name: "Run an original resume-boundary lab", exact: true })).toBeVisible();
  await page.getByTestId("document-next-node").click();
  await expect(page).toHaveURL(/agent-handoff-checkpoint\?path=ai-engineering-langfuse-langchain/);
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
  const answers = [
    "Reuse the assessment for evidence review; success is not approval or correctness.",
    "Preserve the old receipt and obtain an assessment bound to current sources.",
    "It is untrusted source data; tool authority still comes from the authorized workflow.",
    "An observation under those conditions; it does not isolate architecture from time and cost.",
  ];
  const correctAnswer = answers.map(answer => page.getByRole("radio", { name: answer, exact: true })).reduce((a, b) => a.or(b));
  for (let index = 0; index < answers.length; index++) {
    await expect(page.getByText(`Question ${index + 1} of 4`, { exact: true })).toBeVisible();
    await expect(correctAnswer).toHaveCount(1);
    await correctAnswer.check();
    await page.getByRole("button", { name: "Check answer", exact: true }).click();
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: index === 3 ? "Finish" : "Next", exact: true }).click();
  }
  await expect(page.getByText("Score 100%", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next activity" })).toHaveAttribute("href", "/docs/ai-engineering/llm-production-risk-governance?path=ai-engineering-langfuse-langchain");
  await page.getByRole("link", { name: "Next activity" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("LLM Production Risk And Governance");
});
