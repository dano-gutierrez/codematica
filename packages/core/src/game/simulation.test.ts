import { expect, it } from "vitest";
import source from "../../../../content/game/restore-the-signal.json";
import { gameCampaignSchema, type SystemScenario } from "./schema";
import { evaluatePipes, evaluateSystem, waveAt } from "./engine";
const c = gameCampaignSchema.parse(source);
const system = (n = 7) =>
  structuredClone(c.levels[n].scenarios[0]) as SystemScenario;
it("routes round-robin load per instance and supports capacity-weighted alternatives", () => {
  const s = system();
  s.rps = 900;
  s.components = s.components.map((c) => ({
    ...c,
    capacity: c.id === "api-1" ? 100 : c.kind === "api" ? 500 : c.capacity,
  }));
  expect(evaluateSystem(s, s.solution).passed).toBe(false);
  expect(
    evaluateSystem(s, { ...s.solution, routing: "capacity-weighted" }).passed,
  ).toBe(true);
});
it("does not route around failures without a working health-checking balancer", () => {
  const s = system();
  expect(
    evaluateSystem(s, { ...s.solution, healthChecks: false }, s.rps, ["api-1"])
      .passed,
  ).toBe(false);
  expect(evaluateSystem(s, s.solution, s.rps, ["proxy"]).passed).toBe(false);
  const small = system(3);
  expect(evaluateSystem(small, small.solution, 5, ["api-1"]).passed).toBe(
    false,
  );
});
it("models cache throughput and database failure instead of inventing capacity", () => {
  const s = system(11);
  s.components = s.components.map((c) =>
    c.kind === "cache" ? { ...c, capacity: 1 } : c,
  );
  expect(evaluateSystem(s, s.solution).reasons.join()).toMatch(
    /cache.*overloaded/i,
  );
  expect(evaluateSystem(s, s.solution, s.rps, ["database"]).passed).toBe(false);
});
it("does not accept extra request branches into unrelated sinks", () => {
  const s = c.levels[2].scenarios[2];
  if (s.kind !== "pipes") throw Error();
  expect(
    evaluatePipes(s, [...s.solution, { from: "gate.send", to: "audit.in" }])
      .passed,
  ).toBe(false);
});
it("produces deterministic seeded traffic within authored wave bounds", () => {
  const s = system();
  expect(waveAt(s, 10)).toEqual(waveAt(s, 10));
  expect(waveAt(s, 10).rps).toBeLessThanOrEqual(s.waves[1].rps);
  expect(waveAt(s, 10).rps).not.toBe(
    waveAt({ ...s, seed: s.seed + 1 }, 10).rps,
  );
});
