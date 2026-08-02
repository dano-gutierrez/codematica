---
title: Langfuse Tracing Fundamentals
slug: ai-engineering/langfuse-tracing-fundamentals
summary: A practical guide to Langfuse traces, observations, sessions, metadata, latency, token usage, and debugging LLM behavior.
track: AI Engineering
topic: Observability
difficulty: practitioner
tags:
  - langfuse
  - tracing
  - observability
  - opentelemetry
  - ai-engineering
prerequisites:
  - LLM application map
  - distributed tracing basics
diagramRefs:
  - ai-engineering/langfuse-trace-lifecycle
status: published
---

## Trace Design Lens

A trace is the story of one request, task, or workflow. In an LLM application, that story often includes prompt assembly, retrieval, tool calls, model generations, output checks, and fallbacks.

Langfuse traces are built from observations. Some observations represent normal spans, such as retrieval or tool execution. Some represent model generations, where model name, prompt, response, usage, latency, and errors matter.

OpenTelemetry gives the general vocabulary: tracers create spans, and exporters send traces to a backend. Langfuse applies that idea to LLM applications and adds AI-specific views for prompts, generations, scores, and datasets.

## What To Capture

Capture enough to answer production questions:

- Which user or session did this belong to, when allowed?
- Which prompt version or label was used?
- Which documents were retrieved?
- Which tools ran?
- Which model ran?
- How long did each step take?
- How many tokens were used?
- Did the request succeed, fallback, or error?
- Was the output later scored or annotated?

Avoid capturing secrets, raw credentials, full private documents, or unnecessary personal data. Hashing a stable user identifier is pseudonymization, not anonymization: it can still enable correlation and may remain personal data. Useful debugging data should be intentionally shaped, access-controlled, and covered by retention and deletion rules.

## Trace Shape

A readable trace usually has a stable shape:

```text
support-answer trace
  classify-intent span
  retrieve-policy span
  draft-answer generation
  output-policy-check span
```

If every request has a different trace shape, debugging gets harder. If every step is collapsed into one giant model call, debugging also gets harder.

## Sessions

A session groups multiple traces across a user journey. A chat conversation may have one trace per message, while the session shows the whole conversation. Use sessions when one user outcome spans multiple requests.

Keep the difference clear:

- **Trace:** one request or task timeline.
- **Observation/span:** one operation inside the trace.
- **Generation:** one model call inside the trace.
- **Session:** a multi-turn journey across traces.

## Metadata And Tags

Metadata and tags make traces searchable. Useful tags are stable and low-cardinality:

- environment
- feature name
- route name
- prompt label
- model family
- experiment name

Be careful with high-cardinality or sensitive fields. A tenant id may be useful with privacy controls; a full user message is not a tag.

## Real-Life Case: Cost Spike

A team sees model spend double after a release. Without tracing, they only know the bill increased.

With good Langfuse traces, they can filter by prompt version and feature, compare token usage before and after release, find longer retrieved contexts, and inspect whether a new prompt caused verbose responses.

The fix may be prompt wording, context trimming, retrieval settings, model choice, or an output limit. The trace tells the team where to look first.

## Coding Challenge: Build Trace Metadata

This is a non-executable challenge for the future code editor.

Starter code:

```ts
type TraceInput = {
  requestId: string;
  userId?: string;
  sessionId?: string;
  feature: "support-answer" | "policy-search";
  promptVersion: string;
  retrievedSourceIds: string[];
};

export function buildTraceMetadata(input: TraceInput) {
  // implement
}
```

Acceptance checks:

- include `request_id`, `feature`, and `prompt_version`
- include `session_id` only when present
- include `source_count`, not the full source contents
- do not include `userId` directly; return a redacted or hashed field name if the product requires user correlation

## Practitioner Checklist

- Start a trace at the application boundary.
- Add child observations for retrieval, tools, and model generations.
- Attach stable metadata and safe tags.
- Record errors and fallbacks as first-class outcomes.
- Flush or shut down tracing cleanly in scripts and workers.

## Principal Review Bar

At principal level, tracing is a governance asset. It supports debugging, cost control, model migration, incident review, prompt experiments, and quality measurement. The trace schema should be reviewed like an API contract.

## Reference Anchors

- [Langfuse instrumentation](https://langfuse.com/docs/observability/sdk/instrumentation)
- [Langfuse SDK overview](https://langfuse.com/docs/observability/sdk/overview)
- [Langfuse sessions](https://langfuse.com/docs/observability/features/sessions)
- [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)
