import { render, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { AppScreen, CodeBlock, MarkdownReader } from "../../../../packages/ui/src/screens";

const adapters = { navigation: { navigate: jest.fn() } };

describe("native code surfaces", () => {
  it.each([
    ["fenced", "```typescript\nconst fenced = 1;\n```", "const fenced = 1;"],
    ["indented", "    const indented = 2;", "const indented = 2;"],
    ["unknown language", "```custom\nunknown source\n```", "unknown source"],
  ])("uses the dark code surface for %s Markdown", async (_kind, markdown, source) => {
    const view = await render(<MarkdownReader markdown={markdown} adapters={adapters} />);
    expect(view.getByTestId("mobile-code-block")).toHaveStyle({ backgroundColor: "#101820" });
    expect(view.getByText(source)).toHaveStyle({ color: "#d9e7ef" });
  });

  it("keeps standalone code dark and inline code on its readable prose surface", async () => {
    const view = await render(<>
      <CodeBlock code="const standalone = 3;" language="typescript" />
      <MarkdownReader markdown="Inline `value` in prose." adapters={adapters} />
    </>);
    expect(view.getByTestId("mobile-code-block")).toHaveStyle({ backgroundColor: "#101820" });
    expect(view.getByText("const standalone = 3;")).toHaveStyle({ color: "#d9e7ef" });
    expect(view.getByText("value")).toHaveStyle({ backgroundColor: "#f3f5f6", color: "#245fba" });
  });

  it.each([
    ["fenced", "```typescript title=example\n  const message = '日本語 → readable';\n\n  return message;\n```"],
    ["indented", "      const message = '日本語 → readable';\n\n      return message;"],
    ["unknown language", "```custom\n  const message = '日本語 → readable';\n\n  return message;\n```"],
    ["unlabeled", "```\n  const message = '日本語 → readable';\n\n  return message;\n```"],
    ["nested in a list", "- Example:\n\n  ```typescript\n    const message = '日本語 → readable';\n\n    return message;\n  ```"],
    ["nested in a quote", "> ```typescript\n>   const message = '日本語 → readable';\n>\n>   return message;\n> ```"],
  ])("scrolls %s code independently and preserves source whitespace", async (_kind, markdown) => {
    const view = await render(<AppScreen><MarkdownReader markdown={`Prose before.\n\n${markdown}\n\nProse after with \`inline\` code.`} adapters={adapters} /></AppScreen>);
    const block = view.getByTestId("mobile-code-block");
    const scroll = within(block).getByTestId("mobile-code-scroll");
    expect(scroll.props.horizontal).toBe(true);
    expect(scroll.props.directionalLockEnabled).toBe(true);
    expect(scroll.props.nestedScrollEnabled).toBe(true);
    expect(within(block).getByText(/const message/).props.children).toBe("  const message = '日本語 → readable';\n\n  return message;");
    expect(within(block).queryByText("Prose before.")).toBeNull();
    expect(within(block).queryByText("inline")).toBeNull();
    expect(view.getByText("Prose before.")).toBeOnTheScreen();
    expect(view.getByText("inline")).toHaveStyle({ color: "#245fba" });
  });

  it("labels the language without showing fence metadata or trimming authored blank lines", async () => {
    const view = await render(<MarkdownReader markdown={'```typescript title=example\n  const value = 1;\n\n```'} adapters={adapters} />);
    expect(view.getByText("typescript")).toBeOnTheScreen();
    expect(view.queryByText(/title=example/)).toBeNull();
    expect(view.getByTestId("mobile-code-source").props.children).toBe("  const value = 1;\n");
  });

  it("does not cap tall code or constrain long source lines to the page width", async () => {
    const code = Array.from({ length: 40 }, (_, index) => `  line${index}: ${"long_source_".repeat(12)}`).join("\n");
    const view = await render(<CodeBlock code={code} language="typescript" />);
    const block = view.getByTestId("mobile-code-block");
    const blockStyle = StyleSheet.flatten(block.props.style);
    expect(blockStyle).toMatchObject({ maxWidth: "100%", minWidth: 0, alignSelf: "stretch", flexGrow: 0, flexShrink: 0 });
    expect(blockStyle.height).toBeUndefined();
    expect(blockStyle.maxHeight).toBeUndefined();
    const source = view.getByText(/line0:/);
    expect(source.props.children).toBe(code);
    expect(source.props.numberOfLines).toBeUndefined();
    expect(source.props.allowFontScaling).not.toBe(false);
    expect(source).toHaveStyle({ flexShrink: 0, color: "#d9e7ef" });
  });
});
