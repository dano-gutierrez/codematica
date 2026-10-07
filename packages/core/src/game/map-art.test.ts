import { expect, it } from "vitest";
import { MAP_PANELS, MAP_CAPACITY, parallaxOffset } from "./map-art";
it("reserves fifty positions without adding authored or interactive levels", () => {
  expect(MAP_CAPACITY).toBe(50);
  expect(MAP_PANELS.reduce((n, p) => n + p.last - p.first + 1, 0)).toBe(50);
  expect(MAP_PANELS.at(-1)?.first).toBe(1);
  for (let i = 1; i < MAP_PANELS.length; i++)
    expect(MAP_PANELS[i - 1].first).toBe(MAP_PANELS[i].last + 1);
  expect(
    MAP_PANELS.filter((p) => "district" in p).map((p) => p.district),
  ).toEqual(["tower", "canal", "garden"]);
});
it("moves three overlay depths smoothly and bounds them relative to their own panel", () => {
  const offsets = [0.025, -0.045, -0.085].map((speed) =>
    parallaxOffset(800, 400, 940, speed, false),
  );
  expect(new Set(offsets).size).toBe(3);
  expect(parallaxOffset(9000, 400, 940, -0.085, false)).toBe(-48);
  expect(parallaxOffset(-9000, 400, 940, 0.025, false)).toBe(-48);
  expect(parallaxOffset(800, 400, 940, 0.025, true)).toBe(0);
  expect(
    Math.abs(
      parallaxOffset(941, 400, 940, 0.025, false) -
        parallaxOffset(939, 400, 940, 0.025, false),
    ),
  ).toBeLessThan(1);
});
