import { LearningPathHome } from "@/components/LearningPathMap";
import { getContentIndex } from "@/lib/content";

export default function HomePage() {
  return <LearningPathHome index={getContentIndex()} />;
}
