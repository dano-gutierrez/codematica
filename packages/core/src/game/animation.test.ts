import { expect, it } from "vitest";
import { AnimationController, sampleAnimation } from "./animation";
it("controls pause, seeking, rate, looping, transitions and cosmetic attachment independently of simulation", () => {
  const a = new AnimationController("walk");
  a.advance(200);
  expect(a.pose()).toEqual(sampleAnimation("walk", 200));
  a.pause();
  a.advance(900);
  expect(a.time).toBe(200);
  a.seek(400);
  expect(a.time).toBe(400);
  a.setSpeed(2);
  a.resume();
  a.advance(100);
  expect(a.time).toBe(600);
  a.transition("reaction");
  a.advance(5000);
  expect(a.time).toBe(600);
  a.setLoop(true);
  a.advance(100);
  expect(a.time).toBe(200);
  a.attach("beacon");
  expect(a.attachment).toBe("beacon");
  a.transition("work");
  expect(a.time).toBe(0);
  expect(() => a.setSpeed(-1)).toThrow();
  expect(() => a.seek(NaN)).toThrow();
});
it("samples authored poses at exact keyframes and makes replay independent of the rendering frame rate", () => {
  const a = new AnimationController("walk"),
    b = new AnimationController("walk");
  a.advance(1000);
  for (let i = 0; i < 10; i++) b.advance(100);
  expect(a.pose()).toEqual(b.pose());
  expect(sampleAnimation("reaction", 600).eyeScale).toBe(1);
  expect(sampleAnimation("celebrate", 300).bodyY).toBe(-8);
});
