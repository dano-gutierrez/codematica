import {createClient} from '@supabase/supabase-js';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {briefSchema,interviewSnapshotSchema,exportBrief} from '../../packages/core/src/interview-preparation';
import {finalizeBrief} from './workflow';
async function json(path:string){return JSON.parse(await readFile(path,'utf8')) as unknown;}
async function privateFile(path:string,value:unknown){await mkdir(dirname(path),{recursive:true,mode:0o700});await writeFile(path,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});console.log(path);}
async function main(){
 const [command,...args]=process.argv.slice(2);const root=resolve(import.meta.dirname,'../..');const directory=resolve(root,'.local/interview-preparation');
 if(command==='finalize'){
  const skill=await readFile(resolve(root,'.agents/skills/technical-edit/SKILL.md'),'utf8');
  const result=finalizeBrief(await json(args[0]),await json(args[1]),skill,args.includes('--compared'));
  await privateFile(resolve(args[2]),result);return;
 }
 if(command==='validate'){briefSchema.parse(await json(args[0]));console.log('Preparation package is valid');return;}
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Configure local SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 async function rpc(name:string,input:Record<string,unknown>={}){const {data,error}=await db.rpc(name,input);if(error)throw new Error(error.message);return data as unknown;}
 const snapshot=async()=>interviewSnapshotSchema.parse(await rpc('interview_snapshot'));
 if(command==='context'){
  const data=await snapshot();const opportunity=data.opportunities.find(o=>o.id===args[0]);if(!opportunity)throw new Error('Unknown opportunity');
  await privateFile(resolve(args[1]??`${directory}/context-${opportunity.id}-${Date.now()}.json`),{opportunity,profile:data.profile,previousBrief:data.revisions.find(r=>r.brief.opportunityId===opportunity.id)??null});
 }else if(command==='status'){
  const data=await snapshot();console.log(JSON.stringify({profileVersion:data.profile.version,opportunities:data.opportunities.map(o=>({id:o.id,company:o.company,position:o.position,status:o.status,version:o.version})),briefs:data.revisions.length},null,2));
 }else if(command==='import'){
  const brief=briefSchema.parse(await json(args[0]));const {digest}=await import('./workflow');
  const {fingerprint}=await import('../knowledge/fingerprint');
  if(brief.editing.editedHash!==fingerprint(brief.sections))throw new Error('Edited prose changed after technical-edit finalization');
  const id=await rpc('interview_import',{p_brief:brief,p_key:args[1]??digest(brief)});console.log(JSON.stringify({revisionId:id}));
 }else if(command==='assess'){
  const brief=briefSchema.parse(await json(args[0]));const id=await rpc('interview_assess',{p_brief:brief,p_key:args[1]??randomUUID()});console.log(JSON.stringify({jobId:id,message:'Run the existing local knowledge worker, then review its report in Admin → Knowledge.'}));
 }else if(command==='export'){
  const data=await snapshot();const revision=data.revisions.find(r=>r.id===args[0]||r.brief.opportunityId===args[0]);if(!revision)throw new Error('Unknown preparation');const opportunity=data.opportunities.find(o=>o.id===revision.brief.opportunityId)!;
  await privateFile(resolve(args[1]??`${directory}/exports/${revision.id}.md`),exportBrief(`${revision.context?.company??opportunity.company} — ${revision.context?.position??opportunity.position}`,revision.brief));
 }else if(command==='backup'){await privateFile(resolve(args[0]??`${directory}/backups/${Date.now()}.json`),await snapshot());}
 else throw new Error('Commands: status, context OPPORTUNITY [FILE], finalize DRAFT EDITED OUTPUT --compared, validate FILE, import FILE [KEY], assess FILE [UUID], export OPPORTUNITY_OR_REVISION [FILE], backup [FILE]');
}
main().catch((error:unknown)=>{console.error(error instanceof Error?error.message:'Interview command failed');process.exitCode=1;});
