import { KnowledgeBrowser } from "@/components/KnowledgeBrowser";
import { getContentIndex } from "@/lib/content";

export default function BrowsePage() {
  return <KnowledgeBrowser index={getContentIndex()} />;
}
