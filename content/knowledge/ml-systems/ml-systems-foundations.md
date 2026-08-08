---
title: ML Systems Foundations And Requirements
slug: ml-systems/ml-systems-foundations
summary: Translate an ML product goal into measurable model, data, infrastructure, reliability, and responsible-engineering requirements.
track: ML Systems
topic: Foundations
difficulty: foundation
tags: [requirements, metrics, tradeoffs, ml-systems]
prerequisites: [AI engineering and the ML systems lens]
diagramRefs: []
sourceRefs: [harvard-vol1-ml-systems]
status: published
---

## Primary reading

Read Harvard’s [ML Systems chapter](https://mlsysbook.ai/vol1/ml_systems/ml_systems.html), then use this companion to turn its concepts into a reviewable system brief.

## Define the system boundary

Name inputs, outputs, users, upstream dependencies, downstream decisions, feedback, and the deployment environment. A model is one component inside that boundary. Requirements must cover the complete path from data arrival to an action and its monitoring.

## Make metrics operational

Model quality, latency, throughput, availability, memory, energy, cost, privacy, fairness, and robustness can conflict. Define each metric, population, time window, percentile, and threshold. “Fast” is not testable; “p95 under 120 ms at 50 requests per second on the target device” is.

## Baselines before complexity

Start with a simple baseline and a fixed evaluation contract. A complex model earns its cost only if it improves the mission outcome enough to justify development, serving, and operational burden.

## Failure budget

List statistical, software, data, and infrastructure failure modes. For each, name detection, containment, recovery, and the owner who responds. Silent degradation deserves explicit monitoring because success responses can hide worsening predictions.

## Practical output

Write a one-page system card: mission, stakeholders, system boundary, dataset assumptions, baseline, metric table, constraints, three failure modes, and the next experiment. Mark every unknown as an assumption rather than silently inventing precision.

