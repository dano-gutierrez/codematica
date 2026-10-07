import {describe,expect,it} from 'vitest';
import {finalizeBrief, candidateForBrief, privateInterviewResources} from './workflow';
import {sampleBrief} from '../../packages/core/src/test/interview-preparation-fixture';
const opportunity={id:sampleBrief.opportunityId,companyId:sampleBrief.opportunityId,version:1,updatedAt:'2026-10-03',company:'Example',position:'Engineer',website:'',jobUrl:'',jobDescription:'',notes:'',outcome:'',status:'potential' as const,rounds:[]};
describe('interview workflow',()=>{
 it('requires the actual skill source and explicit full comparison before finalization',()=>{
  expect(()=>finalizeBrief(sampleBrief,sampleBrief,'',true)).toThrow(/technical-edit/);
  expect(()=>finalizeBrief(sampleBrief,sampleBrief,'name: technical-edit',false)).toThrow(/comparison/);
  const result=finalizeBrief(sampleBrief,sampleBrief,'name: technical-edit',true);
  expect(result.editing.skillHash).toMatch(/^[a-f0-9]{64}$/);
  expect(result.editing.editedHash).toBe(result.editing.draftHash);
 });
 it('preserves metadata and validates protected facts per section',()=>{
  expect(()=>finalizeBrief(sampleBrief,{...sampleBrief,sources:[]},'name: technical-edit',true)).toThrow();
  const draft={...sampleBrief,sections:{...sampleBrief.sections,fit:'My supplied story used `max=3` at 48 ms.'}};
  expect(()=>finalizeBrief(draft,{...draft,sections:{...draft.sections,fit:'My supplied story used `max=3` at 49 ms.'}},'name: technical-edit',true)).toThrow();
 });
 it('binds knowledge candidates to the edited complete body and retains private artifact identities',()=>{
  expect(candidateForBrief(opportunity,sampleBrief).existingId).toBe(`interview-preparation:${opportunity.id}`);
  const resources=privateInterviewResources({profile:{version:1,resume:'PRIVATE RESUME',experience:'PRIVATE STORY'},opportunities:[opportunity],revisions:[{id:opportunity.id,createdAt:'2026-10-03',brief:sampleBrief}]});
  expect(resources[0].visibility).toBe('private');
  for (const excluded of ['PRIVATE RESUME','PRIVATE STORY']) expect(resources[0].text).not.toContain(excluded);
  expect(resources[0].revisionId).toBe(opportunity.id);
 });
});
