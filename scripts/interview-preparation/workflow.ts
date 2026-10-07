import {fingerprint} from '../knowledge/fingerprint';
import {createHash} from 'node:crypto';
import {briefSchema, sectionLabels, validateEditing, type InterviewBrief, type InterviewSnapshot, type Opportunity} from '../../packages/core/src/interview-preparation';
import type {KnowledgeResource} from '../../packages/core/src/knowledge';
export const digest=(value:unknown)=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
export function briefBody(brief:InterviewBrief){return Object.keys(sectionLabels).map(key=>brief.sections[key as keyof typeof sectionLabels]).join('\n\n');}
export function finalizeBrief(draft:unknown,edited:unknown,skillSource:string,compared:boolean){
 if(!skillSource.includes('name: technical-edit'))throw new Error('The technical-edit skill source is required');
 if(!compared)throw new Error('Explicit full-source comparison is required');
 const provisional={skill:'technical-edit',skillHash:digest(skillSource),draftHash:'a'.repeat(64),editedHash:'a'.repeat(64),compared:true};
 const before=briefSchema.parse({...draft as object,editing:provisional});const after=briefSchema.parse({...edited as object,editing:provisional});
 const metadata=(b:InterviewBrief)=>{const {sections: _sections, editing: _editing,...rest}=b;void _sections;void _editing;return rest;};
 if(JSON.stringify(metadata(before))!==JSON.stringify(metadata(after)))throw new Error('Technical editing must preserve structured metadata and sources');
 for(const key of Object.keys(sectionLabels) as (keyof typeof sectionLabels)[])validateEditing(before.sections[key],after.sections[key]);
 return briefSchema.parse({...after,editing:{...provisional,draftHash:fingerprint(before.sections),editedHash:fingerprint(after.sections)}});
}
export function candidateForBrief(opportunity:Opportunity,brief:InterviewBrief){return {title:`${opportunity.company} — ${opportunity.position}`,body:briefBody(brief),kind:'interview-preparation' as const,existingId:`interview-preparation:${opportunity.id}`,audience:'Private candidate preparation'};}
export function privateInterviewResources(snapshot:InterviewSnapshot):KnowledgeResource[]{
 return snapshot.revisions.map(revision=>{
  const opportunity=snapshot.opportunities.find(o=>o.id===revision.brief.opportunityId);if(!opportunity)throw new Error('Missing opportunity for preparation revision');
  const latest=snapshot.revisions.find(r=>r.brief.opportunityId===opportunity.id)?.id===revision.id;
  const body=briefBody(revision.brief);
  return {id:`interview-preparation:${opportunity.id}${latest?'':`@revision:${revision.id}`}`,kind:'interview-preparation',revisionId:revision.id,title:`${opportunity.company} — ${opportunity.position}`,text:body,hash:digest([body,revision.id,revision.brief.editing,opportunity.version,snapshot.profile.version]),sourcePath:`private/interview-preparation/${opportunity.id}/${revision.id}`,route:'/admin/interview-preparation',visibility:'private',status:opportunity.status,paths:[],skills:[],tags:[]};
 });
}
