import { describe, expect, it } from "vitest";
import {
  getContentIndex,
  getDocumentBySlug,
  getExerciseBySlug,
  getInterviewCompanyBySlug,
  getInterviewQuestionBySlug,
  getLearningPathBySlug,
  getNextPathNodeRoute,
  getPassiveFlashcardFeedByPathSlug,
  getReferencedDiagrams,
} from ".";

describe("generated content index", () => {
  it("loads starter documents and diagrams", () => {
    const index = getContentIndex();

    expect(index.schemaVersion).toBe(4);
    expect(index.documents.length).toBeGreaterThanOrEqual(3);
    expect(index.diagrams.length).toBeGreaterThanOrEqual(2);
    expect(index.learningPaths.length).toBeGreaterThanOrEqual(2);
    expect(index.exercises.length).toBeGreaterThanOrEqual(4);
    expect(index.interviewCompanies.length).toBeGreaterThanOrEqual(8);
    expect(index.passiveFlashcardFeeds.length).toBeGreaterThanOrEqual(1);
    expect(getDocumentBySlug("system-design/cache-invalidation")?.title).toBe("Cache Invalidation Under Product Pressure");
    expect(getLearningPathBySlug("system-design-fundamentals")?.title).toBe("System Design Fundamentals");
    expect(getExerciseBySlug("system-design/versioned-keys-cloze")?.type).toBe("cloze");
  });

  it("loads the Python refresh path, documents, and questionnaires", () => {
    const path = getLearningPathBySlug("python-for-ts-js-engineers");
    const document = getDocumentBySlug("programming/python-runtime-model");
    const questionnaire = getExerciseBySlug("programming/python-runtime-questionnaire");

    expect(path?.title).toBe("Python For TypeScript And JavaScript Engineers");
    expect(path?.units.flatMap((unit) => unit.nodes).map((node) => node.slug)).toEqual([
      "programming/python-runtime-model",
      "programming/python-runtime-questionnaire",
      "programming/python-types-and-contracts",
      "programming/python-types-questionnaire",
      "programming/python-packaging-environments",
      "programming/python-packaging-questionnaire",
      "programming/python-async-testing-production",
      "programming/python-async-questionnaire",
    ]);
    expect(document?.track).toBe("Programming");
    expect(questionnaire?.type).toBe("questionnaire");
    expect(questionnaire?.route).toBe("/practice/programming/python-runtime-questionnaire");
  });

  it("loads the passive Python flashcard feed", () => {
    const feed = getPassiveFlashcardFeedByPathSlug("python-for-ts-js-engineers");

    expect(feed?.title).toBe("Python Flashcard Feed");
    expect(feed?.route).toBe("/paths/python-for-ts-js-engineers/flashcards");
    expect(feed?.cards).toHaveLength(320);
    expect(feed?.cards.map((card) => card.type)).toEqual(expect.arrayContaining(["concept", "practical", "snippet", "interview"]));
    expect(feed?.cards.some((card) => card.code?.includes("def "))).toBe(true);
  });

  it("resolves diagram references from article frontmatter", () => {
    const document = getDocumentBySlug("system-design/cache-invalidation");

    expect(document).toBeDefined();
    expect(getReferencedDiagrams(document?.diagramRefs ?? []).map((diagram) => diagram.slug)).toEqual(["system-design/cache-aside"]);
  });

  it("resolves the next node route from a path-scoped exercise", () => {
    expect(getNextPathNodeRoute("system-design-fundamentals", { kind: "exercise", slug: "system-design/cache-product-contract" })).toBe(
      "/practice/system-design/versioned-keys-cloze?path=system-design-fundamentals",
    );
  });

  it("resolves the next node route from a path-scoped questionnaire", () => {
    expect(getNextPathNodeRoute("python-for-ts-js-engineers", { kind: "exercise", slug: "programming/python-runtime-questionnaire" })).toBe(
      "/docs/programming/python-types-and-contracts?path=python-for-ts-js-engineers",
    );
  });

  it("resolves the next node route from a path-scoped document", () => {
    expect(getNextPathNodeRoute("python-for-ts-js-engineers", { kind: "document", slug: "programming/python-runtime-model" })).toBe(
      "/practice/programming/python-runtime-questionnaire?path=python-for-ts-js-engineers",
    );
  });

  it("resolves interview companies and questions from the generated index", () => {
    const company = getInterviewCompanyBySlug("amazon");
    const question = getInterviewQuestionBySlug("amazon", "two-sum-product-pair");

    expect(company?.name).toBe("Amazon");
    expect(company?.route).toBe("/interviews/amazon");
    expect(question?.route).toBe("/interviews/amazon/two-sum-product-pair");
    expect(question?.solutionTracks).toHaveLength(2);
    expect(question?.solutionTracks[0]?.languages).toEqual(
      expect.objectContaining({
        python: expect.objectContaining({ code: expect.any(String) }),
        typescript: expect.objectContaining({ code: expect.any(String) }),
        java: expect.objectContaining({ code: expect.any(String) }),
      }),
    );
  });
});
