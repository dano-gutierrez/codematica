import { render,screen,waitFor } from "@testing-library/react";
import { describe,expect,it,vi } from "vitest";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { knowledgePage } from "../../../../packages/core/src/test/knowledge-fixture";
const { create,destroy,on }=vi.hoisted(()=>({create:vi.fn(),destroy:vi.fn(),on:vi.fn()}));
vi.mock("cytoscape",()=>({default:create}));
describe("graph projection",()=>{
  it("renders bounded valid references, selects resources and disposes",async()=>{
    create.mockReturnValue({destroy,on});const select=vi.fn();
    const {unmount}=render(<KnowledgeGraph resources={[...knowledgePage.resources,{...knowledgePage.resources[0],id:"concept:a",kind:"concept"},{...knowledgePage.resources[0],id:"post:p",kind:"post",visibility:"private"}]} relationships={[{id:"bad",source:"missing",target:"document:indexes",type:"related",provenance:"inferred",evidence:[]}]} onSelect={select}/>);
    await waitFor(()=>expect(create).toHaveBeenCalled());expect(screen.getByRole("img")).toBeInTheDocument();
    expect(create.mock.calls.at(-1)![0].elements).toHaveLength(3);
    const tap=on.mock.calls.at(-1)![2];tap({target:{id:()=>"document:indexes"}});tap({target:{id:()=>"missing"}});expect(select).toHaveBeenCalledWith(knowledgePage.resources[0]);unmount();expect(destroy).toHaveBeenCalled();
  });
  it("offers an accessible fallback when rendering fails",async()=>{create.mockImplementationOnce(()=>{throw new Error("Canvas unavailable");});render(<KnowledgeGraph resources={[]} relationships={[]} onSelect={vi.fn()}/>);expect(await screen.findByRole("status")).toHaveTextContent("Use the resource table");});
});
