/* eslint-disable @typescript-eslint/no-require-imports -- Metro requires static asset references. */
import { useEffect, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { parallaxOffset } from "@codematica/core/game";
const tiles = {
  "summit-0": require("../../../../assets/game/generated/map/summit-0.webp"),
  "summit-1": require("../../../../assets/game/generated/map/summit-1.webp"),
  "summit-2": require("../../../../assets/game/generated/map/summit-2.webp"),
  "woodland-0": require("../../../../assets/game/generated/map/woodland-0.webp"),
  "woodland-1": require("../../../../assets/game/generated/map/woodland-1.webp"),
  "woodland-2": require("../../../../assets/game/generated/map/woodland-2.webp"),
  "highlands-0": require("../../../../assets/game/generated/map/highlands-0.webp"),
  "highlands-1": require("../../../../assets/game/generated/map/highlands-1.webp"),
  "highlands-2": require("../../../../assets/game/generated/map/highlands-2.webp"),
  "city-0": require("../../../../assets/game/generated/map/city-0.webp"),
  "city-1": require("../../../../assets/game/generated/map/city-1.webp"),
  "city-2": require("../../../../assets/game/generated/map/city-2.webp"),
};
const foliage = [
  require("../../../../assets/game/generated/map/foliage-0.webp"),
  require("../../../../assets/game/generated/map/foliage-1.webp"),
  require("../../../../assets/game/generated/map/foliage-2.webp"),
];
export function NativeDistrictArt({
  district,
  panel,
  panelTop = 0,
  scroll,
  restored,
  details,
}: {
  district: "garden" | "canal" | "tower";
  panel?: keyof typeof tiles;
  panelTop?: number;
  scroll: SharedValue<number>;
  restored: boolean;
  details: number;
}) {
  const [size, setSize] = useState({ width: 350, height: 620 }),
    [reduced, setReduced] = useState(false);
  const tile =
    panel ??
    (`city-${district === "tower" ? 0 : district === "canal" ? 1 : 2}` as keyof typeof tiles);
  const terrain = useImage(tiles[tile]),
    mist = useImage(require("../../../../assets/game/generated/map/mist.webp")),
    motes = useImage(
      require("../../../../assets/game/generated/map/motes.webp"),
    ),
    leaves = useImage(foliage[Number(tile.at(-1))]);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  const mistY = useDerivedValue(() =>
      parallaxOffset(scroll.value, panelTop, size.height, 0.025, reduced),
    ),
    moteY = useDerivedValue(() =>
      parallaxOffset(scroll.value, panelTop, size.height, -0.045, reduced),
    ),
    leafY = useDerivedValue(() =>
      parallaxOffset(scroll.value, panelTop, size.height, -0.085, reduced),
    );
  // Guard pixels are shared with the adjacent tile; terrain never moves independently.
  const guard = (size.height * 64) / 1152;
  return (
    <View
      testID="game-district-art"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <Canvas style={{ flex: 1 }}>
        {terrain && (
          <Image
            image={terrain}
            fit="fill"
            x={0}
            y={-guard}
            width={size.width}
            height={size.height + guard * 2}
          />
        )}
        {mist && (
          <Image
            image={mist}
            fit="fill"
            x={0}
            y={mistY}
            width={size.width}
            height={size.height}
          />
        )}
        {motes && (
          <Image
            image={motes}
            fit="fill"
            x={0}
            y={moteY}
            width={size.width}
            height={size.height}
            opacity={restored ? 1 : 0.3 + details * 0.12}
          />
        )}
        {leaves && (
          <Image
            image={leaves}
            fit="fill"
            x={0}
            y={leafY}
            width={size.width}
            height={size.height}
            opacity={0.7}
          />
        )}
      </Canvas>
    </View>
  );
}
