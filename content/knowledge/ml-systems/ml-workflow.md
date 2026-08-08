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
sourceRefs: [harvard-vol1-ml-workflow]
status: published
---

## Primary reading

Read Harvard’s [ML Workflow chapter](https://mlsysbook.ai/vol1/ml_workflow/ml_workflow.html). This guide emphasizes the artifacts that let another engineer audit the workflow.

## A loop, not a waterfall

Problem framing determines data and metrics. Data exploration exposes feasibility problems. Evaluation reveals error slices that change collection or labeling. Deployment produces real traffic and new failure evidence. Draw the loop and make its feedback paths explicit.

## Preserve comparable experiments

Each experiment should change one named assumption or design choice. Record code, configuration, data version, random seed, environment, metrics, and artifacts. Compare against a baseline with the same evaluation contract.

## Evaluate slices and operations

Aggregate quality can hide systematic failures. Define important slices before inspection, and avoid repeatedly tuning against the test set. Add system metrics—latency, memory, throughput, and cost—to model metrics early enough that architecture can still change.

## Deployment and monitoring

Plan validation, shadowing or limited rollout, rollback, and alert ownership. Monitor inputs, outputs, system health, and delayed outcomes when available. A dashboard is useful only when it supports a decision.

## Practical output

Create an experiment ledger with a prediction, independent variable, controlled factors, success criteria, result, and next action. The ledger should make a failed experiment useful rather than disposable.

