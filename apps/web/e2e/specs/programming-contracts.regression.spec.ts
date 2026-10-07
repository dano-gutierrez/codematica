import { expect, test } from "@playwright/test";

const cases = [
  {
    slug: "javascript-value-contracts",
    title: "JavaScript Value Contracts — Binding, Ownership And Calls",
    headings: [
      "Separate binding from value ownership",
      "Distinguish lookup from membership",
      "Predict conversion and call context",
      "Run the original value fixture",
      "Preserve scope when reviewing a cheat sheet",
    ],
    sourceUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const",
    answers: [
      "The binding is fixed; the nested object remains shared and mutable.",
      "Check for -1 before splice; the missing item must leave the list unchanged.",
      "Object.keys lists enumerable own string keys; inherited keys are separate.",
      "5 == true is false; true converts to 1, which differs from 5.",
      "The ordinary function uses its call receiver; the captured arrow retains its lexical this.",
    ],
  },
  {
    slug: "lazy-demand-and-stream-boundaries",
    title: "Lazy Demand And Stream Boundaries",
    headings: [
      "Name the demand contract",
      "Propagate stopping and cleanup",
      "Run the original demand fixture",
      "Separate pressure from acknowledgement",
      "Record the host and evidence boundary",
    ],
    sourceUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators",
    answers: [
      "Pull only through the second qualifying value; eager mapping reads the full finite input.",
      "Breaking for...of calls an available iterator return; a generator finally can release its owned resource.",
      "Pause after write returns false; highWaterMark is a pressure threshold, not a strict total-memory cap.",
      "Verify session and file identity, obtain the accepted offset, then send fresh bytes from that offset.",
      "Record the host and scheduling context; Node timer phases do not define every browser or module ordering.",
    ],
  },
  {
    slug: "text-domain-and-matching",
    title: "Text Domains And Matching — Keep The Contract Visible",
    headings: [
      "Choose the character domain",
      "Make pointer progress explicit",
      "Run the original text fixture",
      "Separate pattern syntax from acceptance",
      "Use diagrams as review aids",
    ],
    sourceUrl:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions",
    answers: [
      "Reverse only ASCII letters and keep every other accepted ASCII character at its original position.",
      "Advance at least one pointer each iteration; skip fixed characters and move both pointers after a swap.",
      "Use the intended dialect and verify the matched text covers the entire input.",
      "A constructor string needs the JavaScript escape layer before the regex parser receives the pattern.",
      "A diagram helps explain structure; it proves neither dialect equivalence nor bounded runtime.",
    ],
  },
  {
    slug: "tree-shapes-and-cost-models",
    title: "Tree Shapes And Cost Models — State The Property You Test",
    headings: [
      "Separate shape from ordering",
      "Carry the ancestor constraint",
      "Count the operation before naming the class",
      "Run the original bounded references",
      "Preserve assumptions beyond the fixture",
    ],
    sourceUrl:
      "https://opendsax.cs.vt.edu/OpenDSA/Books/Everything/html/BinaryTree.html",
    answers: [
      "Full means zero or two children; complete means no missing breadth-first slot before an occupied slot.",
      "Carry ancestor bounds; a locally valid child can still violate the root's range.",
      "The authored selection scan makes n(n-1)/2 comparisons even on sorted input.",
      "Name the operation and assumptions; expected, worst-case and amortized claims differ.",
      "The bounded fixtures check the stated representation; they do not prove arbitrary graphs or runtime speed.",
    ],
  },
];

for (const [index, fixture] of cases.entries()) {
  test(`@regression reads and completes programming contract ${fixture.slug}`, async ({
    page,
  }) => {
    const path = "programming-contract-review";
    await page.goto(`/paths/${path}`);
    await page
      .getByTestId(`path-node-document-programming-${fixture.slug}`)
      .click();
    await expect(page).toHaveURL(
      `/docs/programming/${fixture.slug}?path=${path}`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      fixture.title,
    );
    for (const heading of fixture.headings)
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
    const sources = page.getByTestId("source-references");
    await expect(sources).toBeVisible();
    await expect(
      sources
        .getByRole("link")
        .filter({ hasText: /MDN|Node.js|tus|Regex|OpenDSA|Oxford/ }),
    ).not.toHaveCount(0);
    const urls = await sources
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(urls).toContain(fixture.sourceUrl);
    await expect(page.getByTestId("document-next-node")).toHaveAttribute(
      "href",
      `/practice/programming/${fixture.slug}-checkpoint?path=${path}`,
    );
    await page.getByTestId("document-next-node").click();
    await expect(page.getByTestId("questionnaire-session")).toHaveAttribute(
      "data-ready",
      "true",
    );
    const correct = fixture.answers
      .map((answer) => page.getByRole("radio", { name: answer, exact: true }))
      .reduce((first, second) => first.or(second));
    for (let question = 0; question < fixture.answers.length; question++) {
      await expect(
        page.getByText(`Question ${question + 1} of 5`, { exact: true }),
      ).toBeVisible();
      await expect(correct).toHaveCount(1);
      await correct.check();
      await page
        .getByRole("button", { name: "Check answer", exact: true })
        .click();
      await expect(page.getByText("Correct", { exact: true })).toBeVisible();
      await page
        .getByRole("button", {
          name: question === 4 ? "Finish" : "Next",
          exact: true,
        })
        .click();
    }
    await expect(page.getByText("Score 100%", { exact: true })).toBeVisible();
    const next = page.getByRole("link", { name: "Next activity", exact: true });
    if (index === cases.length - 1) await expect(next).toHaveCount(0);
    else {
      await expect(next).toHaveAttribute(
        "href",
        `/docs/programming/${cases[index + 1].slug}?path=${path}`,
      );
      await next.click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        cases[index + 1].title,
      );
    }
  });
}
