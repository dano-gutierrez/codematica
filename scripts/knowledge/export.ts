import { resolve } from "node:path";
import { exportCatalog,writeCatalog } from "./export-catalog";
const root=resolve(process.argv[2]||process.cwd()),target=resolve(process.argv[3]||".local/knowledge/catalog.json");
const snapshot=await exportCatalog(root);
await writeCatalog(target,snapshot);
console.log(JSON.stringify({file:target,snapshot:snapshot.id,counts:snapshot.counts,exclusions:snapshot.exclusions.length,unresolved:snapshot.unresolved.length,sourceRevision:snapshot.sourceRevision,dirty:snapshot.dirty}));
