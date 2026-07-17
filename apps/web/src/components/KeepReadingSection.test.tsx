import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { addAnonymousProgressItem } from "@/lib/progress/anonymous";
import { KeepReadingSection } from "./KeepReadingSection";

describe("KeepReadingSection", () => {
  it("renders server progress items first", () => {
    render(
      <KeepReadingSection
        isSignedIn
        initialItems={[
          {
            id: "document-programming/python-runtime-model",
            title: "Python Runtime Model For TypeScript And JavaScript Engineers",
            summary: "Runtime lesson.",
            href: "/docs/programming/python-runtime-model",
            eyebrow: "Document",
            status: "started",
            lastSeenAt: "2026-06-21T12:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("keep-reading-section")).toHaveTextContent("Python Runtime Model");
    expect(screen.getByRole("link", { name: /Python Runtime Model/i })).toHaveAttribute("href", "/docs/programming/python-runtime-model");
  });

  it("uses anonymous local progress for signed-out users", async () => {
    render(<KeepReadingSection isSignedIn={false} initialItems={[]} />);

    act(() => {
      addAnonymousProgressItem({
        input: {
          surface: "document",
          slug: "system-design/cache-invalidation",
          pathSlug: "",
          status: "started",
          position: {},
        },
        display: {
          id: "document-system-design/cache-invalidation",
          title: "Cache Invalidation Under Product Pressure",
          summary: "Cache lesson.",
          href: "/docs/system-design/cache-invalidation",
          eyebrow: "Document",
          status: "started",
          lastSeenAt: "2026-06-21T12:00:00.000Z",
        },
      });
    });

    await waitFor(() => expect(screen.getByTestId("keep-reading-section")).toHaveTextContent("Cache Invalidation Under Product Pressure"));
  });
});
