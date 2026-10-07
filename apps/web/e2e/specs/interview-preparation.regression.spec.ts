import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import {sampleBrief} from '../../../../packages/core/src/test/interview-preparation-fixture';
import {opportunityInputSchema,type InterviewSnapshot} from '../../../../packages/core/src/interview-preparation';
test.skip(process.env.EDITORIAL_E2E!=='1','Run the isolated interview admin lane');
test('@regression @interview-admin creates, imports, reads, studies and exports private interview preparation',async({page})=>{
 const data:InterviewSnapshot={profile:{version:1,resume:'Synthetic resume',experience:'Synthetic story'},opportunities:[],revisions:[]};
 let fail=true;
 await page.route('**/rest/v1/rpc/*',async route=>{
  const name=route.request().url().split('/').pop();const args=route.request().postDataJSON();
  if(name==='linkedin_is_admin')return route.fulfill({json:true});
  if(name==='interview_snapshot')return route.fulfill({json:data});
  if(name==='interview_save'){
   if(fail){fail=false;return route.fulfill({status:500,json:{message:'Temporary save failure'}});}
   data.opportunities=[{...opportunityInputSchema.parse(args.p_input),id:sampleBrief.opportunityId,companyId:sampleBrief.opportunityId,version:1,updatedAt:'2026-10-04T00:00:00Z'}];return route.fulfill({json:sampleBrief.opportunityId});
  }
  if(name==='interview_import'){expect(args.p_brief.editing.skill).toBe('technical-edit');expect(args.p_brief.editing.compared).toBe(true);data.revisions.unshift({id:sampleBrief.opportunityId,createdAt:'2026-10-04T00:00:00Z',brief:args.p_brief});return route.fulfill({json:sampleBrief.opportunityId});}
  throw new Error(`Unexpected interview RPC ${name}`);
 });
 await page.goto('/admin/interview-preparation');
 await expect(page.getByText('No interview opportunities yet.')).toBeVisible();
 await page.getByRole('button',{name:'New opportunity',exact:true}).click();
 await page.getByLabel('Company',{exact:true}).fill('Example');await page.getByLabel('Position',{exact:true}).fill('Engineer');
 await page.getByRole('button',{name:'Add round',exact:true}).click();await page.getByLabel('Interviewer',{exact:true}).fill('Synthetic CTO');
 await page.getByRole('button',{name:'Save opportunity',exact:true}).click();await expect(page.getByText('Temporary save failure',{exact:true})).toBeVisible();await expect(page.getByLabel('Company',{exact:true})).toHaveValue('Example');
 await page.getByRole('button',{name:'Save opportunity',exact:true}).click();await expect(page.getByRole('heading',{name:'Example — Engineer'})).toBeVisible();
 await page.getByRole('button',{name:'Import preparation',exact:true}).click();
 const brief={...sampleBrief,resources:[{resourceId:'path:product-engineering-interview',hash:'a'.repeat(64),title:'Product Engineering Interview',quote:'Practice coding and architecture.',paths:['path:product-engineering-interview'],skills:[],route:'/paths/product-engineering-interview'}]};
 await page.getByLabel('Preparation package').fill(JSON.stringify(brief));await page.getByRole('button',{name:'Import brief',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Questions to ask',exact:true})).toBeVisible();await expect(page.getByText(brief.sections.uncertainty,{exact:true})).toBeVisible();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export Markdown'}).click();const file=await download;expect(await readFile((await file.path())!,'utf8')).toContain(brief.sections.questionsToAsk);
 await expect(page.getByRole('link',{name:'Product Engineering Interview'})).toHaveAttribute('href','/paths/product-engineering-interview');
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:test.info().outputPath('interview-preparation-phone.png'),fullPage:true});
 await page.getByRole('link',{name:'Product Engineering Interview'}).click();await expect(page).toHaveURL(/\/paths\/product-engineering-interview/);
});
test('@regression @interview-admin ordinary users cannot read interview records',async({page})=>{
 let reads=0;await page.route('**/rest/v1/rpc/*',route=>{if(!route.request().url().endsWith('linkedin_is_admin'))reads++;return route.fulfill({json:false});});
 await page.goto('/admin/interview-preparation');await expect(page.getByText(/Admin access required/)).toBeVisible();expect(reads).toBe(0);
});
