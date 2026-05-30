---
title: Observability Signals For System Design Reviews
slug: software-engineering/observability-signals
summary: A practical framework for choosing logs, metrics, traces, and events that prove a system is understandable under failure.
track: Software Engineering
topic: Observability
difficulty: senior
tags:
  - observability
  - operations
  - incident-response
  - architecture-review
prerequisites:
  - service-level objectives
  - distributed tracing
diagramRefs: []
status: published
---

## Review Lens

Observability is not the amount of telemetry a service emits. It is the speed and confidence with which an engineer can answer a novel production question without shipping new code.

In a design review, ask for the debugging path. If a payment submission slows down, which graph moves first? If queue latency grows, can we tell whether producers, consumers, dependencies, or retries are responsible? If a single tenant reports bad data, can we follow one request across boundaries?

## Signal Roles

Metrics should expose aggregate health and alertable symptoms. Traces should explain request shape, fan-out, latency distribution, and dependency cost. Logs should preserve high-cardinality facts and decisions that are not useful as metrics. Domain events should describe business transitions that operators and analysts can reason about later.

## What To Avoid

Do not log every object and call that observability. Do not create dashboards that mirror implementation details nobody owns. Do not alert on causes before symptoms unless the cause is highly predictive and actionable.

## Senior-Level Acceptance Bar

A production-ready design should include:

- User-facing SLOs and the service indicators behind them.
- A cardinality plan for labels, tenant IDs, and request IDs.
- Trace propagation across sync and async boundaries.
- Logs that explain decisions, not just errors.
- A retention policy that matches incident timelines and cost limits.

## Design Review Prompt

Ask the team to narrate one incident from symptom to root cause using only the proposed telemetry. Weak designs usually fail this exercise before implementation begins.
