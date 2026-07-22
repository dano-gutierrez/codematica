import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getContentIndex } from "@codematica/core";
import { HomeDiscovery } from "./HomeDiscovery";

describe("HomeDiscovery", () => {
  it("renders every curated section with its full-catalog destination", () => {
    render(<HomeDiscovery index={getContentIndex()} />);

    expect(screen.getByTestId("home-section-paths")).toBeVisible();
    expect(screen.getByTestId("home-section-lessons")).toBeVisible();
    expect(screen.getByTestId("home-section-interviews")).toBeVisible();
    expect(screen.getByTestId("home-section-practice")).toBeVisible();
    expect(screen.getByTestId("home-section-languages")).toHaveTextContent("Japanese");
    expect(screen.getByTestId("home-view-all-paths")).toHaveAttribute("href", "/paths");
    expect(screen.getByTestId("home-view-all-practice")).toHaveAttribute("href", "/practice");
    expect(screen.getByTestId("home-view-all-languages")).toHaveAttribute("href", "/languages");
  });

  it("replaces curated rows with grouped cross-section search results", () => {
    render(<HomeDiscovery index={getContentIndex()} />);

    fireEvent.change(screen.getByTestId("home-global-search"), { target: { value: "Number Of Islands" } });

    expect(screen.getByTestId("home-discovery-results")).toHaveTextContent("Number Of Islands");
    expect(screen.queryByTestId("home-section-paths")).not.toBeInTheDocument();
  });
});
