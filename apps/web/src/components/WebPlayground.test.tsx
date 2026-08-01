import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { WebPlayground } from "./WebPlayground";

const sandpackMocks = vi.hoisted(() => ({
  providerProps: vi.fn(),
  runSandpack: vi.fn(async () => undefined),
  resetAllFiles: vi.fn(),
}));

vi.mock("@codesandbox/sandpack-react", () => ({
  SandpackProvider: ({ children, ...props }: { children: ReactNode }) => {
    sandpackMocks.providerProps(props);
    return <div>{children}</div>;
  },
  SandpackLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SandpackCodeEditor: () => <div data-testid="mock-sandpack-editor" />,
  SandpackPreview: () => <div data-testid="mock-sandpack-preview" />,
  SandpackConsole: () => <div data-testid="mock-sandpack-console" />,
  useSandpack: () => ({ sandpack: { runSandpack: sandpackMocks.runSandpack, resetAllFiles: sandpackMocks.resetAllFiles } }),
}));

describe("WebPlayground", () => {
  it("maps reusable project files into Sandpack and exposes run and reset controls", () => {
    const project = {
      runtime: "react-ts" as const,
      activeFile: "/App.tsx",
      visibleFiles: ["/App.tsx", "/styles.css"],
      files: {
        "/App.tsx": { code: "export default function App() { return <main>Hello</main>; }" },
        "/styles.css": { code: "main { min-height: 20rem; }" },
      },
      dependencies: { nanoid: "^5.0.0" },
    };

    render(<WebPlayground project={project} projectId="test-project" />);

    expect(sandpackMocks.providerProps).toHaveBeenCalledWith(expect.objectContaining({
      template: "react-ts",
      files: project.files,
      customSetup: { dependencies: project.dependencies },
      options: expect.objectContaining({ activeFile: "/App.tsx", visibleFiles: project.visibleFiles, autorun: true, autoReload: false }),
    }));
    expect(screen.getByTestId("mock-sandpack-editor")).toBeVisible();
    expect(screen.getByTestId("mock-sandpack-preview")).toBeVisible();

    fireEvent.click(screen.getByTestId("web-playground-run"));
    expect(sandpackMocks.runSandpack).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("web-playground-reset"));
    expect(sandpackMocks.resetAllFiles).toHaveBeenCalledTimes(1);
    expect(sandpackMocks.runSandpack).toHaveBeenCalledTimes(2);
  });
});
