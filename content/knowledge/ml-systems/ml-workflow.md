---
title: The ML Workflow As An Evidence Loop
slug: ml-systems/ml-workflow
summary: Organize problem framing, data, modeling, evaluation, deployment, and monitoring as an iterative evidence-producing workflow.
track: ML Systems
topic: Foundations
difficulty: foundation
tags: [workflow, experiments, evaluation, monitoring]
prerequisites: [ML systems requirements]
diagramRefs: []
sourceRefs: [harvard-vol1-ml-workflow, ml-system-case-study-index]
status: published
---

## Primary reading

Read Harvard’s [ML Workflow chapter](https://mlsysbook.ai/vol1/ml_workflow/ml_workflow.html). Use this guide to produce artifacts another engineer can audit.

## A loop, not a waterfall

Problem framing determines data and metrics. Data exploration exposes feasibility problems. Evaluation reveals error slices that change collection or labeling. Deployment produces real traffic and new failure evidence. Draw the loop and make its feedback paths explicit.

## Preserve comparable experiments

Each experiment should change one named assumption or design choice. Record code, configuration, data version, random seed, environment, metrics, and artifacts. Compare against a baseline with the same evaluation contract.

## Evaluate slices and operations

Aggregate quality can hide systematic failures. Define important slices before inspection, and avoid repeatedly tuning against the test set. Add system metrics—latency, memory, throughput, and cost—to model metrics early enough that architecture can still change.

## Deployment and monitoring

Plan validation, shadowing or limited rollout, rollback, and alert ownership. Monitor inputs, outputs, system health, and delayed outcomes when available. A dashboard is useful only when it supports a decision.

## Practical output

Create an experiment ledger with a prediction, independent variable, controlled factors, success criteria, result, and next action. Keep failed experiments in the ledger so their results remain useful.

## Review a case study as a claim

Use the [curated ML case-study index](https://github.com/Engineer1999/A-Curated-List-of-ML-System-Design-Case-Studies/tree/1da84a9dc996d857fe63d1f1609fad6caa17f8cb) to discover a relevant reading. Its repository and index were checked; the linked articles and reported outcomes were not independently verified. Follow a link to the original technical author before using it as evidence. A list entry or familiar company name cannot validate an architecture or result.

For one accessible primary report, write this original review record:

| Field | Evidence to record |
| --- | --- |
| Provenance | Original author, publication date, URL and inspected revision or excerpt. |
| Constraint | The workload, population, latency, cost or reliability problem the author actually states. |
| Decision | The mechanism chosen, the rejected alternative and the stated reason. |
| Measurement | Baseline, comparison conditions, denominator and limits of the reported outcome. Write unknown when omitted. |
| Transfer | A difference in your workload that could invalidate the conclusion, and the first experiment that would check it. |

Record unknown for any field the primary report does not establish. Separate the author's reported measurement from your hypothesis and local result. If the primary report is unavailable, keep the discovery link with an evidence gap; do not invent missing implementation details or reproduce a commercial article. Compare the record with your experiment ledger before adopting the design. The index does not certify these cases or complete a planned career stage.
