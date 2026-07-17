import { Text, View } from "react-native";
import { useCodematicaAdapters } from "../src/lib/adapters";
import { AppScreen } from "@codematica/ui";

export default function NotFoundScreen() {
  const adapters = useCodematicaAdapters();

  return (
    <AppScreen>
      <View>
        <Text style={{ color: "#263238", fontSize: 32, fontWeight: "900" }}>Not found</Text>
        <Text style={{ color: "#68737d", fontSize: 16, fontWeight: "700", marginTop: 12 }} onPress={() => adapters.navigation.navigate("/")}>
          Return to paths
        </Text>
      </View>
    </AppScreen>
  );
}
