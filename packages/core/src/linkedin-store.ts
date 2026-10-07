import type { EditorialClient, EditorialSnapshot, LinkedInPost, ManualPost, ReviewAction } from "./linkedin";

export type EditorialState = { phase: "loading" | "unavailable" | "denied" | "ready"; data: EditorialSnapshot | null; busy: boolean; editing: boolean; error: string | null };
export function createEditorialStore(client: EditorialClient | null) {
  let state: EditorialState = { phase: client ? "loading" : "unavailable", data: null, busy: false, editing: false, error: null };
  let refreshVersion = 0;
  let selectedPostId: string | null = null;
  let detailVersion = 0;
  // Retry identity only; authorization always comes from the authenticated RPC.
  const newRequestKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  let requestKey = newRequestKey();
  const listeners = new Set<() => void>();
  function update(change: Partial<EditorialState>) { state = { ...state, ...change }; listeners.forEach((listener) => listener()); }
  async function selectPost(id: string | null, force = false) {
    const changed = selectedPostId !== id;
    selectedPostId = id;
    const version = ++detailVersion;
    const refresh = refreshVersion;
    if (!id || !client?.detail || state.editing || (!changed && !force && state.data?.revisions.some((r) => r.post_id === id))) return;
    try {
      const detail = await client.detail(id);
      if (version !== detailVersion || refresh !== refreshVersion || state.editing || !state.data) return;
      update({ data: { ...state.data, revisions: detail.revisions, preparations: detail.preparations ?? [], jobs: [...state.data.jobs.filter((j) => j.post_id !== id), ...detail.jobs] }, error: null });
    } catch (error) { if (version === detailVersion) update({ error: error instanceof Error ? error.message : "Unable to load this post" }); }
  }
  async function refresh() {
    if (!client || state.editing) return;
    const version = ++refreshVersion;
    try {
      const admin = await client.isAdmin();
      const data = admin ? await (client.overview ? client.overview() : client.snapshot()) : null;
      if (version === refreshVersion) {
        const changed = data?.version !== state.data?.version;
        const retained = client.overview && data && state.data ? { ...data, revisions: state.data.revisions, preparations: state.data.preparations, jobs: changed ? data.jobs : state.data.jobs } : data;
        update({ phase: admin ? "ready" : "denied", data: retained, error: null });
        if (changed && selectedPostId) await selectPost(selectedPostId, true);
      }
    } catch (error) {
      if (version === refreshVersion) update({ phase: "denied", data: null, error: error instanceof Error ? error.message : "Unable to load the editorial collection" });
    }
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh,
    selectPost,
    setEditing: (editing: boolean) => { if (editing) { refreshVersion++; detailVersion++; } update({ editing }); },
    startCreate: () => { requestKey = newRequestKey(); refreshVersion++; update({ editing: true, error: null }); },
    async create(input: ManualPost) {
      if (!client || state.busy || state.phase !== "ready") return null;
      update({ busy: true, error: null });
      try {
        const id = await client.create(requestKey, input);
        requestKey = newRequestKey();
        update({ editing: false });
        await refresh();
        await selectPost(id, true);
        return id;
      } catch (error) {
        update({ error: error instanceof Error ? error.message : "The post could not be created" });
        return null;
      } finally { update({ busy: false }); }
    },
    async preparationAction(post: LinkedInPost, reportId: string, action: "follow_up" | "send_with_flags", reason: string) {
      if (!client?.preparationAction || state.busy || state.editing || state.phase !== "ready") return;
      update({ busy: true, error: null });
      try { await client.preparationAction(post.id, post.current_revision_id, reportId, action, reason); await refresh(); }
      catch (error) { update({ error: error instanceof Error ? error.message : "Unable to send the prepared draft" }); }
      finally { update({ busy: false }); }
    },
    async setVoice(rules: string[]) {
      if (!client?.setVoice || state.busy || state.phase !== "ready") return;
      update({ busy: true, error: null });
      try { await client.setVoice(rules); update({ editing: false }); await refresh(); }
      catch (error) { update({ error: error instanceof Error ? error.message : "Unable to save voice rules" }); }
      finally { update({ busy: false }); }
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
