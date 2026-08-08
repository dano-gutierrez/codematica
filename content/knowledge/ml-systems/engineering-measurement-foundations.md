---
title: Engineering And Measurement Foundations
slug: ml-systems/engineering-measurement-foundations
summary: Practice reproducible environments, version control, experiments, profiling, and evidence capture before entering the ML systems curriculum.
track: ML Systems
topic: Prerequisites
difficulty: foundation
tags: [git, testing, profiling, reproducibility]
prerequisites: [Python and NumPy basics]
diagramRefs: []
sourceRefs: [harvard-cs249r-repository]
status: published
---

## A result needs provenance

The CS249r repository is an integrated curriculum: book, labs, TinyTorch, hardware kits, MLSys·im, and StaffML. Its practical work assumes that you can run code, preserve an experiment, and explain what changed. The [upstream repository](https://github.com/harvard-edge/cs249r_book) is the primary source for setup and component status.

For every experiment, record the question, prediction, code revision, environment, input, metric definition, result, and interpretation. This turns a screenshot into reproducible evidence.

## Environments and version control

Use an isolated Python environment. Pin enough dependencies to reproduce behavior, but do not mistake a lockfile for a complete environment record: operating system, accelerator, drivers, and device settings can matter. Commit small changes with messages that name the learning or behavior change.

## Tests before benchmarks

A fast wrong implementation is still wrong. Establish correctness on small cases, include edge cases, and keep a reference implementation when optimizing. Then benchmark with representative inputs, warmups, repeated trials, and an explicit statistic such as median or p95.

## Evidence discipline

Separate observation from explanation. “p95 increased from 42 ms to 71 ms” is an observation. “memory pressure caused cache misses” is a hypothesis until another measurement supports it. Good systems work makes that boundary visible.

## Hardware is optional in this path

Real hardware reveals power, thermal, memory, and device-specific limits. If you do not have the kit, use the MLSys·im alternative and document which effects the simulation models or omits. Completing the simulator branch is a valid path outcome; it is not a claim that simulation and physical deployment are identical.

