import type { EditorialClient, EditorialSnapshot, LinkedInPost, ManualPost, ReviewAction } from "./linkedin";

export type EditorialState = { phase: "loading" | "unavailable" | "denied" | "ready"; data: EditorialSnapshot | null; busy: boolean; editing: boolean; error: string | null };
export function createEditorialStore(client: EditorialClient | null) {
  let state: EditorialState = { phase: client ? "loading" : "unavailable", data: null, busy: false, editing: false, error: null };
  let refreshVersion = 0;
  // Retry identity only; authorization always comes from the authenticated RPC.
  const newRequestKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  let requestKey = newRequestKey();
  const listeners = new Set<() => void>();
  function update(change: Partial<EditorialState>) { state = { ...state, ...change }; listeners.forEach((listener) => listener()); }
  async function refresh() {
    if (!client || state.editing) return;
    const version = ++refreshVersion;
    try {
      const admin = await client.isAdmin();
      const data = admin ? await client.snapshot() : null;
      if (version === refreshVersion) update({ phase: admin ? "ready" : "denied", data, error: null });
    } catch (error) {
      if (version === refreshVersion) update({ phase: "denied", data: null, error: error instanceof Error ? error.message : "Unable to load the editorial collection" });
    }
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh,
    setEditing: (editing: boolean) => { if (editing) refreshVersion++; update({ editing }); },
    startCreate: () => { requestKey = newRequestKey(); refreshVersion++; update({ editing: true, error: null }); },
    async create(input: ManualPost) {
      if (!client || state.busy || state.phase !== "ready") return null;
      update({ busy: true, error: null });
      try {
        const id = await client.create(requestKey, input);
        requestKey = newRequestKey();
        update({ editing: false });
        await refresh();
        return id;
      } catch (error) {
        update({ error: error instanceof Error ? error.message : "The post could not be created" });
        return null;
      } finally { update({ busy: false }); }
    },
    async act(post: LinkedInPost, action: ReviewAction, fields?: Parameters<EditorialClient["review"]>[3]) {
      if (!client || state.busy || state.phase !== "ready") return;
      update({ busy: true, error: null });
      try {
        await client.review(post.id, post.current_revision_id, action, fields);
        update({ editing: false });
        await refresh();
      } catch (error) { update({ error: error instanceof Error ? error.message : "The action could not be completed" }); }
      finally { update({ busy: false }); }
    },
  };
}
export type EditorialStore = ReturnType<typeof createEditorialStore>;
