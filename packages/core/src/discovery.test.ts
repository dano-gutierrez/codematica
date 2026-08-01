import { describe, expect, it } from "vitest";
import { getContentIndex } from "./content";
import { getHomeDiscoverySections, searchDiscovery } from "./discovery";

const index = getContentIndex();

describe("searchDiscovery", () => {
  it("searches paths, lessons, interviews, practice, and languages", () => {
    expect(searchDiscovery(index, "System Design Fundamentals")[0]).toMatchObject({
      kind: "path",
      route: "/paths/system-design-fundamentals",
      section: "paths",
    });
    expect(searchDiscovery(index, "Number Of Islands").some((result) => result.kind === "interview-question")).toBe(true);
    expect(searchDiscovery(index, "questionnaire").some((result) => result.section === "practice")).toBe(true);
    expect(searchDiscovery(index, "water").some((result) => result.section === "languages")).toBe(true);
  });

  it("returns each canonical route only once and excludes unpublished content", () => {
    const results = searchDiscovery(index, "japanese");

    expect(new Set(results.map((result) => result.route)).size).toBe(results.length);
    expect(results.every((result) => result.status === "published")).toBe(true);
  });
});

describe("getHomeDiscoverySections", () => {
  it("resolves every curated home reference in configured order", () => {
    const sections = getHomeDiscoverySections(index);

    expect(sections.map((section) => section.id)).toEqual(["paths", "lessons", "interviews", "practice", "languages"]);
    expect(sections.every((section) => section.items.length > 0)).toBe(true);
    expect(sections.flatMap((section) => section.items).every((item) => item.status === "published")).toBe(true);
  });
});
