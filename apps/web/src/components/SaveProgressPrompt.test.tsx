import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { addAnonymousProgressItem } from "@/lib/progress/anonymous";
import { SaveProgressPrompt } from "./SaveProgressPrompt";

describe("SaveProgressPrompt", () => {
  it("appears after signed-out users create local progress", async () => {
    render(<SaveProgressPrompt isAuthConfigured={false} />);

    expect(screen.queryByTestId("save-progress-prompt")).not.toBeInTheDocument();

    addAnonymousProgressItem({
      input: {
        surface: "practice",
        slug: "system-design/cache-product-contract",
        pathSlug: "",
        status: "completed",
        position: {},
      },
      display: {
        id: "practice-system-design/cache-product-contract",
        title: "Cache Product Contract",
        summary: "Practice.",
        href: "/practice/system-design/cache-product-contract",
        eyebrow: "Practice",
        status: "completed",
        lastSeenAt: "2026-06-21T12:00:00.000Z",
      },
    });

    await waitFor(() => expect(screen.getByTestId("save-progress-prompt")).toBeVisible());
    expect(screen.getByRole("link", { name: /save progress/i })).toHaveAttribute("href", "/login?next=%2F");
  });
});
