import type { ComponentPropsWithRef } from "react";
import { Text, useWindowDimensions } from "react-native";

/** Refresh only native text measurement when system text size changes. */
export function AdaptiveText(props: ComponentPropsWithRef<typeof Text>) {
  const { fontScale } = useWindowDimensions();
  return <Text key={fontScale} {...props} />;
}
