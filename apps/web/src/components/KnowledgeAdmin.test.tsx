import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KnowledgeAdmin } from "./KnowledgeAdmin";
import type { KnowledgeClient, KnowledgePage } from "@codematica/core/knowledge";
vi.mock("./KnowledgeGraph", () => ({ KnowledgeGraph: () => <div>Graph canvas</div> }));
import { knowledgeReport } from "../../../../packages/core/src/test/knowledge-fixture";
vi.mock("./Dropdown", () => ({ Dropdown: ({label,value,options,onValueChange}: {label:string;value:string;options:{value:string;label:string}[];onValueChange:(v:string)=>void}) => <label>{label}<select value={value} onChange={e=>onValueChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label> }));
afterEach(()=>vi.useRealTimers());
const page: KnowledgePage = { snapshot: { id: "a".repeat(64), counts: { document: 1 }, semantic_complete: false }, resources: [{ id: "document:indexes", kind: "document", title: "Database indexes", text: "Indexes trade writes for read speed", sourcePath: "content/knowledge/indexes.md", hash: "b".repeat(64), visibility: "curriculum", paths: [], skills: [], tags: [], status: "published" }], relationships: [], next: null, worker: null };
function api() { return { isAdmin: vi.fn().mockResolvedValue(true), browse: vi.fn().mockResolvedValue(page), submit: vi.fn().mockResolvedValue("job1"), job: vi.fn().mockResolvedValue({ id: "job1", status: "pending" }), review: vi.fn().mockResolvedValue(null), forPost: vi.fn(), recent: vi.fn().mockResolvedValue([]) } as unknown as KnowledgeClient; }
describe("knowledge explorer", () => {
  it("does not query private resources when access is denied", async () => {
    const client = api(); vi.mocked(client.isAdmin).mockResolvedValue(false);
    render(<KnowledgeAdmin client={client} />);
    expect(await screen.findByText("Admin access required")).toBeInTheDocument();
    expect(client.browse).not.toHaveBeenCalled();
  });
  it("offers accessible inventory, evidence, and queued local evaluation", async () => {
    const client = api(); render(<KnowledgeAdmin client={client} />);
    fireEvent.click(await screen.findByRole("button", { name: "Database indexes" }));
    expect(screen.getByText("Indexes trade writes for read speed")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Candidate title"), { target: { value: "Index write overhead" } });
    fireEvent.change(screen.getByLabelText("Candidate content"), { target: { value: "An index adds work to every update." } });
    fireEvent.click(screen.getByRole("button", { name: "Evaluate locally" }));
    await waitFor(() => expect(client.submit).toHaveBeenCalledWith(expect.objectContaining({ title: "Index write overhead", kind: "document" }), expect.any(String)));
    expect(await screen.findByText(/Waiting for the local worker/)).toBeInTheDocument();
  });
  it("shows a disabled optional integration without Supabase", () => {
    render(<KnowledgeAdmin client={null} />);
    expect(screen.getByText(/Configure Supabase/)).toBeInTheDocument();
  });
});

it("loads filtered pages and expands a resource neighborhood without hiding the table", async () => {
  const client=api();vi.mocked(client.browse).mockResolvedValueOnce({...page,next:"cursor"}).mockResolvedValueOnce({...page,resources:[]});
  render(<KnowledgeAdmin client={client}/>);await screen.findByRole("button",{name:"Database indexes"});
  fireEvent.change(screen.getByLabelText("Search knowledge"),{target:{value:"indexes"}});
  fireEvent.change(screen.getByLabelText("Resource type"),{target:{value:"document"}});
  fireEvent.change(screen.getByLabelText("Visibility"),{target:{value:"curriculum"}});
  fireEvent.change(screen.getByLabelText("Relationship provenance"),{target:{value:"explicit"}});
  fireEvent.change(screen.getByLabelText("Status"),{target:{value:"published"}});
  fireEvent.change(screen.getByLabelText("Path ID"),{target:{value:"path:database"}});
  fireEvent.change(screen.getByLabelText("Skill ID"),{target:{value:"skill:database"}});
  fireEvent.click(screen.getByLabelText("Show sections, flashcards and solutions"));
  fireEvent.click(screen.getByRole("button",{name:"Load more resources"}));
  await waitFor(()=>expect(client.browse).toHaveBeenLastCalledWith("indexes",expect.objectContaining({kind:"document",path:"path:database",skill:"skill:database",detail:"show",visibility:"curriculum",provenance:"explicit",status:"published"}),"cursor",null));
  fireEvent.click(screen.getByRole("button",{name:"Database indexes"}));fireEvent.click(screen.getByRole("button",{name:"Expand relationships"}));
  await waitFor(()=>expect(client.browse).toHaveBeenLastCalledWith("indexes",expect.anything(),null,"document:indexes"));
  fireEvent.click(screen.getByRole("button",{name:"Show full catalog"}));
  await waitFor(()=>expect(client.browse).toHaveBeenLastCalledWith("indexes",expect.anything(),null,null));
  expect(screen.getByRole("table")).toBeInTheDocument();
});
it("preserves candidate text and idempotency when submission fails, then retrieves the saved report",async()=>{
  const client=api();vi.mocked(client.submit).mockRejectedValueOnce(new Error("Worker queue unavailable"));vi.mocked(client.job).mockResolvedValue({id:"job1",status:"succeeded",report:knowledgeReport});
  render(<KnowledgeAdmin client={client}/>);await screen.findByRole("button",{name:"Database indexes"});
  fireEvent.change(screen.getByLabelText("Candidate title"),{target:{value:"Index costs"}});fireEvent.change(screen.getByLabelText("Candidate type"),{target:{value:"post"}});fireEvent.change(screen.getByLabelText("Candidate content"),{target:{value:"Indexes improve reads at the cost of writes."}});
  fireEvent.click(screen.getByRole("button",{name:"Evaluate locally"}));expect(await screen.findByRole("alert")).toHaveTextContent("Worker queue unavailable");expect(screen.getByLabelText("Candidate content")).toHaveValue("Indexes improve reads at the cost of writes.");
  fireEvent.click(screen.getByRole("button",{name:"Evaluate locally"}));await screen.findByTestId("knowledge-report");
  expect(vi.mocked(client.submit).mock.calls[1]).toEqual(vi.mocked(client.submit).mock.calls[0]);
  vi.mocked(client.review).mockRejectedValueOnce(new Error("Stale knowledge review"));fireEvent.click(screen.getByRole("button",{name:"Accept proposal"}));expect(await screen.findByRole("alert")).toHaveTextContent("Stale knowledge review");
  vi.mocked(client.job).mockResolvedValue({id:"job1",status:"succeeded",report:knowledgeReport,reviewed:"reject"});fireEvent.click(screen.getByRole("button",{name:"Reject proposal"}));expect(await screen.findByText(/Proposal rejected/)).toBeInTheDocument();
});
it("recovers a failed refresh and opens saved evaluations while the worker is offline",async()=>{
  const client=api();vi.mocked(client.recent).mockResolvedValue([{id:"saved",status:"succeeded",candidate:{title:"Prior candidate",kind:"post",body:"Private saved body"}}]);vi.mocked(client.job).mockResolvedValue({id:"saved",status:"succeeded",report:knowledgeReport});
  render(<KnowledgeAdmin client={client}/>);await screen.findByRole("button",{name:"Database indexes"});
  vi.mocked(client.browse).mockRejectedValueOnce(new Error("Network disconnected"));fireEvent.click(screen.getByRole("button",{name:"Search"}));expect(await screen.findByRole("alert")).toHaveTextContent("Network disconnected");
  fireEvent.click(screen.getByRole("button",{name:"Refresh"}));await waitFor(()=>expect(screen.queryByRole("alert")).toBeNull());
  fireEvent.click(await screen.findByRole("button",{name:"Prior candidate · succeeded"}));await screen.findByTestId("knowledge-report");expect(client.job).toHaveBeenCalledWith("saved");
});
it("polls a pending job and displays completed evidence without resubmitting",async()=>{
  const client=api();render(<KnowledgeAdmin client={client}/>);await screen.findByRole("button",{name:"Database indexes"});
  fireEvent.change(screen.getByLabelText("Candidate title"),{target:{value:"Indexes"}});fireEvent.change(screen.getByLabelText("Candidate content"),{target:{value:"More distinct material on indexes."}});
  vi.useFakeTimers();await act(async()=>{fireEvent.click(screen.getByRole("button",{name:"Evaluate locally"}));});expect(screen.getByText(/Waiting for the local worker/)).toBeInTheDocument();
  vi.mocked(client.job).mockResolvedValue({id:"job1",status:"succeeded",report:knowledgeReport});await act(async()=>{await vi.advanceTimersByTimeAsync(15000);});
  expect(screen.getByTestId("knowledge-report")).toBeInTheDocument();expect(client.submit).toHaveBeenCalledTimes(1);
});
it("does not replace a newer selection with an earlier delayed report",async()=>{
 const client=api();let finish!:(value:unknown)=>void;
 vi.mocked(client.recent).mockResolvedValue([{id:"one",status:"succeeded",candidate:{title:"First",body:"First candidate",kind:"post"}},{id:"two",status:"succeeded",candidate:{title:"Second",body:"Second candidate",kind:"post"}}]);
 vi.mocked(client.job).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve as typeof finish;})).mockResolvedValueOnce({id:"two",status:"succeeded",report:{...knowledgeReport,explanation:"Second selected report"}});
 render(<KnowledgeAdmin client={client}/>);fireEvent.click(await screen.findByRole("button",{name:"First · succeeded"}));fireEvent.click(screen.getByRole("button",{name:"Second · succeeded"}));await screen.findByText("Second selected report");
 await act(async()=>{finish({id:"one",status:"succeeded",report:{...knowledgeReport,explanation:"Old delayed report"}});});
 expect(screen.getByText("Second selected report")).toBeInTheDocument();expect(screen.queryByText("Old delayed report")).toBeNull();
});
it("clears private resources and candidates when the account changes",async()=>{
 const client=api();let changed!:()=>void;
 client.onAccessChange=(listener)=>{changed=listener;return ()=>{};};
 render(<KnowledgeAdmin client={client}/>);await screen.findByRole("button",{name:"Database indexes"});
 fireEvent.change(screen.getByLabelText("Candidate title"),{target:{value:"Private candidate"}});
 vi.mocked(client.isAdmin).mockResolvedValue(false);
 await act(async()=>{changed();});
 expect(await screen.findByText("Admin access required")).toBeInTheDocument();
 expect(screen.queryByText("Database indexes")).toBeNull();expect(screen.queryByDisplayValue("Private candidate")).toBeNull();
});
