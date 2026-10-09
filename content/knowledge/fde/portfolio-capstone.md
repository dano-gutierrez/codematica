---
title: "FDE Portfolio Capstone: Northstar Support Operations"
slug: "fde/portfolio-capstone"
summary: "Deliver an original customer-workflow project with synthetic data, secure integration, evaluation, operational evidence and a credible handover."
track: "Forward Deployed Engineering"
topic: "FDE Portfolio Capstone: Northstar Support Operations"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-aws-idempotency", "fde-owasp-authorization", "fde-google-slos"]
status: "published"
---

Build a fictional internal support workbench for Northstar Parts. An operator looks up an order, sees current evidence, drafts a status response and records a reviewed disposition. Use synthetic data, a local database and fake external adapters. A model API is optional; deterministic templates are a valid baseline. No live customer or paid service is required.

## Fix the initial contract

Create two tenants with three operators each. Give each tenant ten orders and twenty tickets; order IDs may repeat across tenants. Include missing orders, stale shipment records, duplicated events, out-of-order updates and a failed adapter. Create twelve short policy documents using the AI unit's categories. Save a manifest with stable IDs and expected fixture outcomes.

The first release performs authorized reads and saves local reviewed drafts. It sends no customer messages, refunds nothing and changes no real order. Treat those as separate future capabilities requiring different contracts. Select Python or TypeScript for the backend, a familiar UI and SQLite or a disposable PostgreSQL instance. Tool choice matters less than explaining the correctness and delivery decisions.

## Build in four increments

1. **Discovery and baseline, 3–4 hours.** Write the customer brief, glossary, stakeholder map and value hypothesis. Time a manual lookup over ten fixed tasks. Label your own timing as a local observation, not a customer outcome.
2. **Working slice, 6–8 hours.** Implement tenant-scoped lookup, an evidence panel with timestamps, a template draft, review action and explicit denied/stale/error states. Add deterministic tests before implementing permission and receipt rules.
3. **Failure and evaluation, 4–6 hours.** Inject duplicate delivery, response loss, stale source and permission revocation. Run the forty-case evaluation from the evaluation unit. If using a model, record version/configuration and costs without committing credentials.
4. **Delivery and defense, 3–5 hours.** Package a local deployment, verify safe startup in the final artifact, run a recovery drill, record a five-minute demo and perform a maintainer teach-back.

The 16–23 hour range is an authored estimate for a narrow project; learners adding unfamiliar tooling should budget longer. The guided capstone activity tracks evidence, not an automatic code review.

## Acceptance matrix

| Scenario | Required evidence |
| --- | --- |
| Tenant A requests B's ticket | Denial before data is returned, logged or supplied to a model |
| Same scoped operation repeated | One accepted local intent; stable replay response |
| Same key, different payload | Explicit conflict; original intent preserved |
| Adapter applies work then times out | Unknown state followed by fake-provider reconciliation |
| Source is stale | Timestamp and unavailable/review behavior; no invented status |
| Missing or contradictory policy | Abstention or escalation with the reason |
| Dependency unavailable on startup | Failed readiness or documented safe degraded mode |
| Another maintainer operates it | Reproducible setup and successful recovery from the runbook |

These fixture gates do not certify security, statistical model quality or production capacity. Record what was tested and what remains unverified.

## Package a reviewable portfolio

Include `README`, setup instructions, architecture decision records, data manifest, source citations, tests, evaluation results, limitations, runbook, demo and a short impact memo. In the impact memo, separate assumptions, synthetic observations and actual user feedback. Publish only content you have rights to share; use anonymized or synthetic work instead of private employer artifacts.

Alternative project domains can use the same deliverables: reconcile warehouse orders, triage internal developer incidents, or assist equipment-maintenance planning. Keep consequential external actions out of the initial slice and preserve the permission and recovery exercises.

## Practice

Use the capstone guided lab. Ask a peer to change one requirement mid-build, such as a second data owner or a stricter freshness bound. Record the scope decision and adapt one vertical slice. Then let the peer trigger a failure without telling you which one.

## Review your work

A reviewer should be able to reproduce the demo, inspect one denied operation, challenge a design decision and recover the application. The strongest portfolio explains a difficult tradeoff and evidence of learning, rather than presenting an unqualified success story.

## Sources and further study

- [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): Malcolm Featonby, Amazon Builders Library. Selected client intent, atomicity and parameter mismatch guidance.
- [API1:2023 Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/): OWASP API Security Top 10, 2023 edition. Object/action authorization and regression testing.
- [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/): Google Site Reliability Engineering book. Selected user-facing indicators and objective definitions.
