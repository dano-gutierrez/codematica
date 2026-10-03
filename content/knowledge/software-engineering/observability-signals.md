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

Observability is how quickly and confidently an engineer can answer a new production question without shipping code. Telemetry volume alone does not establish it.

In a design review, ask for the debugging path. If a payment submission slows down, which graph moves first? If queue latency grows, can we tell whether producers, consumers, dependencies, or retries are responsible? If a single tenant reports bad data, can we follow one request across boundaries?

## Signal Roles

- Metrics should expose aggregate health and symptoms worth alerting on.
- Traces should explain request shape, fan-out, latency distribution, and dependency cost.
- Logs should preserve high-cardinality facts and decisions unsuitable for metrics.
- Domain events should record business transitions for later operational and analytical review.

Start with user-visible service-level indicators: availability, correctness, latency, durability, and freshness where those are product promises. Set an SLO and alert on error-budget burn over both fast and slow windows. Infrastructure saturation and dependency errors explain symptoms, but they should not replace the symptom-based page.

Use RED—rate, errors, duration—for request-driven services and USE—utilization, saturation, errors—for constrained resources. These are starting lenses, not mandatory dashboard templates.

## Correlation, Cardinality, And Sampling

Propagate trace context through HTTP, queues, scheduled jobs, and retries. Keep correlation IDs in logs, but do not put unbounded user IDs, request IDs, URLs, or exception messages into metric labels. High-cardinality dimensions belong in traces or logs with explicit cost and privacy controls.

Head sampling is cheap but can discard rare failures before they are known. Tail sampling can retain errors and slow traces after observing an entire trace, at higher buffering and operational cost. Record the sampling decision and rate so aggregate analysis can account for the incomplete population.

## What To Avoid

Avoid indiscriminate object logging and dashboards of unowned implementation details. Alert on symptoms before causes unless a cause is highly predictive and actionable.

Do not log secrets, session tokens, authorization headers, raw payment data, or unrestricted payloads. Redaction at query time is too late: shape or exclude sensitive telemetry before export, then define access, retention, and deletion rules.

## Senior-Level Acceptance Bar

A production-ready design should include:

- User-facing SLOs and the service indicators behind them.
- A cardinality plan for labels, tenant IDs, and request IDs.
- Trace propagation across sync and async boundaries.
- Logs that explain decisions, not just errors.
- A retention policy that matches incident timelines and cost limits.
- Runbooks, dashboard ownership, and a tested path from an alert to a deploy, rollback, or escalation decision.

## Design Review Prompt

Ask the team to narrate one incident from symptom to root cause using only the proposed telemetry. Weak designs usually fail this exercise before implementation begins.

## Reference Anchors

- [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/)
- [Google SRE Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Prometheus instrumentation: labels](https://prometheus.io/docs/practices/instrumentation/#use-labels)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
