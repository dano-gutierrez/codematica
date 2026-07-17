import { getContentIndex } from "@codematica/core";
import { LearningPathHomeScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../src/lib/adapters";
import { useProgressSummary } from "../src/lib/use-progress-summary";

export default function HomeRoute() {
  const adapters = useCodematicaAdapters();
  const progress = useProgressSummary();

  return <LearningPathHomeScreen index={getContentIndex()} keepReadingItems={progress.items} isSignedIn={progress.isSignedIn} adapters={adapters} />;
}
