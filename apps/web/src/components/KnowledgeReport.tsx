"use client";
import Link from "next/link";
import type { KnowledgeJob } from "@codematica/core/knowledge";
export function KnowledgeReport({ job, onReview }: { job: KnowledgeJob; onReview?: (decision: "accept" | "reject") => void }) {
  if (!job.report) return <p role="status">{job.status === "failed" ? job.error || "Local evaluation failed." : "Waiting for the local worker. Start it on your Mac to process this candidate."}</p>;
  const report = job.report;
  return <section className="grid min-w-0 gap-3" aria-label="Knowledge evaluation" data-testid="knowledge-report">
    <p className="break-all text-xs">Evaluation {job.id} · Candidate {report.candidate_hash.slice(0,12)}</p>{job.candidate?<details><summary>Evaluated candidate: {job.candidate.title}</summary><p className="whitespace-pre-wrap text-sm">{job.candidate.body}</p></details>:null}
    <h3 className="text-lg font-semibold">{report.action.replaceAll("_", " ")}</h3><p>{report.explanation}</p>
    <p className="break-all text-xs text-[#46535d]">Snapshot {report.snapshot_id.slice(0, 12)} · {report.metrics.elapsed_ms} ms · {report.metrics.cache_hits} cached calls</p>
    {report.warnings.map((w, i) => <p className="border-l-2 border-[#a34b00] pl-3 text-sm" key={i}>{w}</p>)}
    <dl className="text-sm">{Object.entries(report.placement).map(([key, value]) => <div className="break-all" key={key}><dt className="inline font-semibold">{key.replaceAll("_", " ")}: </dt><dd className="inline">{value}</dd></div>)}</dl>
    {report.overlapping_material?.length ? <div><h4 className="font-semibold">Overlapping material</h4><ul className="list-inside list-disc">{report.overlapping_material.map((v,i)=><li key={i}>{v}</li>)}</ul></div> : null}
    {report.missing_material?.length ? <div><h4 className="font-semibold">Missing material</h4><ul className="list-inside list-disc">{report.missing_material.map((v,i)=><li key={i}>{v}</li>)}</ul></div> : null}
    <h4 className="font-semibold">Matched resources and evidence</h4>
    {report.matches.map(r => <details key={r.id}><summary className="cursor-pointer font-semibold">{r.title} · {r.relation || "retrieved match"}</summary><p className="mt-2 whitespace-pre-wrap text-sm">{r.text.slice(0, 1800)}</p><p className="break-all text-xs">{r.sourcePath} · {r.hash.slice(0, 12)}</p>{r.route?.startsWith("/") && !r.route.startsWith("//") ? <Link className="text-[#006762] underline" href={r.route}>Open resource</Link> : null}</details>)}
    <h4 className="font-semibold">Proposed relationships</h4>
    {!report.relationships.length ? <p className="text-sm">No supported relationship proposal.</p> : report.relationships.map(e => <details key={e.id} className="break-all text-sm"><summary>{e.source} → {e.type} → {e.target}</summary>{e.evidence.map((v,i)=><blockquote className="border-l-2 border-[#7d8b94] pl-3" key={i}>{v.quote}<p className="text-xs">{v.resourceId} · {v.hash.slice(0,12)}</p></blockquote>)}</details>)}
    {onReview && !job.reviewed ? <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-lg border border-[#7d8b94] px-3" onClick={() => onReview("accept")}>Accept proposal</button><button className="min-h-11 rounded-lg border border-[#7d8b94] px-3" onClick={() => onReview("reject")}>Reject proposal</button></div> : null}
    <p className="text-sm text-[#46535d]">{job.reviewed ? `Proposal ${job.reviewed === "accept" ? "accepted" : "rejected"}. ` : ""}Content changes require an authoring edit and reindexing. Acceptance records review; it never publishes content.</p>
  </section>;
}
