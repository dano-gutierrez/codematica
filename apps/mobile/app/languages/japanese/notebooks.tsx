import { getContentIndex } from "@codematica/core";
import { JapaneseNotebookCatalogScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../src/lib/adapters";
export default function JapaneseNotebooksRoute(){return <JapaneseNotebookCatalogScreen index={getContentIndex()} adapters={useCodematicaAdapters()}/>;}
