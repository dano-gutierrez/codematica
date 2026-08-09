import { getJapaneseVocabulary } from "@codematica/core";
import { JapaneseFlashcardReviewScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../../src/lib/adapters";

export default function JapaneseFlashcardsRoute() {
  return <JapaneseFlashcardReviewScreen vocabulary={getJapaneseVocabulary()} adapters={useCodematicaAdapters()} />;
}
