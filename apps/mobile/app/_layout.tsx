import { Stack, usePathname, useRouter, useGlobalSearchParams } from "expo-router";
import { View, Pressable, Text, useWindowDimensions } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors, NativeNavigation } from "@codematica/ui";

export default function RootLayout() {
  const pathname = usePathname();
  const { returnTo } = useGlobalSearchParams<{returnTo?:string}>();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 768 && width / fontScale >= 600;
  const navigation = <NativeNavigation pathname={pathname} navigate={(href) => router.navigate(href as never)} wide={wide} />;
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.panel }}>
        <View style={{ flex: 1, flexDirection: wide ? "row" : "column" }}>
          {wide ? navigation : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <>{returnTo && /^\/play\/[a-z0-9-]+\/[a-z0-9-]+$/.test(returnTo) ? <Pressable accessibilityRole="button" testID="game-return" onPress={()=>router.push(returnTo as never)} style={{padding:15,backgroundColor:"#dce7cf"}}><Text>Return to your challenge →</Text></Pressable>:null}</>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
          </View>
          {wide ? null : navigation}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
