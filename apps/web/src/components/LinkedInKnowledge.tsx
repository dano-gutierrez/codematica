"use client";
import Link from "next/link";
import { Network } from "lucide-react";
import { Button } from "./Button";
import { useEffect, useMemo, useState } from "react";
import { createKnowledgeClient, type KnowledgeClient, type KnowledgeJob } from "@codematica/core/knowledge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { KnowledgeReport } from "./KnowledgeReport";
export function LinkedInKnowledge({ postId, revisionId, title, body, disabled, client }: { postId: string; revisionId: string; title: string; body: string; disabled: boolean; client?: KnowledgeClient | null }) {
  const api = useMemo(()=>{const db=client===undefined?createBrowserSupabaseClient():null;return client===undefined?db&&createKnowledgeClient(db):client;},[client]);
  const [job,setJob]=useState<KnowledgeJob|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[key,setKey]=useState<string|null>(null);
  useEffect(()=>{let active=true;if(api)void api.forPost(postId,revisionId).then(r=>{if(active)setJob(r);}).catch(()=>{if(active)setError("Knowledge integration is not available in this deployment yet.");});return()=>{active=false;};},[api,postId,revisionId]);
  useEffect(()=>{if(!api||!job||!["pending","running"].includes(job.status))return;let active=true;const timer=setInterval(()=>{void api.job(job.id).then(r=>{if(active)setJob(r);}).catch(()=>{});},15000);return()=>{active=false;clearInterval(timer);};},[api,job]);
  const submit=async()=>{if(!api)return;setBusy(true);setError("");const idempotency=key||crypto.randomUUID();setKey(idempotency);try{const id=await api.submit({title,body,kind:"post",existingId:"post:"+postId,revisionId},idempotency);setJob(await api.job(id));}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <section className="grid gap-3 border-t border-[#7d8b94] pt-4" data-testid="linkedin-knowledge"><h3 className="font-semibold">Knowledge context</h3><Link href="/admin/knowledge" className="text-[#006762] underline">Explore lessons, skills and relationships</Link>{error?<p className="text-sm">{error}</p>:null}{api?<Button label="Check knowledge locally" icon={Network} disabled={disabled||busy||job?.status==="pending"||job?.status==="running"} onClick={()=>void submit()} />:<p className="text-sm">Configure Supabase to queue local knowledge checks.</p>}{disabled?<p className="text-sm">Save the current revision before checking knowledge.</p>:null}{job?<KnowledgeReport job={job}/>:null}</section>;
}
