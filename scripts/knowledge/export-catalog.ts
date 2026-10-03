import { mkdir,readFile,writeFile,readdir } from "node:fs/promises";
import { resolve,join } from "node:path";
import { execFileSync } from "node:child_process";
import { z } from "zod";
import { knowledgeRelationshipSchema } from "../../packages/core/src/knowledge";
import { buildContentIndex } from "../../packages/core/src/content/build-index";
import { buildKnowledgeCatalog,hash } from "./catalog";
export const catalogIdentity = (snapshot: {id:string;manifest:unknown;sourceRevision?:string;dirty?:boolean}) => hash(JSON.stringify({catalog:snapshot.id,manifest:snapshot.manifest,sourceRevision:snapshot.sourceRevision,dirty:snapshot.dirty}));
export async function exportCatalog(root:string,posts:Parameters<typeof buildKnowledgeCatalog>[1]=[]) {
  let approved:Parameters<typeof buildKnowledgeCatalog>[2]=[];
  try {approved=z.array(knowledgeRelationshipSchema).parse(JSON.parse(await readFile(resolve(root,"content/relationships.json"),"utf8")));}catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;}
  const index=await buildContentIndex({rootDir:root});
  const gameSources:Record<string,{path:string;hash:string}>={};
  for(const name of (await readdir(join(root,"content/game"))).filter(f=>f.endsWith(".json")).sort()){
    const raw=await readFile(join(root,"content/game",name),"utf8"),id=JSON.parse(raw).id as string;
    gameSources[id]={path:`content/game/${name}`,hash:hash(raw)};
  }
  const snapshot=buildKnowledgeCatalog(index,posts,approved,gameSources);
  snapshot.sourceRevision=execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim();
  snapshot.dirty=!!execFileSync("git",["status","--porcelain","--","content","packages/core/src/content","packages/core/src/game/schema.ts"],{cwd:root,encoding:"utf8"}).trim();
  const directory=join(root,"packages/core/src/content");
  const files=(await readdir(directory,{recursive:true})).filter(p=>p.endsWith(".ts")&&!p.includes("test")).sort();
  const parserHash=hash((await Promise.all(files.map(async f=>f+"\n"+await readFile(join(directory,f),"utf8")))).join("\n"));
  snapshot.manifest.push({path:"parser:packages/core/src/content",hash:parserHash});
  snapshot.manifest.push({path:"parser:packages/core/src/game/schema.ts",hash:hash(await readFile(join(root,"packages/core/src/game/schema.ts"),"utf8"))});
  snapshot.id=catalogIdentity(snapshot);
  return snapshot;
}
export async function writeCatalog(file:string,snapshot:Awaited<ReturnType<typeof exportCatalog>>) {
  await mkdir(resolve(file,".."),{recursive:true,mode:0o700});
  await writeFile(file,JSON.stringify(snapshot),{mode:0o600});
}
