import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { canApprove, filterPosts, type EditorialClient, type EditorialSnapshot, type LinkedInPost, type LinkedInRevision, type LinkedInAnalysis } from "@codematica/core/linkedin";
import { createEditorialStore, type EditorialStore } from "@codematica/core/linkedin-store";
import { AppScreen } from "./screens";
import { colors, spacing, radii } from "./tokens";

export function LinkedInAdminScreen({ client, onSignIn }: { client: EditorialClient | null; onSignIn: () => void }) {
  const store = useMemo(() => createEditorialStore(client), [client]);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all"); const [topic, setTopic] = useState("all"); const [publication, setPublication] = useState("all");
  useEffect(() => {
    const refresh = () => { if (AppState.currentState !== "background") void store.refresh(); };
    refresh(); const timer = setInterval(refresh, 15000); const sub = AppState.addEventListener("change", refresh);
    return () => { clearInterval(timer); sub.remove(); };
  }, [store]);
  const data = state.data; const post = data?.posts.find((p) => p.id === selected); const revision = data?.revisions.find((r) => r.id === post?.current_revision_id);
  return <AppScreen title="Private editorial workspace"><View testID="linkedin-admin" style={s.stack}>
    <Text style={s.title}>LinkedIn learning posts</Text>
    <Action label="Refresh" id="linkedin-refresh" disabled={state.editing} onPress={() => void store.refresh()} />
    {state.error ? <Text accessibilityRole="alert" style={s.error}>{state.error}</Text> : null}
    {state.phase === "loading" ? <Text style={s.body}>Checking admin access…</Text> : null}
    {state.phase === "unavailable" ? <Text style={s.body}>Supabase is not configured. Public learning remains available.</Text> : null}
    {state.phase === "denied" ? <View><Text style={s.heading}>Admin access required</Text><Action label="Sign in" onPress={onSignIn} /></View> : null}
    {data ? <>
      <Text style={s.body}>{data.posts.length} posts · Publishing {data.settings.publishing_enabled ? "enabled" : "paused"} · {data.settings.timezone}</Text>
      <Text style={s.meta}>Worker: {data.settings.worker_last_seen ? new Date(data.settings.worker_last_seen).toLocaleString() : "Waiting for first run"}. {data.settings.worker_message} Requests wait until you ask Codex to process the queue.</Text>
      {post && revision ? <><Action label="Back to collection" id="linkedin-back" onPress={() => { store.setEditing(false); setSelected(null); }} /><NativeEditor key={revision.id} post={post} revision={revision} data={data} store={store} busy={state.busy} /></> : <>
        <TextInput accessibilityLabel="Search posts" placeholder="Search posts" placeholderTextColor={colors.textMuted} style={s.input} value={search} onChangeText={setSearch} testID="linkedin-search" />
        <Text style={s.heading}>Review status</Text><View style={s.row}>{["all", "review", "approved", "rejected", "withdrawing"].map((v) => <Action key={v} label={v} selected={status === v} onPress={() => setStatus(v)} />)}</View>
        <Text style={s.heading}>Topic</Text><View style={s.row}>{["all", ...new Set(data.posts.map((p) => p.topic))].map((v) => <Action key={v} label={v} selected={topic === v} onPress={() => setTopic(v)} />)}</View>
        <Text style={s.heading}>Publication</Text><View style={s.row}>{["all", "scheduled", "sent", "error", "unknown", "cancelled"].map((v) => <Action key={v} label={v} selected={publication === v} onPress={() => setPublication(v)} />)}</View>
        {filterPosts(data.posts, search, topic, status).filter((p) => publication === "all" || data.publications.some((pub) => pub.post_id === p.id && pub.status === publication)).map((p) => <Pressable key={p.id} accessibilityRole="button" onPress={() => setSelected(p.id)} style={s.post} testID={`linkedin-post-${p.id}`}><Text style={s.meta}>{p.topic} · {p.status}</Text><Text style={s.heading}>{p.title}</Text></Pressable>)}
      </>}
    </> : null}
  </View></AppScreen>;
}
function NativeEditor({ post, revision, data, store, busy }: { post: LinkedInPost; revision: LinkedInRevision; data: EditorialSnapshot; store: EditorialStore; busy: boolean }) {
  const [body, setBody] = useState(revision.body); const [comment, setComment] = useState(revision.first_comment); const [confirmed, setConfirmed] = useState(revision.facts_confirmed);
  const dirty = body !== revision.body || comment !== revision.first_comment || confirmed !== revision.facts_confirmed;
  const locked = post.status === "approved" || post.status === "withdrawing";
  const jobs = data.jobs.filter((j) => j.post_id === post.id);
  const refining = jobs.some((j) => j.kind === "refine" && j.revision_id === revision.id && ["pending", "running"].includes(j.status));
  const publications = data.publications.filter((p) => p.post_id === post.id);
  return <View style={s.stack}>
    <Text style={s.title}>{post.title}</Text><Text style={s.heading}>Post text</Text>
    <TextInput accessibilityLabel="Post text" value={body} onChangeText={(value) => { store.setEditing(value !== revision.body || comment !== revision.first_comment || confirmed !== revision.facts_confirmed); setBody(value); }} editable={!locked && !busy} multiline style={[s.input, s.editor]} testID="linkedin-body" />
    <Text style={s.meta}>{body.length}/3,000 characters{dirty ? " · Unsaved changes; automatic refresh paused" : ""}</Text>
    <Text style={s.heading}>First comment</Text><TextInput accessibilityLabel="First comment" value={comment} onChangeText={(value) => { store.setEditing(body !== revision.body || value !== revision.first_comment || confirmed !== revision.facts_confirmed); setComment(value); }} editable={!locked && !busy} multiline style={[s.input, s.comment]} testID="linkedin-comment" />
    <Text selectable style={s.body}>{comment}</Text><Text style={s.meta}>Select and copy the first comment to post it manually on Buffer Free.</Text>
    {revision.analysis?.verificationNotes.length ? <Action label={confirmed ? "Facts verified" : "Confirm flagged facts are verified"} disabled={locked || busy} onPress={() => { store.setEditing(body !== revision.body || comment !== revision.first_comment || !confirmed !== revision.facts_confirmed); setConfirmed(!confirmed); }} /> : null}
    <View style={s.row}>
      <Action label="Save revision" id="linkedin-save" disabled={locked || busy || !dirty || !body.trim() || body.length > 3000 || comment.length > 1248} onPress={() => void store.act(post, "save", { body, firstComment: comment, factsConfirmed: confirmed })} />
      <Action label={refining ? "Refinement queued" : "Refine"} id="linkedin-refine" disabled={locked || busy || dirty || refining} onPress={() => void store.act(post, "refine")} />
      <Action label="Approve & queue" id="linkedin-approve" disabled={locked || busy || dirty || !canApprove(revision)} onPress={() => void store.act(post, "approve")} />
      <Action label="Reject" id="linkedin-reject" disabled={locked || busy || dirty || post.status === "rejected"} onPress={() => void store.act(post, "reject")} />
      {locked ? <Action label={post.status === "withdrawing" ? "Cancellation queued" : "Return to review"} id="linkedin-withdraw" disabled={busy || post.status === "withdrawing" || publications.some((p) => p.status === "sent")} onPress={() => void store.act(post, "withdraw")} /> : null}
    </View><Text style={s.meta}>Approval schedules this exact revision in Buffer’s next recommended slot.</Text>
    {publications.map((p) => <Text key={p.id} selectable style={s.body}>Buffer: {p.status} {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : ""} {p.error} {p.url}</Text>)}
    {jobs.map((j) => <Text key={j.id} style={s.meta}>{j.kind}: {j.status} {j.error}</Text>)}
    <Text style={s.heading}>Source material</Text>{revision.sources.map((source) => <View key={source.path} style={s.source}><Text style={s.heading}>{source.title}</Text><Text selectable style={s.body}>{source.excerpt}</Text><Text selectable style={s.meta}>{source.path} · {source.hash.slice(0,12)}</Text>{source.urls.map((url) => <Text key={url} selectable style={s.meta}>{url}</Text>)}</View>)}
    {revision.analysis ? <NativeAnalysis analysis={revision.analysis} /> : null}
    {data.revisions.filter((r) => r.post_id === post.id && r.kind === "refine" && r.id !== revision.id).map((r) => <View key={r.id} style={s.source}><Text style={s.heading}>Proposed revision{r.parent_revision_id !== revision.id ? " · older draft" : ""}</Text><Text selectable style={s.body}>{r.body}</Text><Action label="Use revision" id={`linkedin-use-${r.id}`} disabled={locked || busy || dirty || r.parent_revision_id !== revision.id} onPress={() => void store.act(post, "use", { proposalId: r.id })} />{r.analysis ? <NativeAnalysis analysis={r.analysis} /> : null}</View>)}
    <Text style={s.heading}>Revision history</Text>{data.revisions.filter((r) => r.post_id === post.id).map((r) => <View key={r.id}><Text style={s.meta}>{r.kind} · {new Date(r.created_at).toLocaleString()}</Text><Text selectable style={s.body}>{r.body}</Text></View>)}
  </View>;
}
function NativeAnalysis({ analysis: a }: { analysis: LinkedInAnalysis }) {
  return <View style={s.stack}><Text style={s.heading}>Analysis</Text><Text style={s.body}>{a.coreIdea}</Text>{Object.entries(a.diagnosis).map(([name,v]) => <Text key={name} style={s.body}>{name}: {v.score}/10 · {v.justification}</Text>)}<Text style={s.heading}>Alternative hooks</Text>{a.alternativeHooks.map((v) => <Text key={v} style={s.body}>{v}</Text>)}<Text style={s.heading}>Key changes</Text>{a.keyChanges.map((v) => <Text key={v} style={s.body}>{v}</Text>)}<Text style={s.heading}>Posting plan</Text><Text style={s.body}>{a.postingPlan.format} · {a.postingPlan.timing}</Text><Text selectable style={s.body}>{a.postingPlan.firstComment}</Text><Text style={s.body}>{a.postingPlan.hashtags.join(" ")}</Text>{[...a.postingPlan.engagementActions,...a.visualOutline].map((v) => <Text key={v} style={s.body}>{v}</Text>)}{a.verificationNotes.map((v) => <Text key={v} style={s.error}>Verify: {v}</Text>)}<Text style={s.meta}>{a.assumptions} · Tools: {a.toolsUsed.join(", ")}</Text></View>;
}
function Action({ label, id, onPress, disabled, selected }: { label: string; id?: string; onPress: () => void; disabled?: boolean; selected?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected }} testID={id} disabled={disabled} onPress={onPress} style={[s.button, selected && s.selected, disabled && s.disabled]}><Text style={s.buttonText}>{label}</Text></Pressable>;
}
const s = StyleSheet.create({
  stack: { gap: spacing.md }, row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" }, heading: { color: colors.text, fontSize: 17, fontWeight: "600" }, body: { color: colors.text, fontSize: 16, lineHeight: 25 }, meta: { color: colors.textMuted, fontSize: 13, lineHeight: 20 }, error: { color: "#991b1b", fontSize: 15 },
  input: { borderWidth: 1, borderColor: "#7d8b94", borderRadius: radii.md, padding: spacing.md, backgroundColor: colors.panel, color: colors.text, fontSize: 16 }, editor: { minHeight: 280, textAlignVertical: "top" }, comment: { minHeight: 90, textAlignVertical: "top" },
  button: { minHeight: 44, borderWidth: 1, borderColor: "#7d8b94", borderRadius: radii.md, padding: spacing.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel }, buttonText: { color: colors.text, fontSize: 14, fontWeight: "600" }, selected: { backgroundColor: "#eaf7f4" }, disabled: { opacity: 0.5 },
  post: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line, gap: spacing.sm }, source: { borderLeftWidth: 2, borderLeftColor: colors.accentStrong, paddingLeft: spacing.md, gap: spacing.sm },
});
