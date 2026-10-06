import { describe, expect, it } from "vitest";
import {
  getDocumentBySlug,
  getExerciseBySlug,
  getLearningPathBySlug,
  getNextPathNodeRoute,
  getSourceById,
} from ".";
const base = "software-engineering/";
const cases = [
  {
    slug: "concurrency-boundaries",
    quiz: "concurrency-boundary-checkpoint",
    sources: [
      "backend-python313-threading",
      "backend-java17-thread-states",
      "backend-java17-memory-model",
    ],
    headings: [
      "separate-progress-from-simultaneous-execution",
      "protect-the-whole-transition",
      "wait-for-state-not-a-notification",
      "account-for-permit-ownership",
      "name-the-lifetime-and-coordination-scope",
    ],
    phrases: [
      "a volatile counter increment is not one atomic transition",
      "both workers write 1",
      "notify does not release the condition lock",
      "recheck the predicate while holding its lock",
      "release only a permit actually acquired",
      "RUNNABLE is not proof of current CPU execution",
      "a process-local lock does not fence another process",
      "no threaded benchmark or live scheduler was run",
    ],
    answers: [
      "The trace can finish at 1; protect the whole read-modify-write transition.",
      "Recheck the predicate under the reacquired condition lock; notification is not a reserved item.",
      "Do not release: no permit was acquired, and unconditional release corrupts capacity accounting.",
      "RUNNABLE is a JVM state; it does not prove the thread currently owns a CPU.",
      "Use shared authoritative ownership and stale-worker rejection; a local mutex alone cannot fence another process.",
    ],
  },
  {
    slug: "pattern-selection-contracts",
    quiz: "pattern-selection-checkpoint",
    sources: ["backend-fowler-polymorphism", "backend-dotnet-di-lifetimes"],
    headings: [
      "choose-the-change-axis",
      "preserve-the-substitution-contract",
      "adapt-units-without-hiding-failures",
      "wrap-one-call-without-changing-its-outcome",
      "own-shared-state-and-lifetimes",
    ],
    phrases: [
      "pattern counts are not a seniority standard",
      "preserve accepted inputs, results and errors",
      "12.50 USD becomes 1250 cents",
      "a logging wrapper must not turn an exception into success",
      "one construction does not make shared state thread-safe",
      "a request-scoped dependency must not become global by accident",
      "no complete design-pattern catalog or installed framework was tested",
    ],
    answers: [
      "Keep the simple conditional until an actual change axis justifies extra indirection.",
      "Preserve accepted inputs, returned values and errors across every strategy and caller.",
      "Convert 12.50 USD to 1250 cents under an explicit currency/unit contract; reject ambiguous input.",
      "Invoke the underlying operation once and preserve its result or exception; define instrumentation failure policy separately.",
      "Check shared-state synchronization and dependency scope; one construction does not make the instance safe.",
    ],
  },
];
describe("backend concurrency and pattern reviews", () => {
  it.each([
    [
      "backend-python313-threading",
      "https://docs.python.org/3.13/library/threading.html",
      "Python 3.13",
    ],
    [
      "backend-java17-thread-states",
      "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Thread.State.html",
      "Java SE 17",
    ],
    [
      "backend-java17-memory-model",
      "https://docs.oracle.com/javase/specs/jls/se17/html/jls-17.html",
      "17.4.3–17.4.5",
    ],
    [
      "backend-fowler-polymorphism",
      "https://refactoring.com/catalog/replaceConditionalWithPolymorphism.html",
      "catalog entry",
    ],
    [
      "backend-dotnet-di-lifetimes",
      "https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines",
      "Thread safety",
    ],
  ])("pins selected primary scope for %s", (id, url, scope) => {
    const source = getSourceById(id);
    expect(source).toMatchObject({ url, lastVerifiedAt: "2026-10-04" });
    expect(source?.attribution).toContain(scope);
    expect(source?.license).toBeUndefined();
  });
  for (const row of cases) {
    it(`keeps ${row.slug} contracts and explicit sources`, () => {
      const doc = getDocumentBySlug(base + row.slug);
      expect(doc?.sourceRefs).toEqual(row.sources);
      expect(doc?.prerequisites).toEqual(
        row.slug === "concurrency-boundaries"
          ? ["programming/python-runtime-model"]
          : [base + "concurrency-boundaries"],
      );
      expect(doc?.headings.map((h) => h.id)).toEqual(row.headings);
      for (const phrase of row.phrases) expect(doc?.markdown).toContain(phrase);
      for (const id of row.sources)
        expect(doc?.markdown).toContain(`](${getSourceById(id)?.url})`);
      for (const m of (doc?.markdown ?? "").matchAll(
        /\]\(\/docs\/([^)?#]+)(?:[?#][^)]*)?\)/g,
      ))
        expect(getDocumentBySlug(m[1]), m[1]).toBeDefined();
    });
    it(`pins five independent ${row.quiz} answers`, () => {
      const quiz = getExerciseBySlug(base + row.quiz);
      if (quiz?.type !== "questionnaire")
        throw new Error("Needs questionnaire");
      expect(quiz.documentSlug).toBe(base + row.slug);
      expect(quiz.sourceRefs).toEqual(row.sources);
      expect(quiz.questions.map((q) => q.id)).toEqual(
        row.slug === "concurrency-boundaries"
          ? [
              "lost-update",
              "predicate-wait",
              "permit-timeout",
              "jvm-state",
              "process-scope",
            ]
          : [
              "change-axis",
              "substitution",
              "unit-adapter",
              "wrapper-outcome",
              "singleton-scope",
            ],
      );
      expect(
        quiz.questions.map((q) =>
          q.kind === "choice"
            ? q.options.filter((o) => o.isCorrect).map((o) => o.label)
            : [],
        ),
      ).toEqual(row.answers.map((a) => [a]));
    });
  }
  it("preserves the four existing units before two scoped reviews", () => {
    const path = getLearningPathBySlug("backend-engineer-readiness")!;
    expect(path.units.map((u) => u.slug)).toEqual([
      "production-judgment",
      "durable-retries",
      "reservation-boundaries",
      "progressive-state",
      "concurrency-boundaries",
      "pattern-selection",
    ]);
    expect(path.units.slice(4).map((u) => u.nodes)).toEqual(
      cases.map((r) => [
        { kind: "document", slug: base + r.slug },
        { kind: "exercise", slug: base + r.quiz },
      ]),
    );
    expect(
      getNextPathNodeRoute(path.slug, {
        kind: "exercise",
        slug: base + "progressive-state-checkpoint",
      }),
    ).toBe(`/docs/${base + cases[0].slug}?path=${path.slug}`);
    for (const [i, row] of cases.entries()) {
      expect(
        getNextPathNodeRoute(path.slug, {
          kind: "document",
          slug: base + row.slug,
        }),
      ).toBe(`/practice/${base + row.quiz}?path=${path.slug}`);
      expect(
        getNextPathNodeRoute(path.slug, {
          kind: "exercise",
          slug: base + row.quiz,
        }),
      ).toBe(
        i === 0 ? `/docs/${base + cases[1].slug}?path=${path.slug}` : undefined,
      );
      expect(
        getLearningPathBySlug("system-design-fundamentals")
          ?.units.flatMap((u) => u.nodes)
          .some((n) => n.slug === base + row.slug),
      ).toBe(false);
    }
  });
});
