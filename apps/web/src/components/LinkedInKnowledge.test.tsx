import { fireEvent,render,screen,waitFor } from "@testing-library/react";
import { describe,expect,it,vi } from "vitest";
import { LinkedInKnowledge } from "./LinkedInKnowledge";
import type { KnowledgeClient } from "@codematica/core/knowledge";
import { knowledgeJob } from "../../../../packages/core/src/test/knowledge-fixture";
const props={postId:"p",revisionId:"r",title:"Budget retries",body:"A bounded retry policy.",disabled:false};
function api(){return {forPost:vi.fn().mockResolvedValue(null),submit:vi.fn().mockResolvedValue("j"),job:vi.fn().mockResolvedValue(knowledgeJob)} as unknown as KnowledgeClient;}
describe("LinkedIn knowledge context",()=>{
 it("requires saving before submitting and binds exact revision",async()=>{const client=api();const {rerender}=render(<LinkedInKnowledge {...props} disabled client={client}/>);expect(screen.getByRole("button")).toBeDisabled();rerender(<LinkedInKnowledge {...props} client={client}/>);fireEvent.click(screen.getByRole("button"));expect(await screen.findByTestId("knowledge-report")).toBeInTheDocument();expect(client.submit).toHaveBeenCalledWith({title:props.title,body:props.body,kind:"post",existingId:"post:p",revisionId:"r"},expect.any(String));});
 it("handles missing configuration and deployment",async()=>{const {unmount}=render(<LinkedInKnowledge {...props} client={null}/>);expect(screen.getByText(/Configure Supabase/)).toBeInTheDocument();unmount();const client=api();vi.mocked(client.forPost).mockRejectedValue(new Error("RPC absent"));render(<LinkedInKnowledge {...props} client={client}/>);expect(await screen.findByText(/not available/)).toBeInTheDocument();});
 it("preserves errors and recovers with the same idempotency key",async()=>{const client=api();vi.mocked(client.submit).mockRejectedValueOnce(new Error("Offline"));render(<LinkedInKnowledge {...props} client={client}/>);await waitFor(()=>expect(client.forPost).toHaveBeenCalled());fireEvent.click(screen.getByRole("button"));expect(await screen.findByText("Offline")).toBeInTheDocument();fireEvent.click(screen.getByRole("button"));await waitFor(()=>expect(client.submit).toHaveBeenCalledTimes(2));expect(vi.mocked(client.submit).mock.calls[0][1]).toEqual(vi.mocked(client.submit).mock.calls[1][1]);});
});
