import { describe, expect, it } from "vitest";
import { gameCampaignSchema } from "./schema";
import {
  emptyGameProgress,
  awardScenario,
  mergeGameProgress,
  gameTotals,
  isLevelUnlocked,
  getStreak,
} from "./progress";
import {
  createAttempt,
  transitionAttempt,
  evaluatePipes,
  evaluateSystem,
  evaluateSystemScenarios,
  sampleAnimation,
} from "./engine";
import { validateCss, validateSql } from "./sandbox";
import campaignJson from "../../../../content/game/restore-the-signal.json";

const campaign = () => gameCampaignSchema.parse(campaignJson);
describe("Restore the Signal", () => {
  it("authors twelve consecutive levels, 36 configurations, and two live climaxes", () => {
    const c = campaign();
    expect(c.levels).toHaveLength(12);
    expect(c.levels.flatMap((l) => l.scenarios)).toHaveLength(36);
    expect(
      c.levels.filter((l) => l.mode === "defense").map((l) => l.order),
    ).toEqual([8, 12]);
  });
  it("unlocks only after the preceding main clear and cannot farm rewards", () => {
    const c = campaign();
    let p = emptyGameProgress("America/Los_Angeles");
    expect(isLevelUnlocked(c, c.levels[1].id, p)).toBe(false);
    p = awardScenario(
      p,
      c,
      c.levels[0].id,
      "main",
      "standard",
      new Date("2026-09-29T02:00:00Z"),
    );
    p = awardScenario(
      p,
      c,
      c.levels[0].id,
      "main",
      "standard",
      new Date("2026-09-29T02:00:00Z"),
    );
    expect(gameTotals(p)).toMatchObject({ xp: 100, stars: 1 });
    expect(isLevelUnlocked(c, c.levels[1].id, p)).toBe(true);
    expect(() =>
      awardScenario(p, c, c.levels[3].id, "main", "standard"),
    ).toThrow();
  });
  it("merges independent awards and deduplicates dates without losing progress", () => {
    const c = campaign(),
      empty = emptyGameProgress("UTC");
    const a = awardScenario(
      empty,
      c,
      c.levels[0].id,
      "main",
      "standard",
      new Date("2026-09-28T12:00:00Z"),
    );
    const b = awardScenario(
      a,
      c,
      c.levels[0].id,
      "mastery-1",
      "assisted",
      new Date("2026-09-29T12:00:00Z"),
    );
    expect(gameTotals(mergeGameProgress(a, b))).toMatchObject({
      xp: 125,
      stars: 2,
    });
    expect(getStreak(b, new Date("2026-09-30T12:00:00Z"))).toBe(2);
    expect(getStreak(b, new Date("2026-10-01T12:00:00Z"))).toBe(0);
  });
  it("freezes both clock and editing while paused and never auto resumes", () => {
    let a = createAttempt("defense");
    a = transitionAttempt(a, { type: "start" });
    a = transitionAttempt(a, { type: "pause" });
    expect(transitionAttempt(a, { type: "edit", input: "changed" })).toEqual(a);
    expect(transitionAttempt(a, { type: "tick", elapsed: 1 })).toEqual(a);
    expect(transitionAttempt(a, { type: "resume" }).phase).toBe("running");
  });
  it("grades authored pipe and architecture solutions and rejects missing routes", () => {
    for (const l of campaign().levels)
      for (const s of l.scenarios) {
        if (s.kind === "pipes") {
          expect(evaluatePipes(s, s.solution).passed, `${l.id}/${s.id}`).toBe(
            true,
          );
          expect(evaluatePipes(s, []).passed).toBe(false);
        }
        if (s.kind === "system") {
          expect(
            evaluateSystemScenarios(s, s.solution).passed,
            `${l.id}/${s.id}`,
          ).toBe(true);
          expect(
            evaluateSystem(s, { nodes: [], edges: [], invalidate: false })
              .passed,
          ).toBe(false);
        }
      }
  });
  it("accepts real CSS declarations and refuses unrelated properties or external values", () => {
    expect(validateCss("grid-column: 2 / 4; grid-row: 1 / 2;").ok).toBe(true);
    expect(validateCss("background:url(https://bad.example)").ok).toBe(false);
    expect(validateCss("position:fixed").ok).toBe(false);
    expect(validateCss("grid-column: 1 // 3;").ok).toBe(false);
  });
  it("parses SELECT safely including quoted semicolons, rejecting writes and expensive functions", () => {
    expect(validateSql("SELECT id FROM zombies WHERE zone = 'a;b'").ok).toBe(
      true,
    );
    for (const sql of [
      "DELETE FROM zombies",
      "SELECT id FROM zombies; DROP TABLE zombies",
      "SELECT randomblob(1000000000)",
      "SELECT * FROM sqlite_master",
      "ATTACH 'x' AS y",
    ])
      expect(validateSql(sql).ok, sql).toBe(false);
  });
  it("samples animation deterministically and honors pause/seek", () => {
    expect(sampleAnimation("walk", 0)).toEqual(sampleAnimation("walk", 0));
    expect(sampleAnimation("walk", 0)).not.toEqual(
      sampleAnimation("walk", 200),
    );
  });
});

it("requires a new zone predicate for Target Lock mastery rather than the story's kind filter", () => {
  const scenario = campaign().levels[1].scenarios[1];
  if (scenario.kind !== "sql") throw Error();
  expect(scenario.zombies.filter(z => z.zone === "canal").map(z => z.id)).toEqual(scenario.expectedIds);
  expect(scenario.zombies.filter(z => z.kind === "runner").map(z => z.id)).not.toEqual(scenario.expectedIds);
});
