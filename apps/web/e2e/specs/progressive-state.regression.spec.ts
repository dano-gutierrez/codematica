import { expect, test } from "@playwright/test";

test("@regression follows Backend reservation review into progressive history practice", async ({ page }) => {
  await page.goto("/paths/backend-engineer-readiness");
  await page.getByTestId("path-node-exercise-system-design-reservation-boundary-checkpoint").click();
  const stages = [
    { answers: [
        "No matching row was acquired by that statement; it cannot infer sold out.",
        "Eligibility and abuse policy; one account does not prove one legitimate human.",
        "Reject the stale inventory transition and record/reconcile B’s payment outcome.",
        "Completion is ineligible; expiry may win the guarded transition.",
        "Enforce overlap exclusion for the same room; adjacent half-open stays may coexist.",
        "Commit the guarded transition to expired; elapsed time alone does not remove the hold from the constraint.",
      ], next: "/docs/software-engineering/progressive-state-history?path=backend-engineer-readiness" },
    { answers: [
        "A at time 4 remains 7; only the merge-time and later target balance includes B.",
        "B retains its earlier balance, returns None from retirement onward, and its ID cannot be reused.",
        "Reject before recording state or advancing the clock; a valid operation may still use that timestamp.",
        "The sequential bounded state/history contract; persistence, concurrency and real payments need separate design and tests.",
      ] },
  ];
  for (const stage of stages) {
    await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
    const correct = stage.answers.map(answer => page.getByRole("radio", { name: answer, exact: true })).reduce((a,b)=>a.or(b));
    for (let index=0; index<stage.answers.length; index++) {
      await expect(page.getByText(`Question ${index+1} of ${stage.answers.length}`,{exact:true})).toBeVisible();
      await expect(correct).toHaveCount(1);
      await correct.check();
      await page.getByRole("button",{ name: "Check answer", exact: true}).click();
      await expect(page.getByText("Correct",{exact:true})).toBeVisible();
      await page.getByRole("button",{ name: index===stage.answers.length-1?"Finish":"Next", exact: true}).click();
    }
    await expect(page.getByText("Score 100%",{exact:true})).toBeVisible();
    if (stage.next) {
      await expect(page.getByRole("link",{ name: "Next activity"})).toHaveAttribute("href",stage.next);
      await page.getByRole("link",{ name: "Next activity"}).click();
      await expect(page).toHaveURL(stage.next);
      await expect(page.getByRole("heading",{level:1})).toHaveText("Progressive State — Preserve History When Entities Merge");
      await expect(page.getByRole("heading",{ name: "Merge current state without rewriting history", exact: true})).toBeVisible();
      await page.getByTestId("document-next-node").click();
      await expect(page).toHaveURL("/practice/software-engineering/progressive-state-checkpoint?path=backend-engineer-readiness");
    } else await expect(page.getByRole("link",{ name: "Next activity"})).toHaveCount(0);
  }
});
