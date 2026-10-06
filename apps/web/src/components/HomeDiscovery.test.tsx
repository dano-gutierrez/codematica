import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getContentIndex, getHomeDiscoverySections, searchDiscovery } from "@codematica/core";
import { DiscoveryCard, HomeDiscovery } from "./HomeDiscovery";

describe("HomeDiscovery", () => {
  it("renders every curated section with its full-catalog destination", async () => {
    render(<HomeDiscovery index={getContentIndex()} />);
    await act(async () => undefined);

    expect(screen.getByTestId("home-section-paths")).toBeVisible();
    expect(screen.getByTestId("home-section-lessons")).toBeVisible();
    expect(screen.getByTestId("home-section-interviews")).toBeVisible();
    expect(screen.getByTestId("home-section-practice")).toBeVisible();
    expect(screen.getByTestId("home-section-languages")).toHaveTextContent("Japanese");
    expect(screen.getByTestId("home-view-all-paths")).toHaveAttribute("href", "/paths");
    expect(screen.getByTestId("home-view-all-practice")).toHaveAttribute("href", "/practice");
    expect(screen.getByTestId("home-view-all-languages")).toHaveAttribute("href", "/languages");
    expect(screen.getByTestId("home-view-all-languages")).toHaveAccessibleName("View all languages");
  });

  it("keeps curated card titles, labels and destinations without description previews", async () => {
    const index = getContentIndex();
    render(<HomeDiscovery index={index} />);
    await act(async () => undefined);
    for (const section of getHomeDiscoverySections(index)) {
      for (const item of section.items) {
        const card = within(screen.getByTestId(`home-section-${section.id}`)).getByTestId(`discovery-card-${item.kind}-${item.sourceSlug.replaceAll("/", "-")}`);
        expect(card).toHaveTextContent(item.title);
        expect(card).toHaveTextContent(item.eyebrow);
        expect(card).toHaveAttribute("href", item.route);
        expect(within(card).queryByText(item.summary, { exact: true })).not.toBeInTheDocument();
      }
    }
  });

  it("keeps descriptions available on shared full-catalog cards", () => {
    const item = getHomeDiscoverySections(getContentIndex())[0].items[0];
    render(<DiscoveryCard item={item} />);
    expect(screen.getByText(item.summary)).toBeVisible();
  });

  it("keeps resume titles and actions without description previews", async () => {
    render(<HomeDiscovery index={getContentIndex()} isSignedIn keepReadingItems={[{
      id: "document-system-design/cache-invalidation",
      title: "A resumed lesson",
      summary: "A description that should not appear on Learn.",
      href: "/docs/system-design/cache-invalidation",
      eyebrow: "Document",
      status: "started",
      lastSeenAt: "2026-10-04T00:00:00Z",
    }]} />);
    await act(async () => undefined);
    const resume = within(screen.getByTestId("keep-reading-section"));
    expect(resume.getByRole("link", { name: /A resumed lesson/ })).toHaveAttribute("href", "/docs/system-design/cache-invalidation");
    expect(resume.getByText("Document")).toBeVisible();
    expect(resume.getByText("Resume")).toBeVisible();
    expect(resume.queryByText("A description that should not appear on Learn.")).not.toBeInTheDocument();
  });

  it("replaces curated rows with grouped cross-section search results", async () => {
    render(<HomeDiscovery index={getContentIndex()} />);
    await act(async () => undefined);

    fireEvent.change(screen.getByTestId("home-global-search"), { target: { value: "Number Of Islands" } });

    expect(screen.getByTestId("home-discovery-results")).toHaveTextContent("Number Of Islands");
    for (const item of searchDiscovery(getContentIndex(), "Number Of Islands").slice(0, 40)) {
      const card = within(screen.getByTestId("home-discovery-results")).getByTestId(`discovery-card-${item.kind}-${item.sourceSlug.replaceAll("/", "-")}`);
      expect(card).toHaveTextContent(item.title);
      expect(card).toHaveTextContent(item.eyebrow);
      expect(within(card).queryByText(item.summary, { exact: true })).not.toBeInTheDocument();
    }
    expect(screen.queryByTestId("home-section-paths")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByTestId("home-global-search")).toHaveFocus();
    expect(within(screen.getByTestId("home-section-paths")).getByRole("heading", { level: 2 })).toBeVisible();
  });
});
