import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { getContentIndex, getDocumentBySlug, getExerciseBySlug, getLearningPathBySlug, getNextPathNodeRoute, getPassiveFlashcardFeedByPathSlug } from ".";
import { checkQuestionAnswer } from "../practice/questionnaire";

const units = ["role-and-transition", "discovery-and-domain", "value-and-scope", "data-and-sql", "integrations-and-workflows", "security-and-trust", "ai-and-retrieval", "evaluation-and-experiments", "prototype-to-production", "operations-and-incidents", "adoption-and-handover", "customer-communication", "case-studies", "portfolio-capstone", "interview-practice", "career-launch"];

describe("Forward Deployed Engineer career curriculum", () => {
  it("executes the original SQL and Python fixtures and detects the taught boundary mutations", () => {
    const sql = getDocumentBySlug("fde/data-and-sql")?.markdown.match(/```sql\n([\s\S]*?)```/)?.[1];
    const python = getDocumentBySlug("fde/integrations-and-workflows")?.markdown.match(/```python\n([\s\S]*?)```/)?.[1];
    expect(sql).toBeDefined();
    expect(python).toBeDefined();
    const result = execFileSync("python3", ["-I", "-c", `
import json, sqlite3, sys
fixture = json.load(sys.stdin)
with sqlite3.connect(":memory:") as db:
    expected = [("a", "t1", "shipped"), ("a", "t2", None), ("b", "t3", "processing")]
    assert db.execute(fixture["sql"]).fetchall() == expected
    unscoped = fixture["sql"].replace("o.tenant_id = t.tenant_id AND ", "")
    assert len(db.execute(unscoped).fetchall()) == 5
    inner = fixture["sql"].replace("LEFT JOIN", "INNER JOIN")
    assert db.execute(inner).fetchall() == [expected[0], expected[2]]
code = fixture["python"]
exec(compile(code, "fde-receipt-fixture", "exec"), {})
for before, after in [("identity = (tenant, key)", "identity = key"), ('return "conflict"', 'return "replay"')]:
    assert before in code
    try:
        exec(compile(code.replace(before, after), "fde-receipt-mutation", "exec"), {})
    except AssertionError:
        pass
    else:
        raise AssertionError("Boundary mutation survived")
print("SQL rows and receipt mutations verified")
`], { input: JSON.stringify({ sql, python }), encoding: "utf8", timeout: 10_000 });
    expect(result.trim()).toBe("SQL rows and receipt mutations verified");
  });

  it("publishes a complete, source-backed role path using existing local readers", () => {
    const path = getLearningPathBySlug("forward-deployed-engineer");
    expect(path).toMatchObject({ kind: "role", status: "published", sourcePolicy: "required", completionDestination: "flashcard-feed" });
    expect(path?.units.map(unit => unit.slug)).toEqual(units);
    for (const unit of path!.units) {
      expect(unit.nodes[0]).toMatchObject({ kind: "document", slug: `fde/${unit.slug}` });
      for (const node of unit.nodes) {
        const item = node.kind === "document" ? getDocumentBySlug(node.slug) : getExerciseBySlug(node.slug);
        expect(item?.status, node.slug).toBe("published");
        expect(item?.sourceRefs?.length, node.slug).toBeGreaterThan(0);
      }
    }
    expect(path?.units.flatMap(unit => unit.nodes).filter(node => node.kind === "exercise" && getExerciseBySlug(node.slug)?.type === "guided-lab")).toHaveLength(4);
    expect(getNextPathNodeRoute(path!.slug, { kind: "exercise", slug: "fde/career-launch-checkpoint" })).toBe("/paths/forward-deployed-engineer/flashcards");
  });

  it("preserves practical learning, evidence limits, and valid local reading destinations", () => {
    for (const slug of units) {
      const doc = getDocumentBySlug(`fde/${slug}`);
      expect(doc?.headings.map(heading => heading.id), slug).toEqual(expect.arrayContaining(["practice", "review-your-work"]));
      for (const match of doc!.markdown.matchAll(/\]\(\/docs\/([^)?#]+)(?:[?#][^)]*)?\)/g)) {
        expect(getDocumentBySlug(match[1]), match[1]).toBeDefined();
      }
    }
    expect(getDocumentBySlug("fde/case-studies")?.markdown).toContain("vendor-reported");
    expect(getDocumentBySlug("fde/case-studies")?.markdown).toContain("98% of advisor teams");
    expect(getDocumentBySlug("fde/interview-practice")?.markdown).toContain("not a reported employer interview loop");
    expect(getDocumentBySlug("fde/role-and-transition")?.markdown).toContain("Frontend and mobile");
    expect(getDocumentBySlug("fde/portfolio-capstone")?.markdown).toContain("synthetic");
    const feed = getPassiveFlashcardFeedByPathSlug("forward-deployed-engineer");
    expect(feed?.cards).toHaveLength(32);
    expect(new Set(feed?.cards.map(card => card.sourceDocSlug)).size).toBe(16);
    const sources = getContentIndex().sources.filter(source => source.sourcePath.endsWith("forward-deployed-engineer.json"));
    expect(sources.length).toBeGreaterThanOrEqual(10);
    expect(sources.every(source => source.lastVerifiedAt === "2026-10-07")).toBe(true);
  });

  it("grades all 64 scenario choices and rejects every distractor", () => {
    // An independently authored answer key: rotating the option position must not change the meaning.
    const key = [
      ["outcome", "bridge", "ownership", "evidence"], ["observe", "map", "constraint", "playback"],
      ["sixty", "baseline", "slice", "decision"], ["grain", "quarantine", "left", "freshness"],
      ["reconcile", "scope", "atomic", "bounded"], ["object", "filter", "minimize", "separate"],
      ["simple", "retrieve", "abstain", "authorize"], ["holdout", "slice", "paired", "version"],
      ["artifact", "rollback", "compatible", "owner"], ["user", "mitigate", "redact", "evidence"],
      ["denominator", "reopen", "teachback", "separate"], ["options", "unknown", "boundary", "reproduce"],
      ["adoption", "maximum", "historical", "hypothesis"], ["vertical", "denied", "crash", "label"],
      ["clarify", "reconcile", "specific", "practice"], ["deliverable", "verify", "permission", "gap"],
    ];
    units.forEach((unit, index) => {
      const quiz = getExerciseBySlug(`fde/${unit}-checkpoint`);
      if (quiz?.type !== "questionnaire") throw new Error(`Missing FDE checkpoint: ${unit}`);
      expect(quiz.questions).toHaveLength(4);
      quiz.questions.forEach((question, questionIndex) => {
        if (question.kind !== "choice") throw new Error("Expected a choice scenario");
        for (const option of question.options) {
          expect(checkQuestionAnswer(question, { kind: "choice", selectedOptionId: option.id }).isCorrect, `${unit}/${question.id}/${option.id}`).toBe(option.id === key[index][questionIndex]);
        }
      });
    });
  });
});
