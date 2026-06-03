---
title: Uber Real-Time Marketplace
slug: system-design/uber-realtime-marketplace
summary: A source-backed case study of how Uber connects marketplace events, real-time analytics, lakehouse data, and ML platforms for live decisions.
track: System Design
topic: Real Systems
difficulty: senior
tags:
  - real-systems
  - marketplaces
  - streaming
  - machine-learning
prerequisites:
  - event streaming
  - geospatial systems
  - machine learning platforms
diagramRefs:
  - system-design/uber-realtime-marketplace
  - system-design/streaming-feedback-blueprint
caseStudyFlowRef: system-design/uber-realtime-marketplace
status: published
---

## Core System Pressure

Uber is a live marketplace. Rider demand, driver supply, routes, traffic, fraud signals, Eats orders, and regional operations all change quickly. Decisions that are stale by minutes can produce bad ETAs, poor matching, weak fraud detection, or a marketplace imbalance.

The public architecture pattern is clear: events flow through Kafka, some streams are transformed with FlinkSQL, real-time OLAP is served by Pinot, large historical data lands in a lakehouse, and ML workflows are standardized through Michelangelo. The product lesson is that a marketplace needs both real-time awareness and deep historical learning.

## Architecture Map

The high-level shape is:

- Apps and backend services emit marketplace events.
- Kafka transports those events to real-time and offline consumers.
- FlinkSQL filters, joins, and pre-aggregates selected streams before Pinot ingestion.
- Pinot serves low-latency analytical tables for dashboards and product-facing applications.
- Hudi-backed lakehouse data keeps incremental history available for Spark, Presto, and ML workflows.
- Michelangelo trains, deploys, serves, and monitors models for production decisions.

The split lets Uber answer two different questions: "What is happening right now?" and "What patterns have we learned from many previous trips?"

## Streaming Path

Uber's Pinot post describes thousands of microservices writing logs and events to Kafka topics. Pinot can ingest some topics directly, while other topics go through FlinkSQL first when they need filtering, joins, or pre-aggregation.

That is the practical real-time OLAP pattern: keep the ingest path simple for streams that are already query-ready, and add stream processing only when it changes the serving shape. Pinot then gives dashboards and services a low-latency way to query demand, supply, delayed orders, abandoned carts, and operational signals.

## Batch And Warehouse Path

Uber's lakehouse path solves a different problem. Hudi was built at Uber for incremental ingestion, upserts, and large-scale data lake operations. Public Uber posts describe Hudi as central to data lake workloads across analytics and ML.

This offline path also corrects the real-time path. The Pinot article notes that curated offline data can overwrite inconsistent real-time data and improve accuracy. That is a valuable pattern for interviews: real-time data optimizes freshness, while offline data restores correctness when late or corrected facts arrive.

## ML And Product Feedback Loop

Michelangelo standardizes the ML lifecycle: data management, training, evaluation, deployment, prediction, and monitoring. Uber's DeepETA post shows the serving side of this pattern. A routing engine produces an ETA, then an ML model refines it using historical and real-time signals, with strict latency constraints.

Surge pricing should be described carefully. Uber's public marketplace page says prices update frequently and are tied to real-time supply and demand imbalance. This article does not assert a fixed update cadence. The design principle is that marketplace algorithms must use fresh supply-demand signals, but they also need controls, caps, and monitoring because pricing is user-facing.

## Failure Modes

- A Kafka topic can be fresh but not query-ready, causing downstream teams to duplicate transformations.
- A real-time table can be fast and wrong if late corrections never reconcile with the offline source.
- Pinot tenants can suffer noisy-neighbor effects if high-cardinality or bad queries are not isolated.
- ML features can drift when online prediction data and training data are generated differently.
- Pricing and matching loops can overreact when local supply-demand signals are sparse or noisy.

## Design Takeaways

- Use real-time OLAP for live marketplace visibility, not as the only source of truth.
- Keep an incremental lakehouse path for correction, replay, and long-range training.
- Treat ML feature generation as a shared platform concern, not per-team glue code.
- Build serving latency budgets into model design early.
- Make marketplace controls explicit because automated pricing and matching are product policy, not only algorithms.

## References

- [Operating Apache Pinot at Uber Scale](https://www.uber.com/us/en/blog/operating-apache-pinot/)
- [Apache Hudi at Uber: Engineering for Trillion-Record-Scale Data Lake Operations](https://www.uber.com/en-JP/blog/apache-hudi-at-uber/)
- [Meet Michelangelo: Uber's Machine Learning Platform](https://www.uber.com/en-IT/blog/michelangelo-machine-learning-platform/)
- [DeepETA: How Uber Predicts Arrival Times Using Deep Learning](https://www.uber.com/en-IE/blog/deepeta-how-uber-predicts-arrival-times/)
- [Uber Marketplace Surge Pricing](https://www.uber.com/us/en/marketplace/pricing/surge-pricing/)
