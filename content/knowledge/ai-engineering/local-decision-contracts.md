---
title: Local Decision Contracts — Evidence Before Action
slug: ai-engineering/local-decision-contracts
summary: Practice local decision contracts through original source-bound cases; inspect the declared scope and missing evidence.
track: AI Engineering
topic: Local Decision Contracts
difficulty: practitioner
tags: [evidence-review, contracts, original-practice]
prerequisites: []
diagramRefs: []
sourceRefs: ["evidence-openjev-readout", "evidence-openjev-license"]
status: published
---

## Name the decision and its evidence

A content evaluator needs a bounded question, explicit alternatives and retrieved passages. Start with a fictional candidate that adds a crash example to an existing retry lesson. Record the candidate hash, source snapshot and exact supporting section. The option "update existing" means an objective already belongs there; it does not authorize changing that lesson. Keep model selection, grounded explanation and human approval as distinct records.

## Read the primitive before assigning meaning

The [pinned readout](https://github.com/abhishekgahlot2/openjev-server/blob/032a2c5791f3d8856cc26fdb6876c106fac8dbf8/openjev_server/readout.py) selects the largest probability for choice, uses a zero-based expected index for score, and returns a calibrated probability for the yes/no noul question. With probabilities 0.2, 0.3 and 0.5, the expected index is 1.3. That value is neither option 1 with certainty nor a measured percentage of correctness. Define the option order and score scale in the request contract.

## Keep uncertainty separate from permission

Suppose update, new lesson and skip receive 0.45, 0.40 and 0.15. Update wins this readout, but a close alternative still matters. If the only retrieved quote describes retries without the candidate’s crash boundary, preserve that missing evidence. A confident output cannot supply an absent passage. Reject nonfinite probabilities or an unknown option identity rather than guessing a default. The existing [agent handoff](/docs/ai-engineering/evidence-first-agent-handoffs) explains why a saved assessment is not an approval.

## Measure the whole local experiment

The [server documentation](https://github.com/abhishekgahlot2/openjev-server/blob/032a2c5791f3d8856cc26fdb6876c106fac8dbf8/README.md) separates calibration from held-out evaluation and server-code licensing from model-weight terms. In a fictional trial, reserve development examples for fitting and a separate final set for evaluation. Count retrieval misses, mistaken duplicates, abstentions, cache hits, model version, latency and memory. Zero generated output tokens does not mean zero inference work, free electricity, or unrestricted commercial weight use. Do not turn a publisher’s speed claim into your own benchmark.

## Stage a reproducible recommendation

Before authoring, write the candidate identity, ordered options, model/prompt versions, evidence identities, missing context and a primary recommendation with alternatives. Change one source paragraph and mark the earlier recommendation stale. Change only option order and recompute the readout rather than reusing its cached number. A useful lesson-derived post is cross-format reuse; an interchangeable second lesson can be a duplicate. Complete the checkpoint without running a model or editing curriculum.

Continue with the [checkpoint](/practice/ai-engineering/local-decision-contracts-checkpoint).
