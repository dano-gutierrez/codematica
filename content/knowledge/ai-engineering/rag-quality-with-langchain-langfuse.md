---
title: RAG Quality With LangChain And Langfuse
slug: ai-engineering/rag-quality-with-langchain-langfuse
summary: A production-focused guide to retrieval quality, grounding, answer failures, LangChain RAG flows, and Langfuse evaluation datasets.
track: AI Engineering
topic: RAG
difficulty: senior
tags:
  - rag
  - langchain
  - langfuse
  - retrieval
  - evaluation
prerequisites:
  - LangChain models tools and RAG
  - Langfuse prompts datasets and evals
diagramRefs:
  - ai-engineering/llm-observability-loop
status: published
---

## Quality Lens

RAG quality is not only answer quality. It is retrieval quality plus prompt quality plus output policy plus evaluation. A model cannot reliably answer from trusted sources if the retriever returns the wrong sources, too many sources, stale sources, or no sources.

The production question is not "does RAG work?" The question is "for which user jobs, source types, and failure modes is this RAG flow reliable enough?"

## Retrieval Failure Modes

Common failures:

- **No hit:** the index has no relevant source.
- **Wrong hit:** the retriever finds similar words but not the right concept.
- **Stale hit:** the source used to be correct but is no longer current.
- **Permission leak:** the retriever returns content the user should not see.
- **Context overload:** too many passages push important instructions or sources out of the useful context window.
- **Citation mismatch:** the answer cites a source that does not support the claim.

Each failure should have a traceable signal.

## LangChain Flow

A simple RAG flow can be a chain or an agent. Use the simpler shape first:

1. Convert the question into a retrieval query.
2. Retrieve candidate chunks.
3. Filter by permissions and freshness.
4. Build a compact context block.
5. Ask the model to answer only from context.
6. Return citations and fallback when context is insufficient.

Agents are helpful when the system must choose among multiple retrieval tools or actions. They are not a substitute for clear retrieval evaluation.

## Langfuse Trace Fields

For RAG debugging, trace:

- original user question
- normalized retrieval query
- source ids and versions
- ranking scores, if safe and useful
- permission filter outcome
- context token count
- model and prompt version
- answer citations
- fallback reason
- human or automated grounding score

This lets the team tell whether a bad answer came from retrieval, prompt instructions, model behavior, missing data, or output validation.

## Evaluation Dataset Design

Build a RAG dataset with cases that represent real production risk:

- easy factual lookup
- ambiguous wording
- multi-document synthesis
- outdated policy
- missing answer
- user asks for content they cannot access
- adversarial instruction inside retrieved text

Expected output does not always need to be one exact answer. Sometimes the expected behavior is "escalate", "ask a clarifying question", or "refuse because the source is missing."

## Real-Life Case: Policy Drift

A company changes its refund window from 30 days to 14 days. The model still answers 30 days because an old help article remains indexed.

Good RAG operations catch this in multiple ways:

- source version metadata appears in traces
- stale documents are excluded or down-ranked
- dataset cases include policy changes
- experiments compare prompt and retrieval changes against the stale-policy scenario
- the answer cites the source, making review possible

## Coding Challenge: Verify Citations

This is a non-executable challenge for the future code editor.

Starter code:

```ts
type Source = { id: string; text: string };
type Answer = { text: string; citedSourceIds: string[] };

export function citationStatus(answer: Answer, sources: Source[]) {
  // implement
}
```

Acceptance checks:

- return `missing-citation` when the answer has no citations
- return `unknown-source` when a cited id is not in `sources`
- return `ok` when every cited id exists
- return a count of cited sources in the result object

Future editor extension:

- add a test that checks whether the answer text uses at least one word from a cited source
- add a test that fails when the answer cites a source that was not retrieved for that request

## Principal Review Bar

Principal-level RAG design treats retrieval as an owned subsystem. It has source freshness rules, permissions, evaluation datasets, observability, fallback behavior, and incident review. The model is only one part of the system.

## Reference Anchors

- [LangChain RAG](https://docs.langchain.com/oss/python/langchain/rag)
- [LangChain tools](https://docs.langchain.com/oss/python/langchain/tools)
- [Langfuse datasets](https://langfuse.com/docs/evaluation/experiments/datasets)
- [Langfuse scores data model](https://langfuse.com/docs/evaluation/scores/data-model)
