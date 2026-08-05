import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getExerciseBySlug } from "@/lib/content";
import { recordProgress } from "@/lib/progress/client";
import { BackButton } from "./BackButton";
import { MermaidBlock } from "./MermaidBlock";
import { PathScopedNextLink } from "./PathScopedNextLink";
import { PathScopedPracticeCard } from "./PathScopedPracticeCard";
import { DiagramProgressTracker, DocumentProgressTracker } from "./ProgressTrackers";
import { RandomInterviewButton } from "./RandomInterviewButton";

const navigation = vi.hoisted(() => ({
  path: "system-design-fundamentals",
  push: vi.fn(),
  back: vi.fn(),
}));
const mermaid = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (key: string) => key === "path" ? navigation.path : null }),
  useRouter: () => ({ push: navigation.push, back: navigation.back }),
}));
vi.mock("@/lib/progress/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress/client")>();
  return { ...actual, recordProgress: vi.fn(async () => undefined) };
});
vi.mock("mermaid", () => ({ default: mermaid }));

const target = {
  surface: "document" as const,
  slug: "system-design/cache-invalidation",
  title: "Cache Invalidation",
  summary: "Summary",
  href: "/docs/system-design/cache-invalidation",
  eyebrow: "Document",
};

describe("navigation, progress, and rendering utilities", () => {
  beforeEach(() => {
    navigation.path = "system-design-fundamentals";
    vi.clearAllMocks();
    mermaid.render.mockResolvedValue({ svg: "<svg aria-label='diagram'></svg>" });
  });

  it("renders Mermaid output and keeps a source fallback", async () => {
    render(<MermaidBlock source="graph TD; A-->B" title="Flow" />);
    expect(screen.getByText("Rendering diagram")).toBeVisible();
    await waitFor(() => expect(screen.getByTestId("mermaid-diagram")).toBeVisible());
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: "strict" }));
    expect(screen.getByText("Source")).toBeVisible();
  });

  it("shows safe Mermaid errors for Error and non-Error failures", async () => {
    mermaid.render.mockRejectedValueOnce(new Error("invalid syntax"));
    const view = render(<MermaidBlock source="bad" />);
    await waitFor(() => expect(screen.getByTestId("mermaid-error")).toHaveTextContent("invalid syntax"));
    mermaid.render.mockRejectedValueOnce("bad");
    view.rerender(<MermaidBlock source="also bad" />);
    await waitFor(() => expect(screen.getByTestId("mermaid-error")).toHaveTextContent("could not render"));
  });

  it("records document start/completion and diagram views with path scope", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 200 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 700 });
    const view = render(<DocumentProgressTracker target={target} />);
    expect(recordProgress).toHaveBeenCalledWith(expect.objectContaining({ pathSlug: "system-design-fundamentals" }), "started", expect.any(Object));
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(recordProgress).toHaveBeenCalledWith(expect.any(Object), "completed", expect.objectContaining({ scrollRatio: 0.875 }));
    view.rerender(<DiagramProgressTracker target={{ ...target, surface: "diagram" }} />);
    expect(recordProgress).toHaveBeenCalledWith(expect.any(Object), "completed", { viewed: true });
  });

  it("scopes next links and practice completion events", () => {
    const link = render(<PathScopedNextLink
      nextHrefsByPath={{ "system-design-fundamentals": "/practice/next?path=system-design-fundamentals" }}
      testId="next-link"
      progressTarget={target}
    />);
    screen.getByTestId("next-link").addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(screen.getByTestId("next-link"));
    expect(recordProgress).toHaveBeenCalledWith(expect.objectContaining({ pathSlug: "system-design-fundamentals" }), "completed", { nextNode: true });
    link.unmount();

    const exercise = getExerciseBySlug("system-design/cache-product-contract")!;
    render(<PathScopedPracticeCard exercise={exercise} nextHrefsByPath={{ "system-design-fundamentals": "/practice/next" }} />);
    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    expect(recordProgress).toHaveBeenCalledWith(expect.objectContaining({ slug: exercise.slug }), "completed", { revealed: true });
  });

  it("handles back and bounded random navigation, including empty routes", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0.99);
    const back = render(<BackButton label="Return" />);
    fireEvent.click(screen.getByRole("button", { name: "Return" }));
    expect(navigation.back).toHaveBeenCalled();
    back.unmount();

    const view = render(<RandomInterviewButton routes={["/one", "/two"]} />);
    fireEvent.click(screen.getByTestId("interview-random-button"));
    expect(navigation.push).toHaveBeenCalledWith("/two");
    view.rerender(<RandomInterviewButton routes={[]} />);
    fireEvent.click(screen.getByTestId("interview-random-button"));
    expect(navigation.push).toHaveBeenCalledTimes(1);
    random.mockRestore();
  });

  it("hides path-scoped controls outside a recognized path", () => {
    navigation.path = "unknown";
    render(<PathScopedNextLink nextHrefsByPath={{ known: "/next" }} testId="missing-next" />);
    expect(screen.queryByTestId("missing-next")).not.toBeInTheDocument();
  });
});
