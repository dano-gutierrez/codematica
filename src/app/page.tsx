import { KnowledgeBrowser } from "@/components/KnowledgeBrowser";
import { getContentIndex } from "@/lib/content";

export default function HomePage() {
  return <KnowledgeBrowser index={getContentIndex()} />;
}
