import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { JapaneseNotebookCatalog } from "@/components/JapaneseNotebookCatalog";

export default function JapaneseNotebooksPage(){return <main className="min-h-screen pb-12"><AppHeader subtitle="Japanese · notebooks"/><Suspense fallback={<p className="p-6">Opening notebooks…</p>}><JapaneseNotebookCatalog/></Suspense></main>;}
