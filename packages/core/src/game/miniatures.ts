import rig from "../../../../assets/game/source/patch-rig.json";
import { sampleAnimation } from "./animation";
import type { AnimationState } from "./schema";

export const MINIATURE_SCENE_HEIGHT = 180;
const enemies = ["shambler", "runner", "armored"];
const centers = [62, 164, 242, 320];
const cosmetics = ["antenna", "toolbelt", "beacon"];
export type MiniatureLayer = {
  id: string;
  scos: number;
  ssin: number;
  tx: number;
  ty: number;
  alpha: number;
};

export function miniatureFrames(state: AnimationState): string[] {
  const face =
    state === "celebrate"
      ? "happy"
      : state === "reaction"
        ? "surprised"
        : state === "recovery"
          ? "tired"
          : state === "work" || state === "attack"
            ? "focused"
            : "neutral";
  return [
    ...centers.map(() => "ground-shadow"),
    ...rig.parts.map((p) => (p.id === "head" ? `patch-face-${face}` : p.asset)),
    ...cosmetics,
    ...enemies,
  ];
}

/** One 360×180 composition for Pixi and Skia, fitted to the measured scene box. */
export function miniatureScene(
  width: number,
  height: number,
  state: AnimationState,
  time: number,
  cosmetic: string,
  reduced = false,
) {
  "worklet";
  const fit = Math.min(1, width / 360, height / MINIATURE_SCENE_HEIGHT);
  const left = (width - 360 * fit) / 2;
  const top = (height - MINIATURE_SCENE_HEIGHT * fit) / 2;
  const motion = sampleAnimation(state, reduced ? 0 : time);
  const layers: MiniatureLayer[] = [];
  const add = (
    id: string,
    x: number,
    y: number,
    scale: number,
    pivotX: number,
    pivotY: number,
    rotation = 0,
    alpha = 1,
  ) => {
    const scos = scale * Math.cos(rotation) * fit;
    const ssin = scale * Math.sin(rotation) * fit;
    layers.push({
      id,
      scos,
      ssin,
      tx: left + x * fit - pivotX * scos + pivotY * ssin,
      ty: top + y * fit - pivotX * ssin - pivotY * scos,
      alpha,
    });
  };
  for (let i = 0; i < centers.length; i++)
    add(`shadow-${i}`, centers[i], 146, 0.45, 64, 64);
  const robotScale = 0.55;
  for (const part of rig.parts) {
    const rotation = part.id.includes("arm")
      ? motion.armRotation * (part.id.startsWith("left") ? 1 : -1)
      : 0;
    add(
      part.id,
      centers[0] + part.x * robotScale,
      108 + (part.y + motion.bodyY) * robotScale,
      part.scale * robotScale,
      part.pivot[0],
      part.pivot[1],
      rotation,
    );
  }
  for (const name of cosmetics) {
    const anchor = rig.attachments[name as keyof typeof rig.attachments];
    add(
      name,
      centers[0] + anchor[0] * robotScale,
      108 + (anchor[1] + motion.bodyY) * robotScale,
      0.55 * robotScale,
      64,
      64,
      0,
      name === cosmetic ? 1 : 0,
    );
  }
  for (let i = 0; i < enemies.length; i++) {
    // Small vertical steps preserve separation and keep feet on the shared ground plane.
    const step = reduced
      ? 0
      : Math.max(0, Math.sin(time / (i === 1 ? 170 : 350) + i)) *
        (i === 1 ? 2.5 : 1.2);
    add(
      `enemy-${enemies[i]}`,
      centers[i + 1],
      146 - step,
      0.6,
      64,
      124,
      0,
      state === "celebrate" ? 0.35 : 1,
    );
  }
  return {
    layers,
    actors: ["patch", ...enemies].map((id, i) => ({
      id,
      left: left + (centers[i] - (i === 0 ? 43 : 38.4)) * fit,
      right: left + (centers[i] + (i === 0 ? 43 : 38.4)) * fit,
      height: (i === 0 ? 88 : 74.4) * fit,
    })),
  };
}
