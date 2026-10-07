import { expect, test } from "@playwright/test";

test("@regression reads sourced keypad contracts and finishes bounded dictionary practice", async ({
  page,
}) => {
  await page.goto("/paths/coding-interview-pattern-practice");
  await page
    .getByTestId("path-node-document-programming-keypad-dictionary-search")
    .click();
  await expect(page).toHaveURL(
    "/docs/programming/keypad-dictionary-search?path=coding-interview-pattern-practice",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Keypad Dictionary Search — Bound The Branch And Preserve The Word",
  );
  for (const heading of [
    "Define the closed dictionary",
    "Separate a prefix from a word",
    "Restore the branch state",
    "Run the original reference",
    "Choose the cost and evidence boundary",
  ]) {
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  const sources = page.getByTestId("source-references");
  await expect(sources).toBeVisible();
  await page.getByTestId("source-references-toggle").click();
  await expect(
    sources.getByRole("link", {
      name: "Python 3.13 — Mutable Sequences And Mappings · Python Software Foundation",
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    "https://docs.python.org/3.13/library/stdtypes.html",
  );
  await expect(
    sources.getByRole("link", {
      name: "Python 3.13 — Finite Cartesian Product Fixtures · Python Software Foundation",
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    "https://docs.python.org/3.13/library/itertools.html#itertools.product",
  );
  await expect(page.getByTestId("document-next-node")).toHaveAttribute(
    "href",
    "/practice/programming/keypad-search-checkpoint?path=coding-interview-pattern-practice",
  );
  await page.getByTestId("document-next-node").click();
  await expect(page).toHaveURL(
    "/practice/programming/keypad-search-checkpoint?path=coding-interview-pattern-practice",
  );
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.getByTestId("source-references")).toBeVisible();
  const answers = [
    "Return [ad, ae, be, cf]; only complete dictionary words with the exact encoding qualify.",
    "Return only ad for 23; adg is a longer word, and an unfinished prefix is not a result.",
    "Snapshot each completed word and pop the chosen letter before exploring the next sibling.",
    "Reject the malformed dictionary before search, even when digits are empty or no prefix matches.",
    "Compare with the independent scan under the same input contract; measure repeated-query costs before preferring a trie.",
  ];
  const correct = answers
    .map((answer) => page.getByRole("radio", { name: answer, exact: true }))
    .reduce((first, second) => first.or(second));
  for (let index = 0; index < answers.length; index++) {
    await expect(
      page.getByText(`Question ${index + 1} of ${answers.length}`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(correct).toHaveCount(1);
    await correct.check();
    await page
      .getByRole("button", { name: "Check answer", exact: true })
      .click();
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await page
      .getByRole("button", {
        name: index === answers.length - 1 ? "Finish" : "Next",
        exact: true,
      })
      .click();
  }
  await expect(page.getByText("Score 100%", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next activity" })).toHaveCount(
    0,
  );
});
