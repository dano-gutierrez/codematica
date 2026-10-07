import { AdaptiveText as Text } from "./AdaptiveText";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AppState, Pressable, StyleSheet, TextInput, View } from "react-native";
import { canApprove, manualPostSchema, filterPosts, type EditorialClient, type EditorialSnapshot, type LinkedInPost, type LinkedInRevision, type LinkedInAnalysis } from "@codematica/core/linkedin";
import { preparationLabel } from "@codematica/core/linkedin-preparation";
import { createEditorialStore, type EditorialStore } from "@codematica/core/linkedin-store";
import { formatPostSelection, type PostFormat } from "@codematica/core/linkedin-formatting";
import { AppScreen } from "./screens";
import { Button, Disclosure } from "./Button";
import { colors, spacing, radii } from "./tokens";

export function LinkedInAdminScreen({ client, onSignIn }: { client: EditorialClient | null; onSignIn: () => void }) {
  const store = useMemo(() => createEditorialStore(client), [client]);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [creating, setCreating] = useState(false);
  const [scrollVersion, setScrollVersion] = useState(0);
  const resetViewScroll = () => setScrollVersion(value => value + 1);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all"); const [topic, setTopic] = useState("all"); const [publication, setPublication] = useState("all");
  useEffect(() => {
    const refresh = () => { if (AppState.currentState !== "background") void store.refresh(); };
    refresh(); const timer = setInterval(refresh, 15000); const sub = AppState.addEventListener("change", refresh);
    return () => { clearInterval(timer); sub.remove(); };
  }, [store]);
  const select = (id: string | null) => {
    const current = store.getSnapshot();
    if (current.busy || current.editing || id === selected) return;
    setSelected(id); void store.selectPost(id); resetViewScroll();
  };
  const data = state.data; const post = data?.posts.find((p) => p.id === selected); const revision = data?.revisions.find((r) => r.id === post?.current_revision_id);
  const visible = data ? filterPosts(data.posts, search, topic, status).filter(p => publication === "all" || data.publications.some(pub => pub.post_id === p.id && pub.status === publication)) : [];
  const activeFilterCount = [topic, status, publication].filter(value => value !== "all").length;
  return <AppScreen keyboardAware scrollResetKey={scrollVersion}><View testID="linkedin-admin" style={s.stack}>
    <Text accessibilityRole="header" style={s.title}>LinkedIn</Text><Text style={s.meta}>Review queue</Text>
    <View style={s.row}>
      {state.phase === "ready" ? <Action label="New post" id="linkedin-create" disabled={creating || state.busy || state.editing} onPress={() => { setCreating(true); resetViewScroll(); store.startCreate(); }} /> : null}
      <Action label="Refresh" id="linkedin-refresh" disabled={state.editing || state.busy} onPress={() => void store.refresh()} />
    </View>
    {state.error ? <Text accessibilityRole="alert" style={s.error}>{state.error}</Text> : null}
    {state.phase === "loading" ? <Text accessibilityLiveRegion="polite" style={s.body}>Checking admin access…</Text> : null}
    {state.phase === "unavailable" ? <Text style={s.body}>Supabase is not configured. Public learning remains available.</Text> : null}
    {state.phase === "denied" ? <View><Text style={s.heading}>Admin access required</Text><Action label="Sign in" onPress={onSignIn} /></View> : null}
    {data ? <>
      <Text style={s.body}>{data.posts.filter(p => p.status === "review").length} to review · {data.posts.length} posts</Text>
      <Disclosure label="Queue details"><Text style={s.meta}>Publishing {data.settings.publishing_enabled ? "on" : "paused"} · {data.settings.timezone}</Text><Text style={s.meta}>Worker: {data.settings.worker_last_seen ? new Date(data.settings.worker_last_seen).toLocaleString() : "Waiting for first run"}. {data.settings.worker_message}</Text><Text style={s.meta}>{data.settings.local_preparation_enabled ? "Run preparation, then ask Codex to verify ready drafts." : "Ask Codex to process queued requests."}</Text></Disclosure>
      {!selected && !creating && data.settings.voice_profile ? <NativeVoice key={data.settings.voice_profile.id} profile={data.settings.voice_profile} store={store} busy={state.busy} /> : null}
      {creating ? <NativeCreate store={store} busy={state.busy} onClose={(id) => { setCreating(false); store.setEditing(false); if (id) select(id); else resetViewScroll(); }} /> : post ? <><Action label="Back to collection" id="linkedin-back" disabled={state.busy || state.editing} onPress={() => select(null)} />{revision ? <NativeEditor key={revision.id} post={post} revision={revision} data={data} store={store} busy={state.busy} onSelect={select} /> : <Text accessibilityLiveRegion="polite" style={s.body}>{state.error ? "Draft details could not be loaded. Return to the collection and select the draft to try again." : "Loading draft…"}</Text>}</> : <>
        <Text style={s.heading}>Search posts</Text><TextInput accessibilityLabel="Search posts" placeholder="Search posts" placeholderTextColor={colors.textMuted} style={s.input} value={search} onChangeText={setSearch} testID="linkedin-search" />
        <Disclosure label={activeFilterCount ? `Filters (${activeFilterCount})` : "Filters"}>
        <Text style={s.heading}>Review status</Text><View style={s.row}>{["all", "review", "approved", "rejected", "withdrawing"].map((v) => <Action key={v} label={v === "all" ? "All statuses" : v[0].toUpperCase() + v.slice(1)} selected={status === v} onPress={() => setStatus(v)} />)}</View>
        <Text style={s.heading}>Topic</Text><View style={s.row}>{["all", ...new Set(data.posts.map((p) => p.topic))].map((v) => <Action key={v} label={v === "all" ? "All topics" : v} selected={topic === v} onPress={() => setTopic(v)} />)}</View>
        <Text style={s.heading}>Publication</Text><View style={s.row}>{["all", "scheduled", "sent", "error", "unknown", "cancelled"].map((v) => <Action key={v} label={v === "all" ? "All publications" : v[0].toUpperCase() + v.slice(1)} selected={publication === v} onPress={() => setPublication(v)} />)}</View></Disclosure>
        <Text accessibilityLiveRegion="polite" style={s.meta}>{visible.length} drafts</Text>
        {!visible.length ? <><Text style={s.body}>No matching posts.</Text><Action label="Reset filters" onPress={() => { setSearch(""); setTopic("all"); setStatus("all"); setPublication("all"); }} /></> : null}
        {visible.map((p) => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`${p.title}, ${p.topic}, ${p.status}`} disabled={state.busy || state.editing} accessibilityState={{ disabled: state.busy || state.editing }} onPress={() => select(p.id)} style={s.post} testID={`linkedin-post-${p.id}`}><Text style={s.meta}>{p.topic} · {p.status}{p.preparation_required ? ` · ${preparationLabel(p, data.jobs, data.preparations ?? [])}` : ""}</Text><Text style={s.heading}>{p.title}</Text></Pressable>)}
      </>}
    </> : null}
  </View></AppScreen>;
}
function NativeCreate({ store, busy, onClose }: { store: EditorialStore; busy: boolean; onClose: (id?: string) => void }) {
  const [title, setTitle] = useState(""); const [topic, setTopic] = useState(""); const [body, setBody] = useState("");
  return <View style={s.stack} testID="linkedin-create-form">
    <Text style={s.heading}>Create a manual post</Text>
    <Text style={s.meta}>Add a draft for preparation and review. Local preparation runs in a manual batch before Codex verification when enabled. You choose the final revision and approve it.</Text>
    <Text style={s.heading}>Title</Text><TextInput accessibilityLabel="Title" testID="linkedin-create-title" style={s.input} value={title} maxLength={200} editable={!busy} onChangeText={setTitle} />
    <Text style={s.heading}>Topic</Text><TextInput accessibilityLabel="Topic" testID="linkedin-create-topic" style={s.input} value={topic} maxLength={100} editable={!busy} onChangeText={setTopic} />
    <NativePostText value={body} onChange={setBody} disabled={busy} id="linkedin-create-body" />
    <Text style={s.meta}>{body.length}/3,000 characters</Text>
    <View style={s.row}><Action label={busy ? "Adding…" : "Add for analysis"} id="linkedin-create-submit" disabled={busy || !manualPostSchema.safeParse({ title, topic, body }).success} onPress={() => { void store.create({ title, topic, body }).then((id) => { if (id) onClose(id); }); }} /><Action label="Cancel" disabled={busy} onPress={() => onClose()} /></View>
  </View>;
}
function NativePostText({ value, onChange, disabled, id = "linkedin-body" }: { value: string; onChange: (value: string) => void; disabled?: boolean; id?: string }) {
  const field = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  function format(style: PostFormat) {
    const result = formatPostSelection(value, selection.start, selection.end, style);
    onChange(result.text); setSelection({ start: result.start, end: result.end }); field.current?.focus();
  }
  return <View style={s.stack}>
    <Text style={s.heading}>Post text</Text>
    <View style={s.row}>{([{ style: "bold", label: "Bold" }, { style: "italic", label: "Italic" }, { style: "bullet", label: "Bullets" }, { style: "plain", label: "Plain text" }] as const).map(({ style, label }) => <Action key={style} label={label} disabled={disabled} onPress={() => format(style)} />)}</View>
    <TextInput ref={field} accessibilityLabel="Post text" value={value} onChangeText={onChange} editable={!disabled} multiline style={[s.input, s.editor]} testID={id} selection={selection} onSelectionChange={(event) => setSelection(event.nativeEvent.selection)} />
    <Disclosure label="Formatting help"><Text style={s.meta}>Select text to style it. Unicode bold and italic count as two characters and may be harder for screen readers. Links, hashtags, emoji and line breaks stay as text; @names do not tag people.</Text></Disclosure>
  </View>;
}

function NativeEditor({ post, revision, data, store, busy, onSelect }: { post: LinkedInPost; revision: LinkedInRevision; data: EditorialSnapshot; store: EditorialStore; busy: boolean; onSelect: (id: string) => void }) {
  const [body, setBody] = useState(revision.body); const [comment, setComment] = useState(revision.first_comment); const [confirmed, setConfirmed] = useState(revision.facts_confirmed);
  const dirty = body !== revision.body || comment !== revision.first_comment || confirmed !== revision.facts_confirmed;
  const locked = post.status === "approved" || post.status === "withdrawing";
  const jobs = data.jobs.filter((j) => j.post_id === post.id);
  const refining = jobs.some((j) => ["prepare", "refine"].includes(j.kind) && j.revision_id === revision.id && ["pending", "running"].includes(j.status));
  const publications = data.publications.filter((p) => p.post_id === post.id);
  return <View style={s.stack}>
    <Text accessibilityRole="header" style={s.title}>{post.title}</Text>
    {post.origin === "manual" ? <Text style={s.meta}>Manual post. Analyze it, review the proposal and use that revision before approval. Changing its text requires another analysis.</Text> : null}
    <NativePostText value={body} onChange={(value) => { store.setEditing(value !== revision.body || comment !== revision.first_comment || confirmed !== revision.facts_confirmed); setBody(value); }} disabled={locked || busy} />
    <Text style={s.meta}>{body.length}/3,000 characters</Text>
    <Text accessibilityLiveRegion="polite" style={s.meta}>{dirty ? "Unsaved changes. Save or discard to switch drafts." : locked ? "Approved version" : "Saved"}</Text>
    <Text style={s.heading}>First comment</Text><TextInput accessibilityLabel="First comment" value={comment} onChangeText={(value) => { store.setEditing(body !== revision.body || value !== revision.first_comment || confirmed !== revision.facts_confirmed); setComment(value); }} editable={!locked && !busy} multiline style={[s.input, s.comment]} testID="linkedin-comment" />
    <Text style={s.meta}>Copy and post this comment manually in Buffer.</Text>
    {revision.analysis?.verificationNotes.map(note => <Text key={note} accessibilityLiveRegion="polite" style={s.warning}>{note}</Text>)}
    {revision.analysis?.verificationNotes.length ? <Action label={confirmed ? "Facts verified" : "Confirm flagged facts are verified"} selected={confirmed} disabled={locked || busy} onPress={() => { store.setEditing(body !== revision.body || comment !== revision.first_comment || !confirmed !== revision.facts_confirmed); setConfirmed(!confirmed); }} /> : null}
    <View style={s.row}>
      <Action label="Save revision" id="linkedin-save" disabled={locked || busy || !dirty || !body.trim() || body.length > 3000 || comment.length > 1248} onPress={() => void store.act(post, "save", { body, firstComment: comment, factsConfirmed: confirmed })} />
      <Action label={refining ? "Preparation / verification queued" : post.preparation_required ? "Prepare again" : "Refine"} id="linkedin-refine" disabled={locked || busy || dirty || refining} onPress={() => void store.act(post, "refine")} />
      <Action label="Approve & queue" id="linkedin-approve" disabled={locked || busy || dirty || !canApprove(revision, post.origin === "manual", post.preparation_required)} onPress={() => void store.act(post, "approve")} />
      <Action label="Reject" id="linkedin-reject" disabled={locked || busy || dirty || post.status === "rejected"} onPress={() => void store.act(post, "reject")} />
      {dirty ? <Action label="Discard changes" id="linkedin-discard" disabled={busy} onPress={() => { setBody(revision.body); setComment(revision.first_comment); setConfirmed(revision.facts_confirmed); store.setEditing(false); }} /> : null}
      {locked ? <Action label={post.status === "withdrawing" ? "Cancellation queued" : "Return to review"} id="linkedin-withdraw" disabled={busy || post.status === "withdrawing" || publications.some((p) => p.status === "sent")} onPress={() => void store.act(post, "withdraw")} /> : null}
    </View><Text style={s.meta}>Approval schedules this exact revision in Buffer’s next recommended slot.</Text>
    {publications.map((p) => <Text key={p.id} selectable style={s.body}>Buffer: {p.status} {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : ""} {p.error} {p.url}</Text>)}
    {jobs.map((j) => <Text key={j.id} style={s.meta}>{j.kind}: {j.status} {j.error} {j.verification?.notes.join(" · ")}</Text>)}
    <Disclosure label="Source material">{!revision.sources.length ? <Text style={s.meta}>User-authored draft. Claims will be checked during analysis.</Text> : null}{revision.sources.map((source) => <View key={source.path} style={s.source}><Text style={s.heading}>{source.title}</Text><Text selectable style={s.body}>{source.excerpt}</Text><Text selectable style={s.meta}>{source.path} · {source.hash.slice(0,12)}</Text>{source.urls.map((url) => <Text key={url} selectable style={s.meta}>{url}</Text>)}</View>)}</Disclosure>
    {post.preparation_required ? <NativePreparation post={post} revision={revision} data={data} store={store} disabled={locked || busy || dirty || refining || post.status !== "review"} onSelect={onSelect} /> : null}
    {revision.analysis ? <NativeAnalysis analysis={revision.analysis} /> : null}
    {data.revisions.filter((r) => r.post_id === post.id && r.kind === "refine" && r.id !== revision.id).map((r) => <View key={r.id} style={s.source}><Text style={s.heading}>Proposed revision{r.parent_revision_id !== revision.id ? " · older draft" : ""}</Text><Text selectable style={s.body}>{r.body}</Text><Action label="Use revision" id={`linkedin-use-${r.id}`} disabled={locked || busy || dirty || r.parent_revision_id !== revision.id} onPress={() => void store.act(post, "use", { proposalId: r.id })} />{r.analysis ? <NativeAnalysis analysis={r.analysis} /> : null}</View>)}
    <Disclosure label="Revision history">{data.revisions.filter((r) => r.post_id === post.id).map((r) => <View key={r.id}><Text style={s.meta}>{r.kind} · {new Date(r.created_at).toLocaleString()}</Text><Text selectable style={s.body}>{r.body}</Text></View>)}</Disclosure>
  </View>;
}
function NativeAnalysis({ analysis: a }: { analysis: LinkedInAnalysis }) {
  return <Disclosure label="Analysis"><View style={s.stack}><Text style={s.body}>{a.coreIdea}</Text>{Object.entries(a.diagnosis).map(([name,v]) => <Text key={name} style={s.body}>{name}: {v.score}/10 · {v.justification}</Text>)}<Text style={s.heading}>Alternative hooks</Text>{a.alternativeHooks.map((v) => <Text key={v} style={s.body}>{v}</Text>)}<Text style={s.heading}>Key changes</Text>{a.keyChanges.map((v) => <Text key={v} style={s.body}>{v}</Text>)}<Text style={s.heading}>Posting plan</Text><Text style={s.body}>{a.postingPlan.format} · {a.postingPlan.timing}</Text><Text selectable style={s.body}>{a.postingPlan.firstComment}</Text><Text style={s.body}>{a.postingPlan.hashtags.join(" ")}</Text>{[...a.postingPlan.engagementActions,...a.visualOutline].map((v) => <Text key={v} style={s.body}>{v}</Text>)}{a.verificationNotes.map((v) => <Text key={v} style={s.error}>Verify: {v}</Text>)}<Text style={s.meta}>{a.assumptions} · Tools: {a.toolsUsed.join(", ")}</Text></View></Disclosure>;
}
function Action({ label, id, onPress, disabled, selected }: { label: string; id?: string; onPress: () => void; disabled?: boolean; selected?: boolean }) {
  const tone = id === "linkedin-reject" ? "danger" : id === "linkedin-refine" ? "assist" : id === "linkedin-approve" ? "success" : id === "linkedin-withdraw" || id === "linkedin-discard" ? "warning" : id?.startsWith("linkedin-create") || id === "linkedin-save" ? "info" : "neutral";
  return <Button label={label} testID={id} onPress={onPress} disabled={disabled} selected={selected} tone={tone} variant={id === "linkedin-approve" || id === "linkedin-create" || id === "linkedin-create-submit" ? "primary" : "secondary"} />;
}
const s = StyleSheet.create({
  stack: { gap: spacing.md }, row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" }, heading: { color: colors.text, fontSize: 17, fontWeight: "600" }, body: { color: colors.text, fontSize: 16, lineHeight: 25 }, meta: { color: colors.textMuted, fontSize: 13, lineHeight: 20 }, error: { color: "#991b1b", fontSize: 15 },
  warning: { color: colors.amberText, fontSize: 15, lineHeight: 22 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#7d8b94", borderRadius: radii.md, padding: spacing.md, backgroundColor: colors.panel, color: colors.text, fontSize: 16 }, editor: { minHeight: 280, textAlignVertical: "top" }, comment: { minHeight: 90, textAlignVertical: "top" },
  post: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line, gap: spacing.sm }, source: { borderLeftWidth: 2, borderLeftColor: colors.accentStrong, paddingLeft: spacing.md, gap: spacing.sm },
});

function NativeVoice({ profile, store, busy }: { profile: NonNullable<EditorialSnapshot["settings"]["voice_profile"]>; store: EditorialStore; busy: boolean }) {
  const initial = profile.rules.join("\n"); const [value, setValue] = useState(initial);
  const rules = value.split("\n").map((line) => line.trim()).filter(Boolean);
  return <Disclosure label={`Voice rules · ${profile.version}`}><View style={s.stack}><Text style={s.meta}>Generic writing style only; no private messages or company details. Saving prepares review drafts again.</Text><TextInput accessibilityLabel="Voice rules, one per line" multiline style={s.input} value={value} editable={!busy} onChangeText={(v) => { setValue(v); store.setEditing(v !== initial); }} /><Action label="Save voice rules" disabled={busy || value === initial || !rules.length || rules.length > 20 || rules.some((r) => r.length > 500)} onPress={() => void store.setVoice(rules)} /></View></Disclosure>;
}
function NativePreparation({ post, revision, data, store, disabled, onSelect }: { post: LinkedInPost; revision: LinkedInRevision; data: EditorialSnapshot; store: EditorialStore; disabled: boolean; onSelect: (id: string) => void }) {
  const [reason, setReason] = useState("");
  const report = data.preparations?.filter((r) => r.post_id === post.id && r.revision_id === revision.id).at(-1);
  if (!report) return <Text style={s.meta}>{preparationLabel(post, data.jobs, data.preparations ?? [])}</Text>;
  return <View style={s.source} testID="linkedin-preparation"><Text style={s.heading}>Local preparation · {report.outcome}</Text><Text style={s.meta}>Local scores are advisory. This candidate has not been adopted or approved.</Text>
    {report.issues.map((issue, i) => <Text key={i} style={issue.blocking ? s.error : s.body}>{issue.message}</Text>)}
    {Object.entries(report.after).map(([key, value]) => <Text key={key} style={s.meta}>{key}: {report.before[key] ?? "—"} → {value.toFixed(1)}/10</Text>)}
    {report.analysis ? <><Text selectable style={s.body}>{report.analysis.rewrittenPost}</Text><NativeAnalysis analysis={report.analysis} /></> : null}
    {report.related.map((related) => <Action key={related.post_id} disabled={disabled} label={`${related.kind.replaceAll("_", " ")} · ${data.posts.find((p) => p.id === related.post_id)?.title ?? related.post_id}`} onPress={() => onSelect(related.post_id)} />)}
    <Text style={s.meta}>Writer: {report.versions.writer} · Judge: {report.versions.judge} · Voice: {report.versions.voice} · {report.metrics.rounds} rounds</Text>
    {report.outcome === "held" ? <><Text style={s.heading}>Reason for sending</Text><TextInput accessibilityLabel="Reason for sending" style={s.input} value={reason} maxLength={1000} editable={!disabled} onChangeText={setReason} /><Action label="Keep as a follow-up" id="linkedin-keep-followup" disabled={disabled || reason.trim().length < 5} onPress={() => void store.preparationAction(post, report.id, "follow_up", reason.trim())} /><Action label="Send to Codex with flags" id="linkedin-send-flags" disabled={disabled || reason.trim().length < 5} onPress={() => void store.preparationAction(post, report.id, "send_with_flags", reason.trim())} /></> : null}
  </View>;
}
