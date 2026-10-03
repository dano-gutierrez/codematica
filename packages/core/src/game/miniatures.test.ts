import { describe, expect, it } from "vitest";
import { miniatureScene, miniatureFrames } from "./miniatures";

const states = [
  "idle",
  "walk",
  "work",
  "attack",
  "reaction",
  "recovery",
  "celebrate",
] as const;
describe("in-level chibi miniatures", () => {
  it("keeps the complete crew and every cosmetic inside small and wide scene containers", () => {
    for (const [width, height] of [
      [240, 160],
      [286, 180],
      [360, 180],
      [620, 210],
      [900, 180],
    ]) {
      for (const state of states)
        for (const cosmetic of [
          "none",
          "antenna",
          "toolbelt",
          "beacon",
          "unknown",
        ]) {
          for (const time of [0, 180, 300, 600, 1200]) {
            const scene = miniatureScene(width, height, state, time, cosmetic);
            expect(scene.layers).toHaveLength(miniatureFrames(state).length);
            for (const layer of scene.layers.filter((p) => p.alpha > 0)) {
              for (const [x, y] of [
                [0, 0],
                [128, 0],
                [0, 128],
                [128, 128],
              ]) {
                const px = layer.tx + x * layer.scos - y * layer.ssin;
                const py = layer.ty + x * layer.ssin + y * layer.scos;
                expect(px).toBeGreaterThanOrEqual(0);
                expect(px).toBeLessThanOrEqual(width);
                expect(py).toBeGreaterThanOrEqual(0);
                expect(py).toBeLessThanOrEqual(height);
              }
            }
            expect(scene.actors.map((a) => a.id)).toEqual([
              "patch",
              "shambler",
              "runner",
              "armored",
            ]);
            for (let i = 1; i < scene.actors.length; i++)
              expect(scene.actors[i].left).toBeGreaterThan(
                scene.actors[i - 1].right,
              );
            const heights = scene.actors.map((a) => a.height);
            expect(Math.max(...heights) / Math.min(...heights)).toBeLessThan(
              1.3,
            );
          }
        }
    }
  });
  it("shares deterministic poses, grounded shadows, success feedback and static reduced-motion states", () => {
    const first = miniatureScene(360, 180, "walk", 200, "antenna");
    expect(first).toEqual(miniatureScene(360, 180, "walk", 200, "antenna"));
    expect(first.layers).not.toEqual(
      miniatureScene(360, 180, "walk", 600, "antenna").layers,
    );
    expect(miniatureScene(360, 180, "attack", 600, "beacon", true)).toEqual(
      miniatureScene(360, 180, "attack", 0, "beacon", true),
    );
    const win = miniatureScene(360, 180, "celebrate", 300, "none");
    expect(miniatureFrames("celebrate")).toContain("patch-face-happy");
    expect(miniatureFrames("reaction")).toContain("patch-face-surprised");
    expect(miniatureFrames("recovery")).toContain("patch-face-tired");
    expect(miniatureFrames("work")).toContain("patch-face-focused");
    expect(
      win.layers
        .filter((l) => l.id.startsWith("enemy-"))
        .every((l) => l.alpha === 0.35),
    ).toBe(true);
    expect(
      win.layers.filter((l) => l.id.startsWith("shadow-")).map((l) => l.ty),
    ).toEqual(
      first.layers.filter((l) => l.id.startsWith("shadow-")).map((l) => l.ty),
    );
  });
});
