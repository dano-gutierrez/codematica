import { useAdminAccess } from "../src/lib/use-admin-access";
import { Stack, usePathname, useRouter } from "expo-router";
import { View, useWindowDimensions } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors, NativeNavigation } from "@codematica/ui";

export default function RootLayout() {
  const isAdmin = useAdminAccess();
  const pathname = usePathname();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 768 && width / fontScale >= 600;
  const navigation = <NativeNavigation isAdmin={isAdmin} pathname={pathname} navigate={(href) => router.navigate(href as never)} wide={wide} />;
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.panel }}>
        <View style={{ flex: 1, flexDirection: wide ? "row" : "column" }}>
          {wide ? navigation : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
          </View>
          {wide ? null : navigation}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
