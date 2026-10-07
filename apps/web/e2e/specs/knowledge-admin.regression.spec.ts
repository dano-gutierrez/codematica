import { expect,test } from "@playwright/test";
import { knowledgePage,knowledgeJob } from "../../../../packages/core/src/test/knowledge-fixture";
test.skip(process.env.EDITORIAL_E2E!=="1","Run isolated editorial/knowledge mocks");
test("@regression knowledge explorer reads evidence, queues offline and reviews saved proposals",async({page})=>{
 let job={...knowledgeJob,status:"pending" as string,report:null as unknown},reviewed:string|null=null;
 await page.route("**/rest/v1/rpc/*",async route=>{
  const name=route.request().url().split("/").pop();const args=route.request().postDataJSON();
  if(name==="linkedin_is_admin")return route.fulfill({json:true});
  if(name==="knowledge_browse"){if(args.p_focus)expect(args.p_focus).toBe("document:indexes");return route.fulfill({json:knowledgePage});}
  if(name==="knowledge_jobs_recent")return route.fulfill({json:job.report?[{...knowledgeJob,reviewed}]:[]});
  if(name==="knowledge_submit"){expect(args.p_candidate.kind).toBe("document");return route.fulfill({json:"job1"});}
  if(name==="knowledge_job")return route.fulfill({json:{...job,reviewed}});
  if(name==="knowledge_review"){expect(args.p_hash).toBe(knowledgeJob.report!.candidate_hash);reviewed=args.p_decision;return route.fulfill({json:null});}
  throw new Error(`Unexpected knowledge RPC ${name}`);
 });
 await page.goto("/admin/knowledge");
 await expect(page.getByRole("table")).toBeVisible();
 await page.getByRole("button",{name:"Database indexes",exact:true}).click();
 await expect(page.getByText(knowledgePage.resources[0].text,{exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Expand relationships"}).click();
 await page.getByLabel("Candidate title").fill("Index write overhead");
 await page.getByLabel("Candidate content").fill("A worked example of index write cost.");
 await page.getByRole("button",{name:"Evaluate locally"}).click();
 await expect(page.getByText(/Waiting for the local worker/)).toBeVisible();
 job={...knowledgeJob,status:"succeeded",report:knowledgeJob.report};
 await page.reload();
 await page.getByRole("button",{name:/Index write overhead · succeeded/}).click();
 await expect(page.getByTestId("knowledge-report")).toBeVisible();
 await page.getByRole("button",{name:"Accept proposal"}).click();
 await expect(page.getByText(/Proposal accepted/)).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:test.info().outputPath("knowledge-explorer-mobile.png"),fullPage:true});
});
test("@regression knowledge explorer rejects ordinary users before reading private data",async({page})=>{
 let graphReads=0;
 await page.route("**/rest/v1/rpc/*",route=>{if(!route.request().url().endsWith("linkedin_is_admin"))graphReads++;return route.fulfill({json:false});});
 await page.goto("/admin/knowledge");await expect(page.getByRole("heading",{name:"Admin access required"})).toBeVisible();expect(graphReads).toBe(0);
});
