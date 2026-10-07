"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Check, Plus, Copy, RefreshCw, Save, Sparkles, Undo2, X } from "lucide-react";
import { canApprove, manualPostSchema, createEditorialClient, filterPosts, type EditorialClient, type EditorialSnapshot, type LinkedInAnalysis, type LinkedInPost, type LinkedInRevision } from "@codematica/core/linkedin";
import { preparationLabel } from "@codematica/core/linkedin-preparation";
import { createEditorialStore, type EditorialStore } from "@codematica/core/linkedin-store";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AppHeader } from "./AppHeader";
import { LinkedInPostText } from "./LinkedInPostText";
import { Dropdown } from "./Dropdown";
import { LinkedInKnowledge } from "./LinkedInKnowledge";

const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#7d8b94] bg-white px-3 py-2 text-sm font-semibold text-[#263238] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007c78]";
const input = "w-full rounded-lg border border-[#7d8b94] bg-white p-3 text-[#263238] focus-visible:outline-2 focus-visible:outline-[#007c78]";

export function LinkedInAdmin({ client }: { client?: EditorialClient | null }) {
  const store = useMemo(() => { const db = client === undefined ? createBrowserSupabaseClient() : null; return createEditorialStore(client === undefined ? (db ? createEditorialClient(db) : null) : client); }, [client]);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState(""); const [topic, setTopic] = useState("all"); const [status, setStatus] = useState("all"); const [publicationStatus, setPublicationStatus] = useState("all");
  useEffect(() => {
    const refresh = () => { if (document.visibilityState !== "hidden") void store.refresh(); };
    refresh(); const timer = setInterval(refresh, 15000); window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [store]);
  const select = (id: string | null) => { store.setEditing(false); setSelected(id); void store.selectPost(id); };
  const data = state.data;
  const post = data?.posts.find((item) => item.id === selected);
  const revision = data?.revisions.find((item) => item.id === post?.current_revision_id);
  const visible = data ? filterPosts(data.posts, search, topic, status).filter((item) => publicationStatus === "all" || data.publications.some((p) => p.post_id === item.id && p.status === publicationStatus)) : [];
  return <main className="mx-auto max-w-6xl px-4 py-6" data-testid="linkedin-admin">
    <AppHeader subtitle="Private editorial workspace" />
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold text-[#263238]">LinkedIn learning posts</h1><div className="flex gap-2">{state.phase === "ready" ? <button className={button} data-testid="linkedin-create" disabled={state.busy || state.editing} onClick={() => { setCreating(true); store.startCreate(); }}><Plus size={16} />Create</button> : null}<button className={button} disabled={state.editing || state.busy} onClick={() => void store.refresh()}><RefreshCw size={16} />Refresh</button></div></div>
    {state.error ? <p role="alert" className="my-4 rounded-lg bg-red-50 p-3 text-red-900">{state.error}</p> : null}
    {state.phase === "loading" ? <p role="status" className="mt-6">Checking admin access…</p> : null}
    {state.phase === "unavailable" ? <p className="mt-6">Supabase is not configured. Public learning remains available.</p> : null}
    {state.phase === "denied" ? <div className="mt-6"><h2 className="font-semibold">Admin access required</h2><p>Sign in with your personal admin account to review posts.</p><Link href="/login?next=/admin/linkedin" className={`${button} mt-4`}>Sign in</Link></div> : null}
    {data ? <>
      <p className="my-4 text-sm text-[#46535d]">{data.posts.length} posts · {data.posts.filter((p) => p.status === "review").length} awaiting review · Publishing {data.settings.publishing_enabled ? "enabled" : "paused"} · {data.settings.timezone}</p>
      <p className="mb-5 text-sm text-[#46535d]">Worker: {data.settings.worker_last_seen ? new Date(data.settings.worker_last_seen).toLocaleString() : "Waiting for first run"}. {data.settings.worker_message} {data.settings.local_preparation_enabled ? "Run a local preparation batch, then ask Codex to verify ready drafts." : "Requests wait until you ask Codex to process the queue."}</p>
      {!selected && !creating && data.settings.voice_profile ? <VoiceRules key={data.settings.voice_profile.id} profile={data.settings.voice_profile} store={store} busy={state.busy} /> : null}
      {creating ? <CreatePost store={store} busy={state.busy} onClose={(id) => { setCreating(false); store.setEditing(false); if (id) setSelected(id); }} /> : <>
      <div className={`${post ? "hidden lg:grid" : "grid"} gap-3 sm:grid-cols-2 lg:grid-cols-4`}><label className="text-sm">Search posts<input className={`${input} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} data-testid="linkedin-search" /></label>
        <Dropdown label="Topic" value={topic} onValueChange={setTopic} options={[{ value: "all", label: "All topics" }, ...[...new Set(data.posts.map((p) => p.topic))].sort().map((value) => ({ value, label: value }))]} />
        <Dropdown label="Review status" value={status} onValueChange={setStatus} options={["all", "review", "approved", "rejected", "withdrawing"].map((value) => ({ value, label: value === "all" ? "All statuses" : value }))} />
        <Dropdown label="Publication" value={publicationStatus} onValueChange={setPublicationStatus} options={["all", "scheduled", "sent", "error", "unknown", "cancelled"].map((value) => ({ value, label: value === "all" ? "All publications" : value }))} />
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(230px,1fr)_2fr]">
        <div className={`${post ? "hidden lg:block" : ""} divide-y divide-[#d5e2e8] lg:max-h-[70vh] lg:overflow-y-auto`} data-testid="linkedin-post-list">{visible.length ? visible.map((item) => <button key={item.id} aria-pressed={item.id === selected} className={`block w-full px-3 py-4 text-left focus-visible:outline-2 focus-visible:outline-[#007c78] ${item.id === selected ? "bg-[#eaf7f4]" : "bg-white"}`} onClick={() => { select(item.id); }} data-testid={`linkedin-post-${item.id}`}><span className="block text-xs uppercase text-[#46535d]">{item.topic} · {item.status}{item.preparation_required ? ` · ${preparationLabel(item, data.jobs, data.preparations ?? [])}` : ""}</span><span className="mt-1 block font-semibold text-[#263238]">{item.title}</span></button>) : <p className="py-4">No posts match these filters.</p>}</div>
        {post && revision ? <div className="min-w-0"><button className={`${button} mb-4 lg:hidden`} onClick={() => { select(null); }}><Undo2 size={16} />Back to collection</button><PostEditor key={revision.id} post={post} revision={revision} data={data} store={store} busy={state.busy} onSelect={select} /></div> : <p className="py-4 text-[#46535d]">Choose a post to review its text and sources.</p>}
      </div>
      </>}
    </> : null}
  </main>;
}

function CreatePost({ store, busy, onClose }: { store: EditorialStore; busy: boolean; onClose: (id?: string) => void }) {
  const [title, setTitle] = useState(""); const [topic, setTopic] = useState(""); const [body, setBody] = useState("");
  return <section aria-label="Create a manual post" className="mt-6 max-w-3xl space-y-4" data-testid="linkedin-create-form">
    <h2 className="text-xl font-semibold">Create a manual post</h2>
    <p className="text-sm text-[#46535d]">Add a draft for preparation and review. Local preparation runs in a manual batch before Codex verification when enabled. You choose the final revision and approve it.</p>
    <label className="block text-sm font-semibold">Title<input className={`${input} mt-2`} value={title} maxLength={200} disabled={busy} onChange={(e) => setTitle(e.target.value)} data-testid="linkedin-create-title" /></label>
    <label className="block text-sm font-semibold">Topic<input className={`${input} mt-2`} value={topic} maxLength={100} disabled={busy} onChange={(e) => setTopic(e.target.value)} data-testid="linkedin-create-topic" /></label>
    <LinkedInPostText value={body} onChange={setBody} disabled={busy} id="linkedin-create-body" />
    <p className={body.length > 3000 ? "text-red-800" : "text-sm text-[#46535d]"}>{body.length}/3,000 characters</p>
    <div className="flex flex-wrap gap-2"><button className={button} data-testid="linkedin-create-submit" disabled={busy || !manualPostSchema.safeParse({ title, topic, body }).success} onClick={() => { void store.create({ title, topic, body }).then((id) => { if (id) onClose(id); }); }}><Sparkles size={16} />{busy ? "Adding…" : "Add for analysis"}</button><button className={button} disabled={busy} onClick={() => onClose()}><X size={16} />Cancel</button></div>
  </section>;
}

function PostEditor({ post, revision, data, store, busy, onSelect }: { post: LinkedInPost; revision: LinkedInRevision; data: EditorialSnapshot; store: EditorialStore; busy: boolean; onSelect: (id: string) => void }) {
  const [body, setBody] = useState(revision.body); const [comment, setComment] = useState(revision.first_comment); const [confirmed, setConfirmed] = useState(revision.facts_confirmed); const [copied, setCopied] = useState(false);
  const dirty = body !== revision.body || comment !== revision.first_comment || confirmed !== revision.facts_confirmed;
  const locked = post.status === "approved" || post.status === "withdrawing";
  const jobs = data.jobs.filter((j) => j.post_id === post.id);
  const refining = jobs.some((j) => ["prepare", "refine"].includes(j.kind) && j.revision_id === revision.id && ["pending", "running"].includes(j.status));
  const proposals = data.revisions.filter((r) => r.post_id === post.id && r.kind === "refine" && r.id !== revision.id);
  const publications = data.publications.filter((p) => p.post_id === post.id);
  return <section className="min-w-0 space-y-5" aria-label="Post review" data-testid="linkedin-review">
    <h2 className="text-xl font-semibold">{post.title}</h2>
    {post.origin === "manual" ? <p className="text-sm text-[#46535d]">Manual post. Analyze it, review the proposal and use that revision before approval. Changing its text requires another analysis.</p> : null}
    <LinkedInPostText value={body} disabled={locked || busy} onChange={(value) => { store.setEditing(value !== revision.body || comment !== revision.first_comment || confirmed !== revision.facts_confirmed); setBody(value); }} />
    <p className={body.length > 3000 ? "text-red-800" : "text-sm text-[#46535d]"}>{body.length}/3,000 characters{dirty ? " · Unsaved changes; automatic refresh paused" : ""}</p>
    <label className="block text-sm font-semibold">First comment<textarea className={`${input} mt-2 min-h-24 font-normal`} value={comment} disabled={locked || busy} onChange={(e) => { store.setEditing(body !== revision.body || e.target.value !== revision.first_comment || confirmed !== revision.facts_confirmed); setComment(e.target.value); }} /></label>
    <p className="text-sm text-[#46535d]">First comments are copied manually on Buffer Free. Approval schedules the post text.</p>
    <button className={button} onClick={() => { void navigator.clipboard.writeText(comment).then(() => setCopied(true)).catch(() => setCopied(false)); }}><Copy size={16} />{copied ? "Copied" : "Copy first comment"}</button>
    {revision.analysis?.verificationNotes.length ? <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={locked || busy} onChange={(e) => { store.setEditing(body !== revision.body || comment !== revision.first_comment || e.target.checked !== revision.facts_confirmed); setConfirmed(e.target.checked); }} /><span>I verified the flagged facts. Save a revision to record this confirmation.</span></label> : null}
    <div className="flex flex-wrap gap-2">
      <button className={button} disabled={locked || busy || !dirty || !body.trim() || body.length > 3000 || comment.length > 1248} onClick={() => void store.act(post, "save", { body, firstComment: comment, factsConfirmed: confirmed })}><Save size={16} />Save revision</button>
      <button className={button} disabled={locked || busy || dirty || refining} onClick={() => void store.act(post, "refine")}><Sparkles size={16} />{refining ? "Preparation / verification queued" : post.preparation_required ? "Prepare again" : "Refine"}</button>
      <button className={button} disabled={locked || busy || dirty || !canApprove(revision, post.origin === "manual", post.preparation_required)} onClick={() => void store.act(post, "approve")}><Check size={16} />Approve &amp; queue</button>
      <button className={button} disabled={locked || busy || dirty || post.status === "rejected"} onClick={() => void store.act(post, "reject")}><X size={16} />Reject</button>
      {locked ? <button className={button} disabled={busy || post.status === "withdrawing" || publications.some((p) => p.status === "sent")} onClick={() => void store.act(post, "withdraw")}><Undo2 size={16} />{post.status === "withdrawing" ? "Cancellation queued" : "Return to review"}</button> : null}
    </div>
    <p className="text-sm text-[#46535d]">Approve &amp; queue authorizes the exact saved revision for Buffer’s next recommended slot.</p>
    {publications.map((p) => <p key={p.id} role="status">Buffer: {p.status}{p.scheduled_at ? ` · ${new Date(p.scheduled_at).toLocaleString()}` : ""}{p.error ? ` · ${p.error}` : ""}{p.url?.startsWith("https://") ? <> · <a href={p.url} target="_blank" rel="noreferrer">View post</a></> : null}</p>)}
    {jobs.map((j) => <p key={j.id} className="text-sm" role="status">{j.kind}: {j.status}{j.error ? ` · ${j.error}` : ""}{j.verification?.notes.map((note, i) => <span className="block" key={i}>{note}</span>)}</p>)}
    <details open><summary className="cursor-pointer font-semibold">Source material</summary>{!revision.sources.length ? <p className="mt-2 text-sm">User-authored draft. Claims will be checked during analysis.</p> : null}{revision.sources.map((s) => <div key={s.path} className="mt-3 border-l-2 border-[#007c78] pl-3"><p className="font-semibold">{s.title}</p><p className="my-2 whitespace-pre-wrap text-sm">{s.excerpt}</p><p className="break-all text-xs text-[#46535d]">{s.path} · {s.hash.slice(0,12)}</p>{s.urls.filter((url) => /^https?:\/\//.test(url)).map((url) => <a key={url} href={url} rel="noreferrer" target="_blank" className="mt-1 block break-all text-sm underline">{url}</a>)}</div>)}</details>
    <LinkedInKnowledge key={revision.id} postId={post.id} revisionId={revision.id} title={post.title} body={revision.body + (revision.first_comment ? "\n\n" + revision.first_comment : "")} disabled={dirty || busy} />
    {post.preparation_required ? <PreparationReview post={post} revision={revision} data={data} store={store} disabled={locked || busy || dirty || refining || post.status !== "review"} onSelect={onSelect} /> : null}
    {revision.analysis ? <Analysis analysis={revision.analysis} /> : null}
    {proposals.map((p) => <details key={p.id} open={p.parent_revision_id === revision.id} className="border-t border-[#d5e2e8] pt-4"><summary className="cursor-pointer font-semibold">Proposed revision{p.parent_revision_id !== revision.id ? " · based on an older draft" : ""}</summary><div className="my-4 whitespace-pre-wrap rounded-lg bg-[#eaf7f4] p-4 leading-7">{p.body}</div><button className={button} disabled={locked || busy || dirty || p.parent_revision_id !== revision.id} onClick={() => void store.act(post, "use", { proposalId: p.id })}><Check size={16} />Use revision</button>{p.analysis ? <Analysis analysis={p.analysis} /> : null}</details>)}
    <details><summary className="cursor-pointer font-semibold">Revision history</summary>{data.revisions.filter((r) => r.post_id === post.id).map((r) => <div key={r.id} className="mt-3"><p className="text-sm font-semibold">{r.kind} · {new Date(r.created_at).toLocaleString()}</p><p className="whitespace-pre-wrap text-sm">{r.body}</p></div>)}</details>
  </section>;
}
function Analysis({ analysis: a }: { analysis: LinkedInAnalysis }) {
  return <div className="my-4 space-y-3"><h3 className="font-semibold">Analysis</h3><p>{a.coreIdea}</p><dl className="grid gap-2 sm:grid-cols-2">{Object.entries(a.diagnosis).map(([key, value]) => <div key={key}><dt className="font-semibold capitalize">{key}: {value.score}/10</dt><dd className="text-sm">{value.justification}</dd></div>)}</dl><h4 className="font-semibold">Alternative hooks</h4><ul className="list-inside list-disc">{a.alternativeHooks.map((v) => <li key={v}>{v}</li>)}</ul><h4 className="font-semibold">Key changes</h4><ul className="list-inside list-disc">{a.keyChanges.map((v) => <li key={v}>{v}</li>)}</ul><h4 className="font-semibold">Posting plan</h4><p>{a.postingPlan.format} · {a.postingPlan.timing}</p><p className="whitespace-pre-wrap">First comment: {a.postingPlan.firstComment}</p><p>{a.postingPlan.hashtags.join(" ")}</p>{a.postingPlan.engagementActions.map((v) => <p key={v}>{v}</p>)}{a.visualOutline.map((v) => <p key={v}>{v}</p>)}{a.verificationNotes.map((v) => <p key={v} className="font-semibold text-amber-900">Verify: {v}</p>)}<p className="text-sm text-[#46535d]">{a.assumptions} · Tools: {a.toolsUsed.join(", ")}</p></div>;
}

function VoiceRules({ profile, store, busy }: { profile: NonNullable<EditorialSnapshot["settings"]["voice_profile"]>; store: EditorialStore; busy: boolean }) {
  const initial = profile.rules.join("\n"); const [value, setValue] = useState(initial);
  const rules = value.split("\n").map((line) => line.trim()).filter(Boolean);
  return <details className="my-4"><summary className="cursor-pointer font-semibold">Voice rules · {profile.version}</summary><p className="my-2 text-sm">Generic writing style only. Saving starts a new version and prepares review drafts again. Keep company details and private messages out.</p><label className="block">Voice rules, one per line<textarea className={`${input} mt-2 min-h-40`} value={value} disabled={busy} onChange={(e) => { setValue(e.target.value); store.setEditing(e.target.value !== initial); }} /></label><button className={`${button} mt-2`} disabled={busy || value === initial || !rules.length || rules.length > 20 || rules.some((r) => r.length > 500)} onClick={() => void store.setVoice(rules)}>Save voice rules</button></details>;
}
function PreparationReview({ post, revision, data, store, disabled, onSelect }: { post: LinkedInPost; revision: LinkedInRevision; data: EditorialSnapshot; store: EditorialStore; disabled: boolean; onSelect: (id: string) => void }) {
  const [reason, setReason] = useState("");
  const report = data.preparations?.filter((r) => r.post_id === post.id && r.revision_id === revision.id).at(-1);
  if (!report) return <p role="status">{preparationLabel(post, data.jobs, data.preparations ?? [])}</p>;
  return <section className="space-y-3 rounded-lg border border-[#7d8b94] p-4" data-testid="linkedin-preparation"><h3 className="font-semibold">Local preparation · {report.outcome}</h3><p className="text-sm">Local scores are advisory. This candidate has not been adopted or approved.</p>
    {report.issues.map((issue, i) => <p key={i} className={issue.blocking ? "text-amber-900" : ""}>{issue.message}</p>)}
    <dl>{Object.entries(report.after).map(([key, value]) => <div key={key}><dt className="inline capitalize">{key}: </dt><dd className="inline">{report.before[key] ?? "—"} → {value.toFixed(1)}/10</dd></div>)}</dl>
    {report.analysis ? <><p className="whitespace-pre-wrap">{report.analysis.rewrittenPost}</p><p className="whitespace-pre-wrap">First comment: {report.analysis.postingPlan.firstComment}</p><details><summary>Local analysis and hooks</summary><Analysis analysis={report.analysis} /></details></> : null}
    {report.related.map((related) => <p key={related.post_id}><button className={`${button} text-left`} disabled={disabled} onClick={() => onSelect(related.post_id)}>{related.kind.replaceAll("_", " ")} · {data.posts.find((p) => p.id === related.post_id)?.title ?? related.post_id}</button><span className="block text-sm">{related.reason}</span></p>)}
    <details><summary>Preparation versions</summary><p className="break-all text-xs">Writer: {report.versions.writer}<br />Judge: {report.versions.judge}<br />Voice: {report.versions.voice}<br />Prompt: {report.versions.prompt}<br />{report.metrics.rounds} rounds · {(report.metrics.elapsed_ms / 1000).toFixed(0)} seconds</p></details>
    {report.outcome === "held" ? <><label className="block text-sm">Reason for sending<textarea className={`${input} mt-2`} value={reason} maxLength={1000} disabled={disabled} onChange={(e) => setReason(e.target.value)} /></label><div className="flex flex-wrap gap-2"><button className={button} disabled={disabled || reason.trim().length < 5} onClick={() => void store.preparationAction(post, report.id, "follow_up", reason.trim())}>Keep as a follow-up</button><button className={button} disabled={disabled || reason.trim().length < 5} onClick={() => void store.preparationAction(post, report.id, "send_with_flags", reason.trim())}>Send to Codex with flags</button></div></> : null}
  </section>;
}
