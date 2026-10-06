import { expect, test, type Locator } from "@playwright/test";

async function expectDarkReadableText(roots: Locator) {
  const results = await roots.evaluateAll((elements) => elements.map((element) => {
    let surface: Element | null = element;
    while (surface && ["rgba(0, 0, 0, 0)", "transparent"].includes(getComputedStyle(surface).backgroundColor)) surface = surface.parentElement;
    const background = surface ? getComputedStyle(surface).backgroundColor : "rgb(255, 255, 255)";
    const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const luminance = (channels: number[]) => channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const backgrounds = [rgb(background)];
    if (surface && getComputedStyle(surface).backgroundImage !== "none") backgrounds.push(backgrounds[0].map((channel) => channel * 0.965 + 255 * 0.035));
    const tokens: { text: string; color: string; contrast: number }[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent?.trim();
      if (!text) continue;
      const color = getComputedStyle(walker.currentNode.parentElement!).color;
      const foreground = luminance(rgb(color));
      const contrast = Math.min(...backgrounds.map((channels) => {
        const back = luminance(channels);
        return (Math.max(foreground, back) + 0.05) / (Math.min(foreground, back) + 0.05);
      }));
      tokens.push({ text: text.slice(0, 35), color, contrast });
    }
    return { background, tokens };
  }));
  expect(results.length).toBeGreaterThan(0);
  for (const block of results) {
    expect(block.background).toBe("rgb(16, 24, 32)");
    expect(block.tokens.length).toBeGreaterThan(0);
    expect(block.tokens.filter((token) => token.contrast < 4.5)).toEqual([]);
  }
}

// Contrast needs the browser's CSS cascade, including the surrounding Markdown.
// Checking the CodeBlock DOM alone would miss the rule that caused this defect.
for (const width of [390, 1280]) {
  test(`@regression keeps highlighted lesson code readable inside Markdown at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/docs/frontend/react-state-async-callbacks");
    const article = page.getByTestId("markdown-renderer");
    const blocks = article.getByRole("figure");
    await expect(blocks).toHaveCount(4);
    await expectDarkReadableText(blocks.getByRole("code"));
    const borders = await blocks.evaluateAll((figures) => figures.map((figure) =>
      getComputedStyle(figure.getElementsByTagName("pre")[0]).borderTopWidth,
    ));
    expect(borders).toEqual(["0px", "0px", "0px", "0px"]);
    // Inline snippets keep their light chip style and readable dark text.
    const inline = article.getByText("useState([])", { exact: true });
    await expect(inline).toHaveCSS("background-color", "rgb(246, 251, 252)");
    await expect(inline).toHaveCSS("color", "rgb(36, 95, 186)");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await blocks.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath("lesson-code-contrast.png") });
  });
}

test("@regression keeps interview solutions, Python companions, review snippets, and diagram source dark", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { __codematicaPassiveFlashcardRandom: () => 0.999999 });
  });
  await test.step("algorithm solutions in each language", async () => {
    await page.goto("/interviews/amazon/two-sum-product-pair");
    const session = page.getByTestId("interview-question-session");
    await session.getByRole("button", { name: "Next", exact: true }).click();
    await session.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: /Show full explanation/i }).click();
    for (const language of ["python", "typescript", "java"]) {
      await page.getByTestId("interview-solution-language").click();
      await page.getByRole("option", { name: { python: "Python", typescript: "TypeScript", java: "Java" }[language], exact: true }).click();
      await expectDarkReadableText(page.getByTestId("interview-code").getByRole("code"));
    }
  });
  await test.step("Python companion", async () => {
    await page.route(/https:\/\/[^/]*sandpack\.codesandbox\.io\//, (route) => route.abort());
    await page.goto("/interviews/frontend-practice/dynamic-board");
    await page.getByRole("button", { name: "Show full solution", exact: true }).click();
    await page.getByRole("button", { name: "Python", exact: true }).click();
    await expectDarkReadableText(page.getByTestId("web-python-companion").getByRole("code"));
  });
  await test.step("review snippets", async () => {
    await page.goto("/paths/frontend-interview-practice/flashcards");
    await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
    await expectDarkReadableText(page.getByRole("figure").getByRole("code"));
  });
  await test.step("SQL without a registered highlighter and Mermaid source", async () => {
    await page.goto("/docs/databases/index-fundamentals");
    await expectDarkReadableText(page.getByRole("figure").getByRole("code").filter({ visible: true }));
    await page.goto("/diagrams/ai-engineering/agent-tool-safety-flow");
    await page.getByTestId("mermaid-block").first().getByText("Source", { exact: true }).click();
    await expectDarkReadableText(page.getByTestId("mermaid-block").first().getByRole("code"));
  });
});

test("@regression keeps playground syntax readable on its dark editor surface", async ({ page }) => {
  // The editor is local; this contrast check must not depend on hosted execution.
  await page.route(/https:\/\/[^/]*sandpack\.codesandbox\.io\//, (route) => route.abort());
  await page.goto("/interviews/frontend-practice/dynamic-board");
  await page.getByRole("button", { name: "Show full solution", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "Code Editor for App.tsx", exact: true }).last();
  await editor.press("ControlOrMeta+A");
  await page.keyboard.insertText('// Check comments and literals too.\nexport default function App() {\n  const count = 123;\n  return <button disabled={false} title="Example">{count}</button>;\n}');
  await expect(editor).toContainText("Check comments");
  await expectDarkReadableText(editor);
});
