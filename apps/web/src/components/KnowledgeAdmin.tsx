"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Search, Network } from "lucide-react";
import { createKnowledgeClient, resourceKinds, type KnowledgeClient, type KnowledgeJob, type KnowledgePage, type KnowledgeResource } from "@codematica/core/knowledge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AppHeader } from "./AppHeader";
import { Dropdown } from "./Dropdown";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { KnowledgeReport } from "./KnowledgeReport";

const button = "inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#7d8b94] bg-white px-3 py-2 text-[#263238] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#007c78]";
const input = "w-full rounded-lg border border-[#7d8b94] bg-white p-3 text-[#263238]";
export function KnowledgeAdmin({ client }: { client?: KnowledgeClient | null }) {
  const api = useMemo(() => { const db = client === undefined ? createBrowserSupabaseClient() : null; return client === undefined ? db && createKnowledgeClient(db) : client; }, [client]);
  const [access, setAccess] = useState("loading"), [page, setPage] = useState<KnowledgePage | null>(null), [error, setError] = useState("");
  const [query, setQuery] = useState(""), [filters, setFilters] = useState<Record<string, string>>({}), [selected, setSelected] = useState<KnowledgeResource | null>(null), [focus, setFocus] = useState<string | null>(null);
  const [title, setTitle] = useState(""), [body, setBody] = useState(""), [kind, setKind] = useState("document"), [key, setKey] = useState<string | null>(null), [job, setJob] = useState<KnowledgeJob | null>(null), [busy, setBusy] = useState(false);
  const alive=useRef(true),jobVersion=useRef(0),loadVersion=useRef(0);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[api]);
  const openJob=async(id:string)=>{const version=++jobVersion.current;try{const result=await api!.job(id);if(alive.current&&version===jobVersion.current)setJob(result);}catch(e){if(alive.current&&version===jobVersion.current)setError((e as Error).message);}};
  const [recent, setRecent] = useState<KnowledgeJob[]>([]);
  useEffect(()=>{let active=true;if(api&&access==="admin") void api.recent().then(rows=>{if(active)setRecent(rows);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[api,access,job?.id,job?.status]);
  useEffect(() => {
    let active=true,version=0,timer:ReturnType<typeof setTimeout>|undefined;
    const check=async()=>{
      const current=++version;
      setAccess("loading");setPage(null);setJob(null);setRecent([]);setSelected(null);setFocus(null);setTitle("");setBody("");setKey(null);setError("");setBusy(false);jobVersion.current++;loadVersion.current++;
      if(!api)return;
      try{
        const yes=await api.isAdmin();if(!active||version!==current)return;
        setAccess(yes?"admin":"denied");
        if(yes){const load=++loadVersion.current;const p=await api.browse();if(active&&version===current&&load===loadVersion.current)setPage(p);}
      }catch(e){if(active&&version===current)setError((e as Error).message);}
    };
    void check();
    // Auth callbacks finish before issuing session-dependent requests.
    const unsubscribe=api?.onAccessChange?.(()=>{version++;jobVersion.current++;loadVersion.current++;setAccess("loading");setPage(null);setJob(null);clearTimeout(timer);timer=setTimeout(()=>void check(),0);});
    return()=>{active=false;version++;clearTimeout(timer);unsubscribe?.();};
  },[api]);
  useEffect(() => {
    if (!api || !job || !["pending", "running"].includes(job.status)) return;
    let active = true;const version=jobVersion.current;
    const timer = setInterval(() => { void api.job(job.id).then(result => { if (active&&version===jobVersion.current) setJob(result); }).catch(e => { if (active&&version===jobVersion.current) setError(e.message); }); }, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [api, job]);
  const inspect = useCallback((r: KnowledgeResource) => setSelected(r), []);
  const load = async (cursor: string | null = null, nextFocus = focus) => { if (!api) return; setBusy(true); setError(""); const version=++loadVersion.current; try { const p = await api.browse(query, filters, cursor, nextFocus); if(!alive.current||version!==loadVersion.current)return; setPage(previous => cursor && previous ? { ...p, resources: [...previous.resources, ...p.resources], relationships: [...previous.relationships, ...p.relationships] } : p); } catch (e) { if(alive.current&&version===loadVersion.current)setError((e as Error).message); } finally { if(alive.current&&version===loadVersion.current)setBusy(false); } };
  const submit = async () => { if (!api) return; const idempotency = key || crypto.randomUUID(); setKey(idempotency); setBusy(true); setError(""); const version=++jobVersion.current; try { const id = await api.submit({ title, body, kind: kind as "document" }, idempotency); const result=await api.job(id);if(alive.current&&version===jobVersion.current)setJob(result); } catch(e) { if(alive.current&&version===jobVersion.current)setError((e as Error).message); } finally { if(alive.current)setBusy(false); } };
  return <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6" data-testid="knowledge-admin"><AppHeader subtitle="Knowledge explorer" />
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">Knowledge explorer</h1><Link className="text-[#006762] underline" href="/admin/linkedin">LinkedIn reviewer</Link></div>
    {!api ? <p>Configure Supabase to use the private explorer. Anonymous lessons remain available.</p> : access === "denied" ? <div><h2>Admin access required</h2><Link href="/login?next=/admin/knowledge">Sign in with your admin account</Link></div> : access === "loading" ? <p role={error?"alert":"status"}>{error||"Checking admin access…"}</p> : <>
      {error ? <p role="alert">{error}</p> : null}
      <p className="text-sm text-[#46535d]">{page?.snapshot ? `Snapshot ${page.snapshot.id.slice(0,12)} · ${Object.entries(page.snapshot.counts).map(([k,n]) => `${n} ${k}`).join(" · ")}` : "No synchronized snapshot yet. Run the local index and sync commands."}</p>
      {page?.snapshot && !page.snapshot.semantic_complete ? <p className="text-sm">Semantic extraction is incomplete. Existing resources and explicit relationships are available.</p> : null}
      <p className="text-sm">{page?.worker?.last_seen ? `Worker last seen ${new Date(page.worker.last_seen).toLocaleString()}` : "Local worker offline. Saved relationships remain available; new evaluations wait in the queue."}</p>
      <div className="flex flex-wrap gap-3"><label className="min-w-0 flex-1">Search knowledge<input className={input} value={query} onChange={e=>setQuery(e.target.value)} /></label><button className={button} disabled={busy} onClick={()=>void load()}><Search size={16} />Search</button><button className={button} disabled={busy} onClick={()=>void load()}><RefreshCw size={16} />Refresh</button></div>
      <div className="grid gap-3 sm:grid-cols-3">{[{ field:"kind", label:"Resource type", values:[...resourceKinds] },{ field:"visibility", label:"Visibility", values:["curriculum","private"] },{ field:"provenance", label:"Relationship provenance", values:["explicit","inferred","approved"] },{ field:"status", label:"Status", values:["published","draft","planned","review","inferred"] }].map(f=><Dropdown key={f.field} label={f.label} value={filters[f.field]||"all"} options={[{value:"all",label:"All"},...f.values.map(v=>({value:v,label:v}))]} onValueChange={v=>setFilters({...filters,[f.field]:v==="all"?"":v})} />)}<label>Path ID<input className={input} value={filters.path||""} placeholder="path:database-indexes-and-search" onChange={e=>setFilters({...filters,path:e.target.value})}/></label><label>Skill ID<input className={input} value={filters.skill||""} onChange={e=>setFilters({...filters,skill:e.target.value})}/></label></div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={filters.detail==="show"} onChange={e=>setFilters({...filters,detail:e.target.checked?"show":""})}/>Show sections, flashcards and solutions</label>
      {focus ? <button className={button} onClick={()=>{setFocus(null);void load(null,null);}}>Show full catalog</button> : null}
      <KnowledgeGraph resources={page?.resources||[]} relationships={page?.relationships||[]} onSelect={inspect} />
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="text-left font-semibold">Accessible resource table</caption><thead><tr><th>Resource</th><th>Type</th><th>Status</th><th>Visibility</th></tr></thead><tbody>{page?.resources.map(r=><tr key={r.id} className="border-b border-[#d5e2e8]"><td><button className="min-h-11 text-left text-[#006762] underline" onClick={()=>inspect(r)}>{r.title}</button></td><td>{r.kind}</td><td>{r.status}</td><td>{r.visibility}</td></tr>)}</tbody></table></div>
      {page?.next ? <button className={button} disabled={busy} onClick={()=>void load(page.next)}>Load more resources</button> : null}
      {selected ? <section className="grid gap-3 border-t border-[#7d8b94] pt-5"><h2 className="text-xl font-semibold">{selected.title}</h2><p className="break-all text-xs">{selected.id} · {selected.sourcePath} · {selected.hash.slice(0,12)}</p><p className="whitespace-pre-wrap text-sm">{selected.text}</p><button className={button} onClick={()=>{setFocus(selected.id);void load(null,selected.id);}}><Network size={16}/>Expand relationships</button>{page?.relationships.filter(e=>[e.source,e.target].includes(selected.id)).map(e=><p key={e.id} className="break-all text-sm">{e.source} → {e.type} → {e.target} · {e.provenance}</p>)}</section> : null}
      <section className="grid gap-3 border-t border-[#7d8b94] pt-5"><h2 className="text-xl font-semibold">Evaluate new content</h2><p>Local models compare existing resources and recommend placement. Content remains unchanged.</p><label>Candidate title<input className={input} value={title} onChange={e=>{setTitle(e.target.value);setKey(null);}}/></label><Dropdown label="Candidate type" value={kind} options={["document","exercise","interview-question","post","path"].map(value=>({value,label:value}))} onValueChange={v=>{setKind(v);setKey(null);}}/><label>Candidate content<textarea className={input} rows={8} value={body} onChange={e=>{setBody(e.target.value);setKey(null);}}/></label><button className={button} disabled={busy||!title.trim()||body.trim().length<10} onClick={()=>void submit()}>Evaluate locally</button></section>
      {job ? <KnowledgeReport job={job} onReview={decision=>{const version=jobVersion.current;void api.review(job,decision).then(()=>api.job(job.id)).then(result=>{if(alive.current&&version===jobVersion.current)setJob(result);}).catch(e=>{if(alive.current&&version===jobVersion.current)setError(e.message);});}}/> : null}
      <section><h2 className="text-xl font-semibold">Recent evaluations</h2>{recent.length?recent.map(j=><button key={j.id} className={`${button} m-1 max-w-full break-all`} onClick={()=>{void openJob(j.id);}}>{j.candidate?.title||j.id} · {j.status}</button>):<p>No saved evaluations yet.</p>}</section>
    </>}
  </main>;
}
