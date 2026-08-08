---
title: Data Engineering For Reliable ML Systems
slug: ml-systems/data-engineering
summary: Design data contracts, validation, lineage, leakage prevention, dataset versions, and monitoring around learned behavior.
track: ML Systems
topic: Foundations
difficulty: practitioner
tags: [data-engineering, lineage, validation, leakage]
prerequisites: [The ML workflow]
diagramRefs: []
sourceRefs: [harvard-vol1-data-engineering]
status: published
---

## Primary reading

Read Harvard’s [Data Engineering chapter](https://mlsysbook.ai/vol1/data_engineering/data_engineering.html). This companion turns the chapter into a concrete pipeline review.

## Data is executable behavior

Training data shapes the program the model learns. Treat schemas, labels, transformations, sampling rules, and split logic as versioned production assets. A dataset name without provenance is not a reproducible input.

## Contracts and validation

Validate structure, types, ranges, missingness, uniqueness, temporal ordering, category changes, and cross-field invariants. Distinguish a hard contract violation from a distribution warning. Quarantine invalid records rather than silently coercing them when the correction is ambiguous.

## Leakage and split strategy

Choose splits that represent deployment. Random splitting can leak users, time, locations, or near-duplicates across partitions. Write down what information is available at prediction time and reject features that depend on the future.

## Lineage and transformations

Track source, extraction time, transformation code, parameters, output version, and consumers. Make offline and online feature definitions consistent or measure their skew. Cache expensive transformations only with a clear invalidation key.

## Monitor the pipeline and population

Monitor freshness, volume, schema, label delay, distribution movement, and slice coverage. Drift is a signal to investigate, not automatic proof of harm. Connect changes to model and mission outcomes before retraining blindly.

## Practical output

Design a pipeline contract for one dataset. Include the grain of a row, keys, event time, labels, five validations, split strategy, lineage fields, and a response to late or corrected data.

