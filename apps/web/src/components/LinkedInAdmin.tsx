"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Check, Plus, Copy, RefreshCw, Save, Sparkles, Undo2, X, Linkedin, Search, Clock3, ArrowLeft, RotateCcw } from "lucide-react";
import { canApprove, manualPostSchema, createEditorialClient, filterPosts, type EditorialClient, type EditorialSnapshot, type LinkedInAnalysis, type LinkedInPost, type LinkedInRevision } from "@codematica/core/linkedin";
import { createEditorialStore, type EditorialStore } from "@codematica/core/linkedin-store";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AppHeader } from "./AppHeader";
import { Button } from "./Button";
import { LinkedInPostText } from "./LinkedInPostText";
import { Dropdown } from "./Dropdown";

export function LinkedInAdmin({ client }: { client?: EditorialClient | null }) {
  const store = useMemo(() => {
    const db = client === undefined ? createBrowserSupabaseClient() : null;
    return createEditorialStore(client === undefined ? (db ? createEditorialClient(db) : null) : client);
  }, [client]);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");
  const [publicationStatus, setPublicationStatus] = useState("all");
  const postButtons = useRef(new Map<string, HTMLButtonElement>());
  const previousView = useRef({ selected, creating });
  const createButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = previousView.current;
    if (!creating && previous.creating && !selected) createButton.current?.focus();
    else if (!selected && previous.selected) postButtons.current.get(previous.selected)?.focus();
    previousView.current = { selected, creating };
  }, [selected, creating]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState !== "hidden") void store.refresh(); };
    refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [store]);
  const data = state.data;
  const post = data?.posts.find((item) => item.id === selected);
  const revision = data?.revisions.find((item) => item.id === post?.current_revision_id);
  const visible = data ? filterPosts(data.posts, search, topic, status).filter((item) =>
    publicationStatus === "all" || data.publications.some((p) => p.post_id === item.id && p.status === publicationStatus)) : [];

  return <main className="editorial-page" data-testid="linkedin-admin">
    <AppHeader subtitle="Private workspace" />
    <header className="editorial-heading">
      <div className="editorial-title">
        <span className="editorial-brand"><Linkedin size={24} aria-hidden="true" /></span>
        <div><h1>LinkedIn</h1><p>Review queue</p></div>
      </div>
      <div className="ui-actions">
        {state.phase === "ready" ? <Button ref={createButton} label="New post" icon={Plus} tone="info" data-testid="linkedin-create" disabled={creating || state.busy || state.editing} onClick={() => { setCreating(true); store.startCreate(); }} /> : null}
        <Button label="Refresh posts" icon={RefreshCw} iconOnly disabled={state.editing || state.busy} onClick={() => void store.refresh()} />
      </div>
    </header>
    {state.error ? <p role="alert" className="editorial-alert">{state.error}</p> : null}
    {state.phase === "loading" ? <p role="status" className="editorial-empty">Checking access…</p> : null}
    {state.phase === "unavailable" ? <p className="editorial-empty">Supabase is not configured. Public learning remains available.</p> : null}
    {state.phase === "denied" ? <div className="editorial-empty"><h2>Admin access required</h2><p>Sign in with your admin account.</p><Link href="/login?next=/admin/linkedin" className="ui-button ui-button-info ui-button-secondary mt-4">Sign in</Link></div> : null}
    {data ? <>
      <div className="editorial-summary">
        <p><strong>{data.posts.filter((p) => p.status === "review").length}</strong> to review <span>· {data.posts.length} posts</span></p>
        <details className="editorial-queue-details" data-testid="linkedin-worker-details">
          <summary><Clock3 size={14} aria-hidden="true" />Queue details<span className="editorial-badge">{data.settings.publishing_enabled ? "Publishing on" : "Publishing paused"}</span></summary>
          <div className="editorial-queue-content">
            <p>Worker: {data.settings.worker_last_seen ? new Date(data.settings.worker_last_seen).toLocaleString() : "Waiting for first run"}</p>
            {data.settings.worker_message ? <p>{data.settings.worker_message}</p> : null}
            <p>Ask Codex to process queued requests. Posting timezone: {data.settings.timezone}.</p>
          </div>
        </details>
      </div>
      {creating ? <CreatePost store={store} busy={state.busy} onClose={(id) => {
        setCreating(false); store.setEditing(false); if (id) setSelected(id);
      }} /> : <>
        <div className={`editorial-filters ${post ? "editorial-hide-compact" : ""}`} role="search" aria-label="Filter posts">
          <label className="editorial-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Search posts</span><input placeholder="Search drafts…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="linkedin-search" /></label>
          <Dropdown label="Topic" value={topic} onValueChange={setTopic} triggerClassName="editorial-filter-trigger" options={[{ value: "all", label: "All topics" }, ...[...new Set(data.posts.map((p) => p.topic))].sort().map((value) => ({ value, label: value }))]} />
          <Dropdown label="Status" value={status} onValueChange={setStatus} triggerClassName="editorial-filter-trigger" options={["all", "review", "approved", "rejected", "withdrawing"].map((value) => ({ value, label: value === "all" ? "All statuses" : value }))} />
          <Dropdown label="Publication" value={publicationStatus} onValueChange={setPublicationStatus} triggerClassName="editorial-filter-trigger" options={["all", "scheduled", "sent", "error", "unknown", "cancelled"].map((value) => ({ value, label: value === "all" ? "All publications" : value }))} />
        </div>
        <div className="editorial-workspace">
          <aside className={post ? "editorial-hide-compact" : ""} aria-label="Draft collection">
            <div className="editorial-list-heading"><span>Drafts</span><span>{visible.length}</span></div>
            <div className="editorial-post-list" data-testid="linkedin-post-list">
              {visible.length ? visible.map((item) => <button key={item.id} ref={(node) => { if (node) postButtons.current.set(item.id, node); else postButtons.current.delete(item.id); }} aria-pressed={item.id === selected} disabled={state.busy || (state.editing && item.id !== selected)}
                className="editorial-post-item" onClick={() => setSelected(item.id)} data-testid={`linkedin-post-${item.id}`}>
                <span className="editorial-post-meta"><span>{item.topic}</span><span className="editorial-status" data-status={item.status}>{item.status === "review" ? "Review" : item.status}</span></span>
                <span className="editorial-post-title">{item.title}</span>
              </button>) : <p className="editorial-empty">No matching posts.</p>}
            </div>
          </aside>
          {post && revision ? <div className="editorial-detail">
            <Button label="Back to collection" icon={ArrowLeft} variant="quiet" className="editorial-back" disabled={state.busy || state.editing} onClick={() => setSelected(null)} />
            <PostEditor key={revision.id} post={post} revision={revision} data={data} store={store} busy={state.busy} />
          </div> : <div className="editorial-empty editorial-selection"><Linkedin size={32} aria-hidden="true" /><h2>Choose a draft</h2><p>Edit, refine, then approve.</p></div>}
        </div>
      </>}
    </> : null}
  </main>;
}

function CreatePost({ store, busy, onClose }: { store: EditorialStore; busy: boolean; onClose: (id?: string) => void }) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const titleField = useRef<HTMLInputElement>(null);
  useEffect(() => { titleField.current?.focus(); }, []);
  return <section aria-label="Create a manual post" className="editorial-create" data-testid="linkedin-create-form">
    <div className="editorial-section-heading"><h2>New draft</h2><p>Analysis first. Approval comes after review.</p></div>
    <div className="editorial-create-fields">
      <label>Title<input ref={titleField} className="ui-input" value={title} maxLength={200} disabled={busy} onChange={(e) => setTitle(e.target.value)} data-testid="linkedin-create-title" /></label>
      <label>Topic<input className="ui-input" value={topic} maxLength={100} disabled={busy} onChange={(e) => setTopic(e.target.value)} data-testid="linkedin-create-topic" /></label>
    </div>
    <LinkedInPostText value={body} onChange={setBody} disabled={busy} id="linkedin-create-body" />
    <p className="editorial-counter" data-invalid={body.length > 3000}>{body.length.toLocaleString()}/3,000</p>
    <div className="ui-actions">
      <Button label={busy ? "Adding…" : "Add for analysis"} icon={Sparkles} tone="assist" variant="primary" data-testid="linkedin-create-submit"
        disabled={busy || !manualPostSchema.safeParse({ title, topic, body }).success}
        onClick={() => { void store.create({ title, topic, body }).then((id) => { if (id) onClose(id); }); }} />
      <Button label="Cancel" icon={X} variant="quiet" disabled={busy} onClick={() => onClose()} />
    </div>
  </section>;
}

function PostEditor({ post, revision, data, store, busy }: { post: LinkedInPost; revision: LinkedInRevision; data: EditorialSnapshot; store: EditorialStore; busy: boolean }) {
  const [body, setBody] = useState(revision.body);
  const [comment, setComment] = useState(revision.first_comment);
  const [confirmed, setConfirmed] = useState(revision.facts_confirmed);
  const [copied, setCopied] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const dirty = body !== revision.body || comment !== revision.first_comment || confirmed !== revision.facts_confirmed;
  const locked = post.status === "approved" || post.status === "withdrawing";
  const jobs = data.jobs.filter((j) => j.post_id === post.id);
  const refining = jobs.some((j) => j.kind === "refine" && j.revision_id === revision.id && ["pending", "running"].includes(j.status));
  const proposals = data.revisions.filter((r) => r.post_id === post.id && r.kind === "refine" && r.id !== revision.id);
  const publications = data.publications.filter((p) => p.post_id === post.id);
  const history = data.revisions.filter((r) => r.post_id === post.id);
  return <section className="editorial-editor" aria-label="Post review" data-testid="linkedin-review">
    <div className="editorial-section-heading">
      <div className="editorial-editor-meta"><span>{post.topic}</span><span className="editorial-status" data-status={post.status}>{post.status === "review" ? "In review" : post.status}</span>{post.origin === "manual" ? <span className="editorial-badge">Manual draft</span> : null}</div>
      <h2 ref={heading} tabIndex={-1}>{post.title}</h2>
      {post.origin === "manual" && (!revision.analysis || !revision.prompt_hash) ? <p>Use an analyzed revision before approval.</p> : null}
    </div>
    <LinkedInPostText value={body} disabled={locked || busy} onChange={(value) => {
      store.setEditing(value !== revision.body || comment !== revision.first_comment || confirmed !== revision.facts_confirmed); setBody(value);
    }} />
    <div className="editorial-editor-status">
      <span role="status" data-testid="linkedin-editor-save-state" data-dirty={dirty}>{dirty ? "Unsaved changes. Save or discard to switch drafts." : locked ? "Approved version" : "Saved"}</span>
      <span className="editorial-counter" data-invalid={body.length > 3000}>{body.length.toLocaleString()}/3,000</span>
    </div>
    {revision.analysis?.verificationNotes.length ? <div className="editorial-verification">
      <ul>{revision.analysis.verificationNotes.map((note) => <li key={note}>{note}</li>)}</ul>
      <label data-testid="linkedin-verification-control"><input type="checkbox" checked={confirmed} disabled={locked || busy} onChange={(e) => {
        store.setEditing(body !== revision.body || comment !== revision.first_comment || e.target.checked !== revision.facts_confirmed); setConfirmed(e.target.checked);
      }} /><span>Facts verified. Save to confirm.</span></label>
    </div> : null}
    <div className="editorial-actionbar">
      <div role="group" aria-label="Post actions" className="editorial-actions">
        <div className="ui-actions">
          <Button label="Save revision" icon={Save} iconOnly tone="info" disabled={locked || busy || !dirty || !body.trim() || body.length > 3000 || comment.length > 1248}
            onClick={() => void store.act(post, "save", { body, firstComment: comment, factsConfirmed: confirmed })} />
          <Button label={refining ? "Refinement queued" : "Refine post"} icon={refining ? Clock3 : Sparkles} iconOnly tone="assist" disabled={locked || busy || dirty || refining} onClick={() => void store.act(post, "refine")} />
          <Button label="Reject post" icon={X} iconOnly tone="danger" disabled={locked || busy || dirty || post.status === "rejected"} onClick={() => void store.act(post, "reject")} />
          {dirty ? <Button label="Discard changes" icon={RotateCcw} iconOnly disabled={busy} onClick={() => {
            setBody(revision.body); setComment(revision.first_comment); setConfirmed(revision.facts_confirmed); store.setEditing(false);
          }} /> : null}
          {locked ? <Button label={post.status === "withdrawing" ? "Cancellation queued" : "Return to review"} icon={Undo2} iconOnly tone="warning" disabled={busy || post.status === "withdrawing" || publications.some((p) => p.status === "sent")} onClick={() => void store.act(post, "withdraw")} /> : null}
        </div>
        <Button label="Approve & queue" icon={Check} variant="primary" tone="success" aria-describedby="linkedin-approval-help" disabled={locked || busy || dirty || !canApprove(revision, post.origin === "manual")} onClick={() => void store.act(post, "approve")} />
      </div>
      <p id="linkedin-approval-help">Queues the saved version for Buffer’s next slot.</p>
    </div>
    {publications.map((p) => <p key={p.id} role="status" className="editorial-publication">Buffer: {p.status}{p.scheduled_at ? ` · ${new Date(p.scheduled_at).toLocaleString()}` : ""}{p.error ? ` · ${p.error}` : ""}{p.url?.startsWith("https://") ? <> · <a href={p.url} target="_blank" rel="noreferrer">View post</a></> : null}</p>)}
    {jobs.filter((j) => ["pending", "running", "failed", "uncertain"].includes(j.status)).map((j) => <p key={j.id} className="editorial-job" role="status" data-testid={`linkedin-job-${j.id}`}>{j.kind}: {j.status}{j.error ? ` · ${j.error}` : ""}</p>)}
    {proposals.map((p) => <details key={p.id} open={p.parent_revision_id === revision.id} className="editorial-disclosure editorial-proposal">
      <summary>Proposed revision{p.parent_revision_id !== revision.id ? " · older draft" : ""}</summary>
      <div className="editorial-proposal-text">{p.body}</div>
      <Button label="Use revision" icon={Check} tone="assist" disabled={locked || busy || dirty || p.parent_revision_id !== revision.id} onClick={() => void store.act(post, "use", { proposalId: p.id })} />
      {p.analysis ? <Analysis analysis={p.analysis} /> : null}
    </details>)}
    <details className="editorial-disclosure" data-testid="linkedin-first-comment">
      <summary data-testid="linkedin-comment-toggle">First comment<span className="editorial-disclosure-meta">Optional</span></summary>
      <label className="sr-only" htmlFor="linkedin-comment">First comment</label>
      <textarea id="linkedin-comment" data-testid="linkedin-comment" className="ui-input editorial-comment" value={comment} disabled={locked || busy} onChange={(e) => {
        store.setEditing(body !== revision.body || e.target.value !== revision.first_comment || confirmed !== revision.facts_confirmed); setComment(e.target.value); setCopied(false);
      }} />
      <div className="editorial-comment-footer"><p>Copy manually on Buffer Free.</p><Button label={copied ? "Copied" : "Copy first comment"} icon={copied ? Check : Copy} iconOnly disabled={!comment} onClick={() => { void navigator.clipboard.writeText(comment).then(() => setCopied(true)).catch(() => setCopied(false)); }} /></div>
      {comment.length > 1248 ? <p role="alert" className="editorial-alert">First comment exceeds 1,248 characters.</p> : null}
    </details>
    <details className="editorial-disclosure" data-testid="linkedin-sources">
      <summary>Sources<span className="editorial-disclosure-meta">{revision.sources.length}</span></summary>
      {!revision.sources.length ? <p className="editorial-help">User-authored draft. Claims are checked during analysis.</p> : null}
      {revision.sources.map((s) => <div key={s.path} className="editorial-source">
        <h3>{s.title}</h3><p>{s.excerpt}</p>
        {s.urls.filter((url) => /^https?:\/\//.test(url)).map((url) => <a key={url} href={url} rel="noreferrer" target="_blank">{url}</a>)}
        <details className="editorial-format-help"><summary>Provenance</summary><p>{s.path} · {s.hash.slice(0, 12)}</p></details>
      </div>)}
    </details>
    {revision.analysis ? <Analysis analysis={revision.analysis} /> : null}
    <details className="editorial-disclosure"><summary>Revision history<span className="editorial-disclosure-meta">{history.length}</span></summary>
      {history.map((r) => <div key={r.id} className="editorial-history"><h3>{r.kind} · {new Date(r.created_at).toLocaleString()}</h3><p>{r.body}</p></div>)}
      {jobs.length ? <details className="editorial-format-help"><summary>Request history</summary>{jobs.map((j) => <p key={j.id}>{j.kind}: {j.status}{j.error ? ` · ${j.error}` : ""}</p>)}</details> : null}
    </details>
  </section>;
}

function Analysis({ analysis: a }: { analysis: LinkedInAnalysis }) {
  return <details className="editorial-disclosure editorial-analysis"><summary>Analysis</summary>
    <p className="editorial-help">{a.coreIdea}</p>
    <dl className="editorial-scores">{Object.entries(a.diagnosis).map(([key, value]) => <div key={key}>
      <dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd><strong>{value.score}</strong><span>/10</span></dd>
    </div>)}</dl>
    <details className="editorial-format-help"><summary>Score notes</summary>{Object.entries(a.diagnosis).map(([key, value]) => <p key={key}><strong>{key.replace(/([A-Z])/g, " $1")}: </strong>{value.justification}</p>)}</details>
    <h3>Alternative hooks</h3><ul>{a.alternativeHooks.map((v) => <li key={v}>{v}</li>)}</ul>
    <h3>Key changes</h3><ul>{a.keyChanges.map((v) => <li key={v}>{v}</li>)}</ul>
    <details className="editorial-format-help"><summary>Posting plan & assumptions</summary>
      <p>{a.postingPlan.format} · {a.postingPlan.timing}</p><p>First comment: {a.postingPlan.firstComment}</p>
      <p>{a.postingPlan.hashtags.join(" ")}</p>{a.postingPlan.engagementActions.map((v) => <p key={v}>{v}</p>)}
      {a.visualOutline.map((v) => <p key={v}>{v}</p>)}{a.verificationNotes.map((v) => <p key={v}>Verify: {v}</p>)}
      <p>{a.assumptions} · Tools: {a.toolsUsed.join(", ")}</p>
    </details>
  </details>;
}
