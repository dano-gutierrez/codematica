---
title: "Operations, Debugging And Incident Leadership"
slug: "fde/operations-and-incidents"
summary: "Diagnose customer-facing failures through user signals, safe mitigation, structured communication and verified recovery."
track: "Forward Deployed Engineering"
topic: "Operations, Debugging And Incident Leadership"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-opentelemetry-signals", "fde-google-slos"]
status: "published"
---

Operational ownership begins before an incident. Decide which user journeys matter, how failure becomes visible and who responds. For Northstar, a healthy HTTP server is insufficient if shipment data is stale or agents cannot finish the lookup.

## Instrument the journey

Define an indicator as a measured quantity, an objective as its target over a window, and an alert as a rule that requests action. An example practice objective is “99% of eligible lookup requests return an authorized result or explicit unavailable state within two seconds over seven days.” This is an illustrative contract, not an appropriate target for every customer. A fast unavailable response may satisfy that responsiveness objective while violating a separate useful-result objective, so measure both.

Use request and operation identifiers to connect events. OpenTelemetry's traces describe request paths, metrics aggregate measurements, and logs record events. Collect source freshness, queue age, successful business operations, fallback frequency, repeated attempts, dependency latency and user-visible errors. Avoid raw customer content in telemetry. High-cardinality or identifying attributes require deliberate handling.

## Debug with hypotheses

Ask what changed, who is affected, when it began and which layer has contrary evidence. Reproduce with an approved minimal fixture. Trace browser → network → API → authorization → data → dependency. Common integration failures include DNS, certificate trust, proxy restrictions, expired credentials, incorrect scopes, clock skew, schema drift and quota exhaustion. Test one hypothesis at a time and record the result.

An error spike after deployment is evidence of correlation, not proof of cause. Compare cohorts and timestamps, inspect relevant traces and preserve failed inputs safely. Distinguish transport success from business acceptance and source availability from freshness.

## Run a fictional incident

At 10:05, twenty agents report old order statuses. API latency and availability are normal. The source export has not advanced for ninety minutes; a new exporter version shipped at 09:00. Stop showing stale information as current. Display the last source timestamp, offer the documented manual path, and escalate to the export owner. Roll back only when the rollback is compatible and authorized for the incident process.

Assign incident lead, technical investigator, communications owner and timeline scribe. Communicate confirmed impact, current mitigation, uncertainty and the next update time. Do not promise an ETA without evidence. Verify recovery with fresh source data and successful user workflows, then observe the agreed stability window. A restarted process alone does not establish recovery.

## Practice

Run a 30-minute tabletop. At minute ten, reveal that tenant B works but tenant A is stale. At minute twenty, reveal that the exporter is healthy but permission changes blocked one source. Revise your hypothesis and mitigation without rewriting the timeline to make your first guess look correct.

Deliver a timeline, three hypotheses with evidence, a user update and a short review. Separate trigger, contributing conditions, impact, mitigation, confirmed recovery and unknowns. Assign follow-ups to owners with a way to verify completion; “be more careful” is not a corrective action.

## Review your work

Could an on-call engineer act on your alert? Can the customer tell what is known and when they will hear more? Did you preserve evidence without exposing sensitive data? Effective incident leadership reduces harm and ambiguity while the technical investigation continues.

## Sources and further study

- [OpenTelemetry Signals](https://opentelemetry.io/docs/concepts/signals/): Selected trace, metric and log definitions; no SDK version or deployment recipe is implied.
- [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/): Google Site Reliability Engineering book. Selected user-facing indicators and objective definitions.
