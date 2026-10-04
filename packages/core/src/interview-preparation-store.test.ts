import { describe, expect, it, vi } from "vitest";
import { createInterviewStore } from "./interview-preparation-store";
import type { InterviewClient } from "./interview-preparation";

const snapshot = { profile: { version: 0, resume: "", experience: "" }, opportunities: [], revisions: [] };
function api() { return { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(snapshot), save: vi.fn().mockResolvedValue("id"), saveProfile: vi.fn().mockResolvedValue(undefined), importBrief: vi.fn().mockResolvedValue("revision"), onAccessChange: vi.fn(() => () => {}) } as unknown as InterviewClient; }
describe("interview store", () => {
  it("handles missing configuration and denied access without reading private records", async () => {
    expect(createInterviewStore(null).getSnapshot().phase).toBe("unavailable");
    const client = api(); vi.mocked(client.isAdmin).mockResolvedValue(false);
    const store = createInterviewStore(client); await store.refresh();
    expect(store.getSnapshot().phase).toBe("denied"); expect(client.snapshot).not.toHaveBeenCalled();
  });
  it("retains editing and retry identity after failed saves", async () => {
    const client = api(); const store = createInterviewStore(client); await store.refresh(); store.startEditing();
    vi.mocked(client.save).mockRejectedValueOnce(new Error("Offline"));
    const input = { company: "Example", position: "Engineer" } as Parameters<InterviewClient["save"]>[0];
    expect(await store.save(input,null,0)).toBeNull(); expect(store.getSnapshot().editing).toBe(true);
    expect(await store.save(input,null,0)).toBe("id");
    expect(vi.mocked(client.save).mock.calls[0][3]).toBe(vi.mocked(client.save).mock.calls[1][3]);
  });
  it("discards in-flight reads and mutation completions after access changes", async () => {
    const client = api(); const store = createInterviewStore(client); await store.refresh();
    let resolve!: (value: typeof snapshot) => void;
    vi.mocked(client.snapshot).mockReturnValueOnce(new Promise(r => { resolve=r; }));
    const pending=store.refresh(); await Promise.resolve(); store.resetAccess(); resolve(snapshot); await pending;
    expect(store.getSnapshot().data).toBeNull();
  });
  it("pauses refresh during edits, supports profile saves and subscriptions", async () => {
    const client=api(); const store=createInterviewStore(client); const listener=vi.fn(); const unsubscribe=store.subscribe(listener);
    await store.refresh(); store.startEditing(); await store.refresh(); expect(client.snapshot).toHaveBeenCalledTimes(1);
    await store.saveProfile({resume:"Resume",experience:"Story"},0); expect(client.saveProfile).toHaveBeenCalled(); expect(store.getSnapshot().editing).toBe(false);
    unsubscribe(); expect(listener).toHaveBeenCalled();
  });
});

describe('interview mutation isolation',()=>{
 it('does not mutate without access or while busy and clears edits on discard',async()=>{
  const absent=createInterviewStore(null);expect(await absent.saveProfile({resume:'',experience:''},0)).toBeNull();await absent.refresh();absent.resetAccess();
  const client=api();const store=createInterviewStore(client);await store.refresh();store.startEditing();store.discard();expect(store.getSnapshot().editing).toBe(false);
  let complete!:(id:string)=>void;vi.mocked(client.save).mockReturnValueOnce(new Promise(resolve=>{complete=resolve;}));
  const pending=store.save({company:'Example',position:'Engineer'} as Parameters<InterviewClient['save']>[0],null,0);
  expect(await store.saveProfile({resume:'',experience:''},0)).toBeNull();store.resetAccess();complete('id');expect(await pending).toBeNull();expect(store.getSnapshot().data).toBeNull();
 });
 it('keeps private data empty on read failure and ignores reads superseded by editing',async()=>{
  const client=api();const store=createInterviewStore(client);vi.mocked(client.isAdmin).mockRejectedValueOnce(new Error('Network'));await store.refresh();expect(store.getSnapshot().error).toBe('Network');
  await store.refresh();let resolve!:(data:typeof snapshot)=>void;vi.mocked(client.snapshot).mockReturnValueOnce(new Promise(r=>{resolve=r;}));const pending=store.refresh();await Promise.resolve();store.startEditing();resolve(snapshot);await pending;expect(store.getSnapshot().editing).toBe(true);
 });
});

it('assigns a fresh retry identity when failed input is corrected',async()=>{
 const client=api();const store=createInterviewStore(client);await store.refresh();store.startEditing();vi.mocked(client.save).mockRejectedValueOnce(new Error('Bad input'));
 const input={company:'Example',position:'Engineer'} as Parameters<InterviewClient['save']>[0];await store.save(input,null,0);await store.save({...input,position:'Senior engineer'},null,0);
 expect(vi.mocked(client.save).mock.calls[0][3]).not.toBe(vi.mocked(client.save).mock.calls[1][3]);
});
