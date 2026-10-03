import { describe, expect, it, vi } from "vitest";
import { GameSession } from "./session";
import { GameStore } from "./store";
import { gameCampaignSchema } from "./schema";
import {
  awardScenario,
  emptyGameProgress,
  gameTotals,
  mergeGameProgress,
  validateGameProgress,
  getStreak,
  levelStars,
} from "./progress";
import {
  createAttempt,
  transitionAttempt,
  evaluatePipes,
  evaluateSystem,
  evaluateSystemScenarios,
  waveAt,
  toggleEdge,
  sampleAnimation,
} from "./engine";
import { validateCss, validateSql, compareTargetIds } from "./sandbox";
import { gameSandboxHtml } from "./html";
import source from "../../../../content/game/restore-the-signal.json";
const c = gameCampaignSchema.parse(source),
  date = new Date("2026-09-28T12:00:00Z");
const filled = () => {
  let p = emptyGameProgress("UTC");
  for (const l of c.levels)
    for (const s of l.scenarios)
      p = awardScenario(p, c, l.id, s.id, "standard", date);
  return p;
};
describe("campaign adversarial contracts", () => {
  it("validates ordered IDs, scenario types, and defense boundaries", () => {
    for (const mutate of [
      (x: typeof source) => {
        x.levels[0].order = 2;
      },
      (x: typeof source) => {
        x.levels[1].id = x.levels[0].id;
      },
      (x: typeof source) => {
        x.levels[0].mode = "defense";
      },
      (x: typeof source) => {
        x.levels[0].scenarios[1].id = "main";
      },
    ]) {
      const copy = structuredClone(source);
      mutate(copy);
      expect(gameCampaignSchema.safeParse(copy).success).toBe(false);
    }
  });
  it("grants each cosmetic, counts only dates with successes, and validates stored references", () => {
    const p = filled();
    expect(gameTotals(p)).toEqual({
      xp: 1800,
      stars: 36,
      cosmetics: ["none", "antenna", "toolbelt", "beacon"],
    });
    expect(levelStars(p, c.id, c.levels[0].id)).toBe(3);
    expect(validateGameProgress({ ...p, cosmetic: "beacon" }, c)).toBeTruthy();
    expect(() =>
      validateGameProgress(
        {
          ...p,
          awards: {
            unknown: { earnedAt: date.toISOString(), mode: "standard" },
          },
        },
        c,
      ),
    ).toThrow();
    expect(() =>
      validateGameProgress({ ...emptyGameProgress(), cosmetic: "beacon" }, c),
    ).toThrow();
    expect(() =>
      validateGameProgress(
        {
          ...p,
          awards: {
            [`${c.id}/${c.levels[3].id}/main`]: {
              earnedAt: date.toISOString(),
              mode: "standard",
            },
          },
        },
        c,
      ),
    ).toThrow();
    expect(() =>
      awardScenario(
        emptyGameProgress(),
        c,
        c.levels[0].id,
        "mastery-1",
        "standard",
      ),
    ).toThrow();
    expect(getStreak(emptyGameProgress(), date)).toBe(0);
    expect(getStreak(p, date)).toBe(1);
  });
  it("merges deterministically regardless of replay and preserves the earliest award", () => {
    const p = filled(),
      older = structuredClone(p);
    older.updatedAt = "2026-09-27T00:00:00.000Z";
    for (const a of Object.values(older.awards)) a.earnedAt = older.updatedAt;
    expect(mergeGameProgress(p, older).awards).toEqual(older.awards);
    expect(mergeGameProgress(older, p).awards).toEqual(older.awards);
  });
  it("handles daylight saving using calendar dates", () => {
    let p = emptyGameProgress("America/Los_Angeles");
    p = awardScenario(
      p,
      c,
      c.levels[0].id,
      "main",
      "standard",
      new Date("2026-03-08T07:59:00Z"),
    );
    p = awardScenario(
      p,
      c,
      c.levels[0].id,
      "main",
      "standard",
      new Date("2026-03-09T06:59:00Z"),
    );
    expect(p.activityDays).toEqual(["2026-03-07", "2026-03-08"]);
    expect(getStreak(p, new Date("2026-03-09T06:59:00Z"))).toBe(2);
  });
  it("detects stale caches, no return routes, wrong-direction ports, and echo loops", () => {
    const pipe = c.levels[10].scenarios[0];
    if (pipe.kind !== "pipes") throw Error();
    expect(
      evaluatePipes(pipe, [...pipe.solution, ...pipe.forbidden]).passed,
    ).toBe(false);
    expect(
      evaluatePipes(pipe, [{ from: "view.render", to: "state.update" }]).passed,
    ).toBe(false);
    const sys = c.levels[11].scenarios[0];
    if (sys.kind !== "system") throw Error();
    expect(
      evaluateSystem(sys, {
        ...sys.solution,
        invalidate: false,
      }).reasons.join(),
    ).toMatch(/stale/);
    expect(
      evaluateSystem(sys, { ...sys.solution, nodes: ["client", "api-1"] })
        .passed,
    ).toBe(false);
    expect(evaluateSystem(sys, { ...sys.solution, edges: [] }).passed).toBe(
      false,
    );
    expect(
      evaluateSystem(sys, {
        ...sys.solution,
        nodes: [...sys.solution.nodes, "unknown", "client"],
      }).passed,
    ).toBe(false);
    expect(
      evaluateSystem(sys, {
        ...sys.solution,
        edges: [...sys.solution.edges, { from: "cache", to: "client" }],
      }).passed,
    ).toBe(false);
    expect(
      evaluateSystem({ ...sys, budget: 0, maxLatency: 0 }, sys.solution).passed,
    ).toBe(false);
    expect(
      evaluateSystem(
        {
          ...sys,
          components: sys.components.map((x) =>
            x.kind === "proxy" ? { ...x, capacity: 1 } : x,
          ),
        },
        sys.solution,
      ).passed,
    ).toBe(false);
    expect(evaluateSystemScenarios(sys, sys.solution).passed).toBe(true);
    expect(waveAt(sys, 100).failed).toEqual(sys.waves.at(-1)?.failed);
  });
  it("rejects duplicate or unreachable APIs that cannot receive balanced traffic", () => {
    const sys = c.levels[3].scenarios[0];
    if (sys.kind !== "system") throw Error();
    expect(
      evaluateSystem(sys, {
        ...sys.solution,
        nodes: [...sys.solution.nodes, "api-2"],
        edges: [...sys.solution.edges, { from: "client", to: "api-2" }],
      }).reasons.join(),
    ).toMatch(/load-balancing/);
  });
  it("keeps rendering controls independent of gameplay state", () => {
    for (const state of [
      "idle",
      "walk",
      "work",
      "attack",
      "reaction",
      "recovery",
      "celebrate",
    ] as const)
      expect(Number.isFinite(sampleAnimation(state, 500).armRotation)).toBe(
        true,
      );
    const edge = { from: "a", to: "b" };
    expect(toggleEdge(toggleEdge([], edge), edge)).toEqual([]);
  });
  it("supports pause, loss, reset, assistance and frozen completion in the state machine", () => {
    let a = createAttempt("defense");
    expect(transitionAttempt(a, { type: "pause" })).toEqual(a);
    expect(transitionAttempt(a, { type: "resume" })).toEqual(a);
    a = transitionAttempt(a, { type: "edit", input: "x" });
    expect(a.input).toBe("x");
    a = transitionAttempt(a, { type: "start" });
    expect(transitionAttempt(a, { type: "start" })).toEqual(a);
    a = transitionAttempt(a, { type: "pause" });
    expect(transitionAttempt(a, { type: "win" })).toEqual(a);
    a = transitionAttempt(a, { type: "resume" });
    a = transitionAttempt(a, { type: "tick", elapsed: 1, damage: 200 });
    expect(a.phase).toBe("lost");
    expect(transitionAttempt(a, { type: "edit", input: "bad" })).toEqual(a);
    expect(transitionAttempt(a, { type: "reset" }).phase).toBe("briefing");
    expect(transitionAttempt(a, { type: "assist" }).assisted).toBe(true);
    expect(
      transitionAttempt(createAttempt("untimed"), { type: "lose" }).phase,
    ).toBe("lost");
  });
  it("keeps defense running while editing, and pauses safely during navigation", () => {
    const session = new GameSession(c.levels[7]),
      listener = vi.fn(),
      unsubscribe = session.subscribe(listener);
    session.run();
    session.pause();
    const paused = session.getSnapshot();
    session.edit("bad");
    session.place("client");
    session.invalidate(true);
    session.connect({ from: "client", to: "api-1" });
    session.submit({ passed: true, reasons: [], events: [] });
    session.tick();
    expect(session.getSnapshot()).toEqual(paused);
    session.resume();
    for (let i = 0; i < 9; i++) session.tick();
    expect(session.getSnapshot().attempt.phase).toBe("lost");
    session.reset();
    session.assist();
    const sc = session.getSnapshot().scenario;
    if (sc.kind !== "system") throw Error();
    for (const n of sc.solution.nodes) session.place(n);
    for (const e of sc.solution.edges) session.connect(e);
    session.run();
    expect(session.getSnapshot().attempt.phase).toBe("won");
    session.hint();
    session.hint();
    session.hint();
    session.hint();
    expect(session.getSnapshot().hints).toBe(3);
    session.choose("unknown");
    session.choose("mastery-1");
    session.reset();
    unsubscribe();
    expect(listener).toHaveBeenCalled();
  });
  it("wins a complete live defense with a valid architecture and fails an invalid final board", () => {
    for (const valid of [true, false]) {
      const session = new GameSession(c.levels[7]),
        s = session.getSnapshot().scenario;
      if (s.kind !== "system") throw Error();
      for (const n of s.solution.nodes) session.place(n);
      for (const e of s.solution.edges) session.connect(e);
      session.run();
      for (let i = 0; i < 23; i++) session.tick();
      if (!valid) session.place("database");
      session.tick();
      expect(session.getSnapshot().attempt.phase).toBe(valid ? "won" : "lost");
    }
  });
  it("runs pipe sessions and allows drafts and reset without affecting awards", () => {
    const session = new GameSession(c.levels[2]);
    session.run();
    expect(session.getSnapshot().failures).toBe(1);
    const sc = session.getSnapshot().scenario;
    if (sc.kind !== "pipes") throw Error();
    for (const e of sc.solution) session.connect(e);
    session.run();
    expect(session.getSnapshot().attempt.phase).toBe("won");
    const grid = new GameSession(c.levels[0]);
    grid.edit("grid-column:2");
    expect(grid.getSnapshot().code).toContain("2");
    grid.reset();
    expect(grid.getSnapshot().code).toBe(
      c.levels[0].scenarios[0].kind === "grid"
        ? c.levels[0].scenarios[0].starter
        : "",
    );
  });
  it("validates parser boundaries and compares result sets instead of query strings", () => {
    for (const sql of [
      "",
      "x".repeat(4097),
      "SELECT count(*) FROM zombies",
      "SELECT * FROM other",
      "WITH a AS (SELECT 1) SELECT * FROM a",
    ])
      expect(validateSql(sql).ok).toBe(false);
    for (const sql of c.levels
      .flatMap((l) => l.scenarios)
      .filter((s) => s.kind === "sql")
      .map((s) => s.solution))
      expect(validateSql(sql).ok).toBe(true);
    for (const css of [
      "",
      "x".repeat(4097),
      "grid-column: var(--bad);",
      "grid-column: 2 !important;",
      '@import "x";',
    ])
      expect(validateCss(css).ok).toBe(false);
    expect(compareTargetIds([1], [[1], [1]], ["id"]).passed).toBe(true);
    expect(compareTargetIds([1], [[2]], ["id"]).passed).toBe(false);
    expect(compareTargetIds([1], [[1]], ["other"]).passed).toBe(false);
  });
  it("builds escaped offline sandbox documents for both engines", () => {
    const grid = c.levels[0].scenarios[0],
      sql = c.levels[1].scenarios[0];
    if (grid.kind !== "grid" || sql.kind !== "sql") throw Error();
    expect(gameSandboxHtml(grid, "</script>", "", "a")).toContain(
      "\\u003c/script>",
    );
    expect(
      gameSandboxHtml(sql, "SELECT id FROM zombies", "worker", "b"),
    ).toContain("worker-src blob:");
  });
  it("retains local awards through network failures and merges successful remote saves", async () => {
    const p = filled(),
      memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, v: string) => {
        memory.set(key, v);
      },
    };
    const remote = {
      load: vi.fn().mockRejectedValue(Error("offline")),
      save: vi.fn().mockRejectedValue(Error("offline")),
    };
    const store = new GameStore(c, storage, remote);
    const fn = vi.fn(),
      unsub = store.subscribe(fn);
    await store.load();
    await store.save(p);
    expect(store.getSnapshot().awards).toEqual(p.awards);
    remote.load.mockResolvedValue(p);
    remote.save.mockResolvedValue(p);
    await store.load();
    await store.save(p);
    expect(fn).toHaveBeenCalled();
    unsub();
    const broken = new GameStore(c, {
      getItem: () => "{broken",
      setItem: vi.fn(),
    });
    await broken.load();
    expect(gameTotals(broken.getSnapshot()).stars).toBe(0);
  });
});
