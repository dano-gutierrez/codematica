import type { Metadata } from "next";
import { JapaneseLanguageBrowser } from "@/components/JapaneseLanguageBrowser";
import { getContentIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Japanese - Codematica",
  description: "Search beginner Japanese characters and vocabulary with IPA and handwriting practice.",
};

export default function JapaneseLanguagePage() {
  return <JapaneseLanguageBrowser index={getContentIndex()} />;
}
