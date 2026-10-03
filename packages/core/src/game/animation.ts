import rig from "../../../../assets/game/source/patch-rig.json";
import type { AnimationState } from "./schema";
/** Pure keyframe sampling; the worklet directive also permits Skia's UI thread. */
export function sampleAnimation(state: AnimationState, time: number) {
  "worklet";
  const animation = rig.animations[state];
  const t = animation.loop
    ? Math.max(0, time) % animation.duration
    : Math.min(Math.max(0, time), animation.duration);
  const frames = animation.frames;
  let end = 1;
  while (end < frames.length - 1 && frames[end][0] < t) end++;
  const a = frames[end - 1],
    b = frames[end];
  const weight = (t - a[0]) / (b[0] - a[0]);
  return {
    bodyY: a[1] + (b[1] - a[1]) * weight,
    armRotation: a[2] + (b[2] - a[2]) * weight,
    eyeScale: a[3] + (b[3] - a[3]) * weight,
    glow: a[4] + (b[4] - a[4]) * weight,
  };
}
export class AnimationController {
  time = 0;
  state: AnimationState;
  paused = false;
  speed = 1;
  loop: boolean;
  attachment = "none";
  constructor(state: AnimationState = "idle") {
    this.state = state;
    this.loop = rig.animations[state].loop;
  }
  transition(state: AnimationState) {
    this.state = state;
    this.time = 0;
    this.loop = rig.animations[state].loop;
  }
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }
  seek(time: number) {
    if (!Number.isFinite(time)) throw Error("Invalid animation time");
    this.time = Math.max(
      0,
      Math.min(time, rig.animations[this.state].duration),
    );
  }
  setSpeed(speed: number) {
    if (!Number.isFinite(speed) || speed < 0 || speed > 4)
      throw Error("Animation speed must be between 0 and 4");
    this.speed = speed;
  }
  setLoop(loop: boolean) {
    this.loop = loop;
  }
  attach(attachment: string) {
    this.attachment = attachment;
  }
  advance(delta: number) {
    if (this.paused || !Number.isFinite(delta) || delta < 0) return;
    const duration = rig.animations[this.state].duration,
      next = this.time + delta * this.speed;
    this.time = this.loop ? next % duration : Math.min(next, duration);
  }
  pose() {
    return sampleAnimation(this.state, this.time);
  }
}
