import { LoginScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../src/lib/adapters";

export default function LoginRoute() {
  const adapters = useCodematicaAdapters();

  return <LoginScreen adapters={adapters} />;
}
