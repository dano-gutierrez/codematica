import type { InterviewBrief, InterviewClient, InterviewSnapshot, OpportunityInput, CandidateProfile } from "./interview-preparation";
type State = { phase: "loading" | "unavailable" | "denied" | "ready"; data: InterviewSnapshot | null; busy: boolean; editing: boolean; error: string | null };
export function createInterviewStore(client: InterviewClient | null) {
  let state: State = { phase: client ? "loading" : "unavailable", data: null, busy: false, editing: false, error: null };
  const requestKey=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  let epoch=0, read=0, key=requestKey(), previousPayload="";
  function operationKey(payload:unknown){const serialized=JSON.stringify(payload);if(previousPayload && previousPayload!==serialized)key=requestKey();previousPayload=serialized;return key;}
  const listeners=new Set<()=>void>();
  const update=(patch: Partial<State>) => { state={...state,...patch}; listeners.forEach(l=>l()); };
  async function refresh() {
    if(!client || state.editing) return;
    const generation=epoch, version=++read;
    try {
      const admin=await client.isAdmin(); const data=admin ? await client.snapshot() : null;
      if(generation===epoch && version===read && !state.editing) update({phase:admin?"ready":"denied",data,error:null});
    } catch(error) { if(generation===epoch && version===read) update({phase:"denied",data:null,error:error instanceof Error?error.message:"Unable to load interviews"}); }
  }
  async function mutate<T>(action:()=>Promise<T>) {
    if(!client || state.busy || state.phase!=="ready") return null;
    const generation=epoch; update({busy:true,error:null});
    try { const result=await action(); if(generation!==epoch) return null; key=requestKey(); previousPayload=""; update({editing:false}); await refresh(); return result; }
    catch(error) { if(generation===epoch) update({error:error instanceof Error?error.message:"Unable to save"}); return null; }
    finally { if(generation===epoch) update({busy:false}); }
  }
  return {
    getSnapshot:()=>state,
    subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
    refresh,
    startEditing:()=>{ key=requestKey(); previousPayload=""; ++read; update({editing:true,error:null}); },
    discard:()=>{ ++read; update({editing:false,error:null}); },
    resetAccess:()=>{ ++epoch; ++read; key=requestKey(); update({phase:client?"loading":"unavailable",data:null,busy:false,editing:false,error:null}); },
    save:(input:OpportunityInput,id:string|null,version:number)=>mutate(()=>client!.save(input,id,version,operationKey(["save",input,id,version]))),
    saveProfile:(profile:Omit<CandidateProfile,"version">,version:number)=>mutate(async()=>{await client!.saveProfile(profile,version);return true;}),
    importBrief:(brief:InterviewBrief)=>mutate(()=>client!.importBrief(brief,operationKey(["import",brief]))),
  };
}
export type InterviewStore=ReturnType<typeof createInterviewStore>;
