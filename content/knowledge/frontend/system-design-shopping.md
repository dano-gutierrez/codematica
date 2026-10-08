---
title: Wayfair — Shopping Application
slug: frontend/system-design-shopping
summary: Design a storefront with product discovery, reviews, and a persistent cart.
track: Front-End Development
topic: System Design Interviews
difficulty: senior
tags: [frontend, system-design, interview, whiteboard, practice]
sourceRefs: [frontend-design-report-wayfair]
status: published
---

A candidate reports an August 2024 frontend interview, published December 30, 2025, covering product listings, ratings, cart state, persistence, and inventory updates. [Candidate report](https://saumyadip25.medium.com/wayfair-software-engineer-3-frontend-interview-experience-13112d221611)

Company attribution and interview details are not independently verified. Sources checked October 8, 2026. The prompt is paraphrased; practice constraints, follow-ups, diagrams, and review criteria are Codematica additions unless labeled as reported.

## Practice prompt

Design a storefront with product discovery, reviews, and a persistent cart.

Use the [60-minute schedule and rubric](/docs/frontend/system-design-interview-rehearsal). Spend 45 minutes designing, 10 minutes handling follow-ups, and 5 minutes reviewing. No coding is required.

- **Define:** products versus purchasable variants, cart lines, quantities, prices, and availability.
- **Draw:** listing → product detail → cart, showing URL state, cached server data, and unsaved interaction state.

## Follow-ups

A guest signs in with an existing account cart. A product sells out. Prices change. Two browser tabs update the cart.

## Self-review

State the cart merge policy. Explain which values the server must validate before purchase and how the UI communicates changes without silently discarding user choices.

**Decision to defend:** Which routes benefit from server-rendered HTML, and which interactions should remain client-driven?

[Start the guided rehearsal](/practice/frontend/system-design-shopping-lab?path=frontend-system-design-interviews). Record a prediction, check your evidence, and reflect. Completion is self-assessed; it is not an architecture grade.
