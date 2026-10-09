---
title: "Applied AI, Retrieval And Bounded Actions"
slug: "fde/ai-and-retrieval"
summary: "Choose where AI helps, build evidence-linked retrieval and constrain model actions with deterministic application policy."
track: "Forward Deployed Engineering"
topic: "Applied AI, Retrieval And Bounded Actions"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-anthropic-agents", "fde-owasp-authorization"]
status: "published"
---

Not every FDE role centers on AI, and not every customer problem needs a model. Use deterministic code for exact rules, lookups, arithmetic and known workflow transitions. Consider a model where language interpretation, extraction or drafting is useful and you can evaluate the failure cost.

## Choose the smallest useful design

Compare a manual baseline, rules/search, a single model call with evidence, a predefined multi-step workflow and a model-directed agent. Anthropic distinguishes workflows with predefined code paths from agents that select their own steps. Its architectural guidance favors adding complexity only when evidence justifies it; the article's tooling examples are not a current SDK prescription.

For Northstar, start with authorized order lookup and a fixed draft template. Add model drafting only if it improves operator outcomes. An agent that can issue refunds introduces a different risk and evaluation problem; it is not a natural consequence of a successful read-only prototype.

## Understand the retrieval pipeline

Document ingestion → parsing → useful chunks with provenance → permission-aware candidate retrieval → optional reranking → evidence selection → answer with citations or abstention. Retrieval-augmented generation supplies external context; it does not guarantee correctness or solve authorization. Keep source version and freshness visible. A citation must support the attached claim, not merely point to a vaguely related document.

Distinguish retrieval failure from generation failure. If the right source is absent, revise corpus coverage, parsing, chunking, query handling or retrieval. If the right evidence is present but the answer distorts it, inspect the prompt, model behavior and validation. Fine-tuning is not a substitute for current customer facts or a permissions system. Consider it only for a defined behavior gap with suitable rights, examples and held-out evaluation.

Design a typed result such as `status`, `answer`, `source_ids`, `source_timestamp` and `needs_review`. Validate field types and allowed values, then validate important semantic constraints separately. Syntactically valid JSON can contain a false claim. Let missing, contradictory or stale evidence produce a clear fallback.

## Bound model-directed work

Set allowed tools, input schemas, per-user authorization, maximum steps, time budget and cost budget. Require explicit handling of unknown tool outcomes. Keep tool descriptions precise and return structured errors. Stop conditions should be enforced by the application. Put approval at the point where it can prevent the consequential action, and record what the person actually approved.

## Practice

Create twelve short synthetic support-policy documents: four normal, two obsolete, two contradictory, two outside the caller's tenant, and two containing instruction-like text. Write twenty queries, including missing-answer and denied-access cases. Run a keyword baseline first. A credential-free version can use hand-authored model responses; label those results as fixture validation rather than model-quality measurement.

Compare retrieval coverage, evidence faithfulness, abstention and latency. Predict which failures require data fixes and which require prompt changes. For implementation depth, continue to [RAG quality practice](/docs/ai-engineering/rag-quality-with-langchain-langfuse) and the [AI Engineering path](/paths/ai-engineering-langfuse-langchain).

## Review your work

Can you defend using a model against the non-model baseline? Can the system refuse an unsupported answer without hiding useful context? Could a document or generated argument cause an unauthorized action? A compelling answer is one part of a bounded customer workflow.

## Sources and further study

- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents): December 19, 2024 architectural guidance, including its notice that tooling has changed. Used for workflow/agent tradeoffs, not a current SDK recipe.
- [API1:2023 Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/): OWASP API Security Top 10, 2023 edition. Object/action authorization and regression testing.
