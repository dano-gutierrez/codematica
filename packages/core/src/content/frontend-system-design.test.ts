import { describe, expect, it } from "vitest";
import { getContentIndex, getDocumentBySlug, getExerciseBySlug, getLearningPathBySlug, getNextPathNodeRoute, getPathNodeRoute, getSourceById } from ".";
import { searchDiscovery } from "../discovery";

const pathSlug = "frontend-system-design-interviews";
const prefix = "frontend/system-design-";
const cases = [
  ["learning-game", "amazon", "https://www.reddit.com/r/cscareerquestions/comments/1iudddy/rainforest_loop_experience_frontend_l5_12_yoe/"],
  ["kanban", "atlassian", "https://discuss.frontendlead.com/t/atlassian-frontend-engineer-p40-onsite/2192"],
  ["shopping", "wayfair", "https://saumyadip25.medium.com/wayfair-software-engineer-3-frontend-interview-experience-13112d221611"],
  ["file-manager", "adobe", "https://discuss.frontendlead.com/t/adobe-senior-frontend-engineer-gen-studio-full-loop/3316"],
  ["messaging", "salesforce", "https://saumyadip25.medium.com/salesforce-smts-frontend-interview-experience-5cae01d6a594"],
  ["calendar", "uber", "https://leetcode.com/discuss/post/1746929/uber-l4-nyc-did-not-get-offer/"],
] as const;

describe("Frontend System Design Interviews", () => {
  it("connects the briefing and all six rehearsals in order, with a terminal final lab", () => {
    const path = getLearningPathBySlug(pathSlug);
    expect(path?.status).toBe("published");
    expect(path?.sourcePolicy).toBe("required");
    const nodes = path!.units.flatMap(unit => unit.nodes);
    expect(nodes).toEqual([
      { kind: "document", slug: `${prefix}interview-guide` },
      { kind: "document", slug: `${prefix}interview-rehearsal` },
      ...cases.flatMap(([topic]) => [
        { kind: "document", slug: `${prefix}${topic}` },
        { kind: "exercise", slug: `${prefix}${topic}-lab` },
      ]),
    ]);
    for (const [index, node] of nodes.entries()) {
      expect(getNextPathNodeRoute(pathSlug, node)).toBe(
        nodes[index + 1] ? getPathNodeRoute(nodes[index + 1], pathSlug) : undefined,
      );
    }
    expect(searchDiscovery(getContentIndex(), "Frontend System Design Interviews").map(item => item.route)).toContain(`/paths/${pathSlug}`);
  });

  it("starts with the full architecture guide, its three examples, and technical sources", () => {
    const guide = getDocumentBySlug(`${prefix}interview-guide`);
    expect(guide?.title).toBe("Frontend System Design Interview Guide");
    expect(guide?.status).toBe("published");
    for (const heading of ["Use the hour deliberately", "Clarify requirements", "Design components and state", "Define API contracts", "Choose cache policies", "Choose rendering per route", "Include quality", "Example 1: Product search with autocomplete", "Example 2: A social feed", "Example 3: A collaborative task board"]) {
      expect(guide?.markdown).toContain(`## ${heading}`);
    }
    expect(guide?.markdown.match(/```mermaid/g)).toHaveLength(3);
    expect(guide?.sourceRefs).toHaveLength(14);
    expect(guide?.sourceRefs?.map(id => getSourceById(id)?.url)).toContain("https://web.dev/articles/vitals");
    expect(guide?.markdown).toContain("LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, and CLS ≤ 0.1");
    expect(guide?.markdown).toContain("75th percentile");
    expect(guide?.markdown).toContain("412 Precondition Failed");
    expect(guide?.markdown).toContain("/docs/frontend/system-design-interview-rehearsal?path=frontend-system-design-interviews");
    expect(searchDiscovery(getContentIndex(), "Frontend System Design Interview Guide").map(item => item.route)).toContain(`/docs/${prefix}interview-guide`);
  });

  it.each(cases)("publishes %s as a sourced, self-assessed whiteboard lab (%s)", (topic, company, url) => {
    const document = getDocumentBySlug(`${prefix}${topic}`);
    const lab = getExerciseBySlug(`${prefix}${topic}-lab`);
    const sourceId = `frontend-design-report-${company}`;
    expect(document?.status).toBe("published");
    expect(document?.sourceRefs).toEqual([sourceId]);
    expect(document?.markdown).toContain("not independently verified");
    expect(document?.markdown).toContain("Codematica additions");
    expect(document?.markdown).toContain(url);
    expect(document?.markdown).toContain(`/practice/${prefix}${topic}-lab?path=${pathSlug}`);
    expect(lab?.type).toBe("guided-lab");
    if (lab?.type !== "guided-lab") throw new Error(`Missing ${topic} rehearsal`);
    expect(lab.status).toBe("published");
    expect(lab.documentSlug).toBe(document!.slug);
    expect(lab.sourceRefs).toEqual([sourceId]);
    expect(lab.estimatedMinutes).toBe(60);
    expect(lab.briefing).toContain("not independently verified");
    expect(lab.briefing).toContain("not automatically graded");
    expect(lab.steps.map(step => step.id)).toEqual(["scope", "architecture", "contracts", "trace", "follow-ups", "review"]);
    expect(lab.steps.at(-2)?.title).toBe("45–55 minutes: handle follow-ups");
    expect(lab.steps.at(-1)?.title).toBe("55–60 minutes: review your evidence");
    expect(lab.evidenceChecklist.map(item => item.id)).toEqual(["scope", "components", "state", "contracts", "recovery", "quality", "scenario"]);
    const source = getSourceById(sourceId);
    expect(source?.url).toBe(url);
    expect(source?.lastVerifiedAt).toBe("2026-10-08");
    expect(source?.attribution).toContain("candidate report");
    expect(source?.attribution).toContain("not independently verified");
    expect(searchDiscovery(getContentIndex(), lab.title).map(item => item.route)).toContain(`/practice/${lab.slug}`);
  });

  it("preserves adaptation caveats, reported dates, and a shared six-dimension rubric", () => {
    const text = (topic: string) => getDocumentBySlug(`${prefix}${topic}`)?.markdown;
    expect(text("file-manager")).toContain("does not specify its detailed scope");
    expect(text("calendar")).toContain("frontend scope below is a Codematica adaptation");
    expect(text("kanban")).toContain("June 29, 2025");
    expect(text("shopping")).toContain("August 2024");
    expect(text("shopping")).toContain("December 30, 2025");
    expect(text("file-manager")).toContain("December 2025–January 2026");
    expect(text("file-manager")).toContain("March 11, 2026");
    expect(text("messaging")).toContain("November 23, 2025");
    expect(text("messaging")).toContain("60-minute");
    const guide = text("interview-rehearsal");
    for (const dimension of ["Scope", "Components", "State and data", "APIs and consistency", "Failure recovery", "Quality and trade-offs"]) expect(guide).toContain(`| ${dimension} |`);
    expect(guide).toContain("45 minutes designing, 10 minutes handling follow-ups, and 5 minutes reviewing");
  });

  it("keeps standalone labs understandable without reading their companion first", () => {
    const briefing = (topic: string) => {
      const lab = getExerciseBySlug(`${prefix}${topic}-lab`);
      if (lab?.type !== "guided-lab") throw new Error(`Missing ${topic}`);
      return lab.briefing;
    };
    expect(briefing("learning-game")).toContain("choose the picture matching a word");
    expect(briefing("learning-game")).toContain("type the word matching a picture");
    expect(briefing("file-manager")).toContain("does not specify its detailed scope");
    expect(briefing("calendar")).toContain("frontend scope below is a Codematica adaptation");
  });
});
