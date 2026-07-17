import { LearningPathHome } from "@/components/LearningPathMap";
import { getContentIndex } from "@/lib/content";
import { getProgressSummary, type ProgressDataClient } from "@/lib/progress/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const index = getContentIndex();
  const supabase = await createServerSupabaseClient();
  const progressSummary = supabase
    ? await getProgressSummary(supabase as unknown as ProgressDataClient, index).catch(() => ({ isSignedIn: false, items: [] }))
    : { isSignedIn: false, items: [] };

  return <LearningPathHome index={index} keepReadingItems={progressSummary.items} isSignedIn={progressSummary.isSignedIn} />;
}
