import { useAdminAccess } from "../src/lib/use-admin-access";
import { useAccountSession } from "../src/lib/use-account-session";
import { isNativeHandwritingRoute } from "../src/lib/handwriting-navigation";
import { Stack, usePathname, useRouter, useGlobalSearchParams } from "expo-router";
import { View, useWindowDimensions } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Button, colors, NativeNavigation } from "@codematica/ui";

export default function RootLayout() {
  const isAdmin = useAdminAccess();
  const { user, isLoading, signOut } = useAccountSession();
  const pathname = usePathname();
  const { returnTo } = useGlobalSearchParams<{returnTo?:string}>();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 768 && width / fontScale >= 600;
  const name = [user?.user_metadata.full_name, user?.user_metadata.name].find((value): value is string => typeof value === "string" && !!value.trim())?.trim() || user?.email?.split("@")[0] || "Account";
  const navigation = <NativeNavigation isAdmin={isAdmin && !!user} account={user ? { name, email: user.email, signOut } : undefined} accountLoading={isLoading} pathname={pathname} navigate={(href) => router.navigate(href as never)} wide={wide} />;
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.panel }}>
        <View style={{ flex: 1, flexDirection: wide ? "row" : "column" }}>
          {wide ? navigation : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <>{returnTo && /^\/play\/[a-z0-9-]+\/[a-z0-9-]+$/.test(returnTo) ? <View style={{ padding: 12 }}><Button label="Return to your challenge" tone="info" variant="secondary" testID="game-return" onPress={() => router.push(returnTo as never)} /></View>:null}</>
            <Stack screenOptions={{ headerShown: false, gestureEnabled: !isNativeHandwritingRoute(pathname), contentStyle: { backgroundColor: colors.background } }} />
          </View>
          {wide ? null : navigation}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
