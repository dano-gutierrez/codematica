import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getContentIndex, getInterviewCollectionBySlug, getLearningPathBySlug } from "@/lib/content";
import { InterviewCatalog, InterviewCollectionDetail } from "./InterviewCatalog";
import { KnowledgeBrowser } from "./KnowledgeBrowser";
import { LearningPathDetail } from "./LearningPathMap";
import { LanguageCatalog, LearningPathCatalog, PracticeCatalog } from "./SectionCatalogs";

const index = getContentIndex();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("catalog and path surfaces", () => {
  it("searches and empties the knowledge library without a remote service", () => {
    render(<KnowledgeBrowser index={index} />);
    const input = screen.getByTestId("knowledge-search-input");
    fireEvent.change(input, { target: { value: "cache invalidation" } });
    expect(screen.getByTestId("search-results")).toHaveTextContent("Cache Invalidation");
    expect(screen.getAllByRole("mark").length).toBeGreaterThan(0);
    fireEvent.change(input, { target: { value: "no-match-[.*]-value" } });
    expect(screen.getByTestId("empty-results")).toBeVisible();
  });

  it("renders complete path metadata, nodes, feeds, and progression", () => {
    const japanese = getLearningPathBySlug("japanese-foundations")!;
    const { rerender } = render(<LearningPathDetail index={index} learningPath={japanese} />);
    expect(screen.getByTestId("path-progression-roadmap")).toHaveTextContent("Kana Explorer");
    expect(screen.getByTestId("path-flashcard-feed-link")).toBeVisible();
    expect(screen.getAllByTestId(`path-nodes-${japanese.slug}`).length).toBeGreaterThan(0);

    const systemDesign = getLearningPathBySlug("system-design-fundamentals")!;
    rerender(<LearningPathDetail index={index} learningPath={systemDesign} />);
    expect(screen.getByRole("heading", { name: systemDesign.title })).toBeVisible();
  });

  it("filters path and practice catalogs and exposes the language catalog", () => {
    const paths = render(<LearningPathCatalog index={index} />);
    fireEvent.change(screen.getByTestId("path-catalog-search"), { target: { value: "Advanced Next.js" } });
    expect(screen.getByTestId("learning-path-list")).toHaveTextContent("Advanced Next.js 16");
    fireEvent.change(screen.getByTestId("path-catalog-search"), { target: { value: "not-a-path" } });
    expect(screen.getByText(/No learning paths match/i)).toBeVisible();
    paths.unmount();

    const practice = render(<PracticeCatalog index={index} />);
    fireEvent.change(screen.getByTestId("practice-catalog-search"), { target: { value: "cache" } });
    expect(screen.getByTestId("practice-catalog")).toHaveTextContent(/cache/i);
    fireEvent.change(screen.getByTestId("practice-catalog-search"), { target: { value: "not-an-exercise" } });
    expect(screen.getByText(/No practice activities match/i)).toBeVisible();
    practice.unmount();

    render(<LanguageCatalog index={index} />);
    expect(screen.getByTestId("language-catalog")).toHaveTextContent("Japanese");
  });

  it("searches every interview collection and renders both collection kinds", () => {
    const catalog = render(<InterviewCatalog index={index} />);
    fireEvent.change(screen.getByTestId("interview-search-input"), { target: { value: "Number Of Islands" } });
    expect(screen.getByTestId("interview-all-question-list")).toHaveTextContent("Number Of Islands");
    fireEvent.change(screen.getByTestId("interview-search-input"), { target: { value: "not-an-interview" } });
    expect(screen.getByText(/No interview questions match/i)).toBeVisible();
    catalog.unmount();

    const company = getInterviewCollectionBySlug("google")!;
    const detail = render(<InterviewCollectionDetail collection={company} />);
    expect(screen.getByTestId("interview-company-page")).toHaveTextContent("Google");
    detail.rerender(<InterviewCollectionDetail collection={getInterviewCollectionBySlug("real-world")!} />);
    expect(screen.getByTestId("interview-collection-page")).toHaveTextContent("Real-world");
  });
});
