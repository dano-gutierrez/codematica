import { AdaptiveText as Text } from "@codematica/ui";
import { View } from "react-native";
import { useCodematicaAdapters } from "../src/lib/adapters";
import { AppScreen, Button, colors, spacing } from "@codematica/ui";

export default function NotFoundScreen() {
  const adapters = useCodematicaAdapters();
  return <AppScreen>
    <View style={{ gap: spacing.xl, paddingVertical: spacing.xxl }}>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 30, fontWeight: "600" }}>This page is unavailable.</Text>
      <Text style={{ color: colors.textMuted, fontSize: 16, lineHeight: 24 }}>Try the lesson library or return home.</Text>
      <Button label="Back to home" onPress={() => adapters.navigation.navigate("/")} testID="mobile-not-found-home" />
      <Button label="Find a lesson" variant="secondary" tone="neutral" onPress={() => adapters.navigation.navigate("/browse")} testID="mobile-not-found-browse" />
    </View>
  </AppScreen>;
}
