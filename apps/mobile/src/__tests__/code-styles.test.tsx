import { render } from "@testing-library/react-native";
import { CodeBlock, MarkdownReader } from "../../../../packages/ui/src/screens";

const adapters = { navigation: { navigate: jest.fn() } };

describe("native code surfaces", () => {
  it.each([
    ["fenced", "```typescript\nconst fenced = 1;\n```", "const fenced = 1;"],
    ["indented", "    const indented = 2;", "const indented = 2;"],
    ["unknown language", "```custom\nunknown source\n```", "unknown source"],
  ])("uses the dark code surface for %s Markdown", async (_kind, markdown, source) => {
    const view = await render(<MarkdownReader markdown={markdown} adapters={adapters} />);
    expect(view.getByText(source)).toHaveStyle({ backgroundColor: "#101820", color: "#d9e7ef" });
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
});
