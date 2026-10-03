/* eslint-disable @typescript-eslint/no-require-imports -- Metro requires static asset require calls. */
import {
  Canvas,
  Atlas,
  useImage,
  rect,
  Skia,
} from "@shopify/react-native-skia";
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { AccessibilityInfo, AppState, View } from "react-native";
import {
  miniatureFrames,
  miniatureScene,
  MINIATURE_SCENE_HEIGHT,
  type AnimationState,
} from "@codematica/core/game";
import atlas from "../../../../assets/game/generated/actors.json";
const texture = require("../../../../assets/game/generated/actors.png");

export function NativeGameScene({
  state = "idle",
  cosmetic = "none",
  paused = false,
  visible = true,
}: {
  state?: AnimationState;
  cosmetic?: string;
  paused?: boolean;
  visible?: boolean;
}) {
  const image = useImage(texture);
  const time = useSharedValue(0);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(true);
  const [size, setSize] = useState({
    width: 360,
    height: MINIATURE_SCENE_HEIGHT,
  });
  const sprites = miniatureFrames(state).map((name) => {
    const f = atlas.frames[name as keyof typeof atlas.frames].frame;
    return rect(f.x, f.y, f.w, f.h);
  });
  useEffect(() => {
    time.set(0);
  }, [state, time]);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const change = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    const app = AppState.addEventListener("change", (s) =>
      setActive(s === "active"),
    );
    return () => {
      mounted = false;
      change.remove();
      app.remove();
    };
  }, []);
  const playback = useFrameCallback((frame) => {
    if (visible && !paused && !reduced && active)
      time.set((value) => value + (frame.timeSincePreviousFrame ?? 0));
  }, false);
  useEffect(() => {
    playback.setActive(visible && active && !paused && !reduced);
    return () => playback.setActive(false);
  }, [playback, visible, active, paused, reduced]);
  const pose = useDerivedValue(() =>
    miniatureScene(
      size.width,
      size.height,
      state,
      time.value,
      cosmetic,
      reduced,
    ),
  );
  const transforms = useDerivedValue(() =>
    pose.value.layers.map((p) => Skia.RSXform(p.scos, p.ssin, p.tx, p.ty)),
  );
  const colors = useDerivedValue(() =>
    pose.value.layers.map((p) => Skia.Color(`rgba(255,255,255,${p.alpha})`)),
  );
  return (
    <View
      testID="game-scene"
      accessibilityRole="image"
      accessibilityLabel="Patch and three miniature zombies"
      onLayout={({ nativeEvent: { layout } }) => {
        if (layout.width > 0 && layout.height > 0)
          setSize({ width: layout.width, height: layout.height });
      }}
      style={{
        height: MINIATURE_SCENE_HEIGHT,
        backgroundColor: "#d3e2ce",
        borderRadius: 22,
        overflow: "hidden",
      }}
    >
      <Canvas style={{ flex: 1 }}>
        {image ? (
          <Atlas
            image={image}
            sprites={sprites}
            transforms={transforms}
            colors={colors}
            colorBlendMode="modulate"
          />
        ) : null}
      </Canvas>
    </View>
  );
}
