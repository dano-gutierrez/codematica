import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { GameScene } from "./GameScene";
const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  load: vi.fn(),
  destroy: vi.fn(),
  ticks: [] as ((t: { deltaMS: number }) => void)[],
  sprites: [] as {
    rotation: number;
    texture: unknown;
    alpha: number;
    x: number;
    y: number;
  }[],
  stop: vi.fn(),
  start: vi.fn(),
}));
vi.mock("pixi.js", () => {
  class Container {
    scale = { set: vi.fn() };
    position = { set: vi.fn() };
    pivot = { set: vi.fn() };
    anchor = { set: vi.fn() };
    addChild = vi.fn();
    x = 0;
    y = 0;
  }
  class Sprite extends Container {
    rotation = 0;
    alpha = 1;
    texture: unknown;
    constructor(texture: unknown) {
      super();
      this.texture = texture;
      mocks.sprites.push(this);
    }
  }
  class Application {
    init = mocks.init;
    destroy = mocks.destroy;
    renderer = { resize: vi.fn() };
    canvas = document.createElement("canvas");
    stage = new Container();
    screen = { width: 360, height: 180 };
    render = vi.fn();
    start = mocks.start;
    stop = mocks.stop;
    ticker = {
      add: (fn: (t: { deltaMS: number }) => void) => mocks.ticks.push(fn),
    };
  }
  return { Application, Container, Sprite, Assets: { load: mocks.load } };
});
let resize: () => void;
let observe: (entries: { isIntersecting: boolean }[]) => void;
beforeEach(() => {
  mocks.init.mockResolvedValue(undefined);
  mocks.load.mockResolvedValue({
    textures: new Proxy({}, { get: (_, name) => name }),
  });
  mocks.destroy.mockClear();
  mocks.ticks = [];
  mocks.sprites = [];
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(cb: () => void) {
        resize = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: typeof observe) {
        observe = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
});
it("animates shared rig parts, changes expressions and attachments, and freezes offscreen or paused", async () => {
  const view = render(<GameScene />);
  await waitFor(() =>
    expect(screen.getByTestId("game-scene")).toHaveAttribute(
      "data-ready",
      "true",
    ),
  );
  const tick = () => mocks.ticks[0]({ deltaMS: 300 });
  act(tick);
  const initial = mocks.sprites[7].rotation;
  view.rerender(<GameScene state="attack" cosmetic="antenna" />);
  act(tick);
  expect(mocks.sprites[7].rotation).not.toBe(initial);
  view.rerender(<GameScene state="celebrate" cosmetic="beacon" />);
  act(tick);
  expect(mocks.sprites.some((s) => s.texture === "patch-face-happy")).toBe(
    true,
  );
  expect(mocks.sprites.at(-1)?.alpha).toBe(0.35);
  view.rerender(<GameScene paused />);
  const before = mocks.sprites[7].rotation;
  act(tick);
  expect(mocks.sprites[7].rotation).toBe(before);
  act(() => observe([{ isIntersecting: false }]));
  expect(mocks.stop).toHaveBeenCalled();
  act(() => observe([{ isIntersecting: true }]));
  fireVisibility();
  view.unmount();
  expect(mocks.destroy).toHaveBeenCalledTimes(1);
});
function fireVisibility() {
  act(() => document.dispatchEvent(new Event("visibilitychange")));
}
it("supports reduced motion and leaves the challenge available after graphics failure", async () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const view = render(<GameScene state="reaction" />);
  await waitFor(() => expect(mocks.ticks.length).toBe(1));
  act(() => mocks.ticks[0]({ deltaMS: 300 }));
  expect(mocks.stop).toHaveBeenCalled();
  view.rerender(<GameScene state="recovery" />);
  act(() => mocks.ticks[0]({ deltaMS: 300 }));
  view.unmount();
  mocks.init.mockRejectedValueOnce(Error("GPU unavailable"));
  render(<GameScene />);
  await screen.findByText(/textual results while animation is unavailable/);
});

it("places the whole crew before the first animation tick, including paused mount and resize", async () => {
  const view = render(<GameScene paused />);
  await waitFor(() =>
    expect(screen.getByTestId("game-scene")).toHaveAttribute(
      "data-ready",
      "true",
    ),
  );
  const enemy = mocks.sprites.find((s) => s.texture === "runner")!;
  expect(enemy.x).toBeGreaterThan(100);
  expect(enemy.y).toBeGreaterThan(0);
  const before = enemy.x;
  Object.defineProperty(screen.getByTestId("game-scene"), "clientWidth", {
    configurable: true,
    value: 280,
  });
  Object.defineProperty(screen.getByTestId("game-scene"), "clientHeight", {
    configurable: true,
    value: 180,
  });
  act(() => resize());
  expect(enemy.x).toBeLessThan(before);
  view.rerender(<GameScene paused cosmetic="beacon" state="celebrate" />);
  expect(mocks.sprites.some((s) => s.texture === "patch-face-happy")).toBe(
    true,
  );
});
