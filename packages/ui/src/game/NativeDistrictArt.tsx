/* eslint-disable @typescript-eslint/no-require-imports -- Metro resolves bundled textures from static require calls. */
import { useEffect, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
const layers = {
  garden: [
    require("../../../../assets/game/generated/garden.webp"),
    require("../../../../assets/game/generated/garden-middle.webp"),
    require("../../../../assets/game/generated/garden-foreground.webp"),
    require("../../../../assets/game/generated/garden-restored.webp"),
  ],
  canal: [
    require("../../../../assets/game/generated/canal.webp"),
    require("../../../../assets/game/generated/canal-middle.webp"),
    require("../../../../assets/game/generated/canal-foreground.webp"),
    require("../../../../assets/game/generated/canal-restored.webp"),
  ],
  tower: [
    require("../../../../assets/game/generated/tower.webp"),
    require("../../../../assets/game/generated/tower-middle.webp"),
    require("../../../../assets/game/generated/tower-foreground.webp"),
    require("../../../../assets/game/generated/tower-restored.webp"),
  ],
};
export function NativeDistrictArt({
  district,
  scroll,
  restored,
  details,
}: {
  district: keyof typeof layers;
  scroll: SharedValue<number>;
  restored: boolean;
  details: number;
}) {
  const [size, setSize] = useState({ width: 350, height: 940 }),
    [reduced, setReduced] = useState(false);
  const background = useImage(layers[district][0]),
    middle = useImage(layers[district][1]),
    foreground = useImage(layers[district][2]),
    lights = useImage(layers[district][3]);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => listener.remove();
  }, []);
  const backY = useDerivedValue(() =>
      reduced ? -50 : -50 + (scroll.value % 940) * 0.025,
    ),
    frontY = useDerivedValue(() =>
      reduced ? -50 : -50 - (scroll.value % 940) * 0.015,
    );
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 24,
        overflow: "hidden",
      }}
    >
      <Canvas style={{ flex: 1 }}>
        {background ? (
          <Image
            image={background}
            fit="cover"
            x={0}
            y={backY}
            width={size.width}
            height={size.height + 100}
          />
        ) : null}
        {middle ? (
          <Image
            image={middle}
            fit="cover"
            x={0}
            y={0}
            width={size.width}
            height={size.height}
          />
        ) : null}
        {foreground ? (
          <Image
            image={foreground}
            fit="cover"
            x={0}
            y={frontY}
            width={size.width}
            height={size.height + 100}
          />
        ) : null}
        {lights ? (
          <Image
            image={lights}
            fit="cover"
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            opacity={restored ? 1 : details * 0.16}
          />
        ) : null}
      </Canvas>
    </View>
  );
}
