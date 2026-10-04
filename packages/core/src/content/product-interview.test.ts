import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { setImmediate as nextTurn } from "node:timers/promises";
import { describe, expect, it, vi } from "vitest";
import { getContentIndex, getDocumentBySlug, getExerciseBySlug, getLearningPathBySlug, getNextPathNodeRoute, getPassiveFlashcardFeedByPathSlug } from ".";
import { checkQuestionAnswer } from "../practice/questionnaire";
import { searchContent } from "../search";

const pathSlug = "product-engineering-interview";
const topics = ["research-brief", "javascript-preview-coordinator", "durable-generation-architecture", "mock-interview"];
const docSlug = (topic: string) => `software-engineering/product-interview-${topic}`;

describe("Product Engineering preparation curriculum", () => {
  it("publishes neutral titles and links only to general technical sources", () => {
    const path = getLearningPathBySlug(pathSlug);
    expect(path?.title).toBe("Product Engineering Interview");
    const documents = topics.map((topic) => getDocumentBySlug(docSlug(topic)));
    const sourceRefs = new Set([
      ...path!.sourceRefs!,
      ...documents.flatMap((document) => document!.sourceRefs!),
      ...path!.units.flatMap((unit) => unit.nodes)
        .filter((node) => node.kind === "exercise")
        .flatMap((node) => getExerciseBySlug(node.slug)!.sourceRefs!),
    ]);
    const allowedHosts = new Set(["developer.mozilla.org", "docs.cloud.google.com", "sre.google", "opentelemetry.io", "www.rfc-editor.org", "docs.stripe.com", "www.sqlite.org", "docs.python.org", "kafka.apache.org", "redis.io"]);
    for (const ref of sourceRefs) {
      const source = getContentIndex().sources.find((entry) => entry.id === ref);
      expect(source).toBeDefined();
      expect(allowedHosts.has(new URL(source!.url).hostname)).toBe(true);
    }
    for (const document of documents) {
      for (const [url] of document!.markdown.matchAll(/https?:\/\/[^\s)]+/g)) {
        expect(allowedHosts.has(new URL(url).hostname)).toBe(true);
      }
    }
  });

  it("connects the research, coding, design, and mock interview without remote content", () => {
    const path = getLearningPathBySlug(pathSlug);
    expect(path?.sourcePolicy).toBe("required");
    expect(path?.units).toHaveLength(4);
    const sourceIds = new Set(getContentIndex().sources.map((source) => source.id));
    for (const topic of topics) {
      const document = getDocumentBySlug(docSlug(topic));
      expect(document?.status).toBe("published");
      expect(document?.sourceRefs?.length).toBeGreaterThan(0);
      for (const ref of document!.sourceRefs!) expect(sourceIds.has(ref)).toBe(true);
    }
    expect(getNextPathNodeRoute(pathSlug, { kind: "document", slug: docSlug("research-brief") })).toBe(`/docs/${docSlug(topics[1])}?path=${pathSlug}`);
    expect(getNextPathNodeRoute(pathSlug, { kind: "document", slug: docSlug("mock-interview") })).toBe(`/practice/software-engineering/product-interview-mock-interview-lab?path=${pathSlug}`);
    expect(getNextPathNodeRoute(pathSlug, { kind: "exercise", slug: "software-engineering/product-interview-mock-interview-lab" })).toBe(`/practice/${docSlug("mock-interview")}-questionnaire?path=${pathSlug}`);
    expect(searchContent(getContentIndex(), "Product Engineering").some((result) => result.route === `/docs/${docSlug("research-brief")}`)).toBe(true);
  });

  it("grades every checkpoint option and links every review card to a published lesson", () => {
    for (const topic of topics.slice(1)) {
      const exercise = getExerciseBySlug(`${docSlug(topic)}-questionnaire`);
      expect(exercise?.type).toBe("questionnaire");
      if (exercise?.type !== "questionnaire") throw new Error(`Missing ${topic}`);
      expect(exercise.documentSlug).toBe(docSlug(topic));
      expect(exercise.questions).toHaveLength(6);
      for (const question of exercise.questions) {
        if (question.kind !== "choice") throw new Error("Expected choice checkpoint");
        expect(question.options.filter((option) => option.isCorrect)).toHaveLength(1);
        expect(question.explanation.length).toBeGreaterThan(100);
        for (const option of question.options) expect(checkQuestionAnswer(question, { kind: "choice", selectedOptionId: option.id }).isCorrect).toBe(option.isCorrect);
      }
    }
    const lab = getExerciseBySlug("software-engineering/product-interview-mock-interview-lab");
    expect(lab?.type).toBe("guided-lab");
    if (lab?.type !== "guided-lab") throw new Error("Missing mock lab");
    expect(lab.estimatedMinutes).toBe(75);
    expect(lab.evidenceChecklist.length).toBeGreaterThanOrEqual(6);
    const feed = getPassiveFlashcardFeedByPathSlug(pathSlug);
    expect(feed?.cards).toHaveLength(12);
    for (const card of feed!.cards) expect(getDocumentBySlug(card.sourceDocSlug!)?.status).toBe("published");
  });
});

type Coordinator = { submit: (input: string) => number; dispose: () => void };
type Dependencies = { generate: (input: string, options: { signal: AbortSignal }) => Promise<string>; render: (output: string) => void; onError: (error: unknown) => void };

function loadReference(): (dependencies: Dependencies) => Coordinator {
  const markdown = readFileSync(resolve("content/knowledge/software-engineering/product-interview-javascript-preview-coordinator.md"), "utf8");
  const code = [...markdown.matchAll(/```javascript\n([\s\S]*?)```/g)].map((match) => match[1]).find((code) => code.startsWith("function createPreviewCoordinator("));
  if (!code) throw new Error("Missing authored reference implementation");
  // Only the reviewed, repository-authored example is executed, with no I/O tools.
  return runInNewContext(`${code}\ncreatePreviewCoordinator`, { AbortController });
}

function deferred() {
  let resolve!: (value: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("authored plain JavaScript preview solution", () => {
  it("coalesces B into C while A runs and suppresses stale output", async () => {
    const a = deferred();
    const c = deferred();
    const generate = vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(c.promise);
    const render = vi.fn();
    const coordinator = loadReference()({ generate, render, onError: vi.fn() });
    expect(coordinator.submit("A")).toBe(1);
    coordinator.submit("B");
    coordinator.submit("C");
    expect(generate).toHaveBeenCalledTimes(1);
    a.resolve("obsolete");
    await nextTurn();
    expect(generate.mock.calls.map((call) => call[0])).toEqual(["A", "C"]);
    expect(render).not.toHaveBeenCalled();
    c.resolve("current");
    await nextTurn();
    expect(render).toHaveBeenCalledExactlyOnceWith("current");
  });

  it("ignores stale failures, reports current failures, and releases the slot", async () => {
    const a = deferred();
    const b = deferred();
    const generate = vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise).mockResolvedValueOnce("recovered");
    const render = vi.fn();
    const onError = vi.fn();
    const coordinator = loadReference()({ generate, render, onError });
    coordinator.submit("A");
    coordinator.submit("B");
    a.reject(new Error("stale"));
    await nextTurn();
    expect(onError).not.toHaveBeenCalled();
    const failure = new Error("current");
    b.reject(failure);
    await nextTurn();
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
    coordinator.submit("C");
    await nextTurn();
    expect(render).toHaveBeenCalledExactlyOnceWith("recovered");
  });

  it("disposes pending work and ignores a late success even if abort is ignored", async () => {
    const a = deferred();
    const generate = vi.fn().mockReturnValue(a.promise);
    const render = vi.fn();
    const coordinator = loadReference()({ generate, render, onError: vi.fn() });
    coordinator.submit("A");
    coordinator.submit("B");
    coordinator.dispose();
    coordinator.dispose();
    expect(generate.mock.calls[0][1].signal.aborted).toBe(true);
    a.resolve("late");
    await nextTurn();
    expect(render).not.toHaveBeenCalled();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(() => coordinator.submit("C")).toThrow("disposed");
  });

  it("recovers from synchronous adapter throws", async () => {
    const failure = new Error("adapter failure");
    const generate = vi.fn().mockImplementationOnce(() => { throw failure; }).mockResolvedValueOnce("next");
    const render = vi.fn();
    const onError = vi.fn();
    const coordinator = loadReference()({ generate, render, onError });
    coordinator.submit("A");
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
    coordinator.submit("B");
    await nextTurn();
    expect(render).toHaveBeenCalledExactlyOnceWith("next");
  });
});
