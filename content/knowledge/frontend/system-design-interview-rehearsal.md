---
title: Frontend System Design Interview Rehearsal
slug: frontend/system-design-interview-rehearsal
summary: Run six source-attributed whiteboard rehearsals with a 60-minute schedule, explicit evidence limits, and a shared self-review rubric.
track: Front-End Development
topic: System Design Interviews
difficulty: senior
tags: [frontend, system-design, interview, whiteboard, practice]
sourceRefs: [frontend-design-report-amazon, frontend-design-report-atlassian, frontend-design-report-wayfair, frontend-design-report-adobe, frontend-design-report-salesforce, frontend-design-report-uber]
status: published
---

Start with the [Frontend System Design Interview Guide](/docs/frontend/system-design-interview-guide?path=frontend-system-design-interviews) for architecture decisions and illustrated examples. This lesson supplies the schedule and rubric for the six guided rehearsals.

Practice six frontend system design interviews using public candidate accounts. Company attribution and interview details are not independently verified. Sources were checked October 8, 2026; a check date does not establish that a company still asks a question. These are reported preparation topics, not an official question bank.

Prompts are paraphrased. Practice constraints, follow-ups, diagrams, and review criteria are Codematica additions unless labeled as reported. Adobe’s file-manager scope and Uber’s frontend calendar scope are adaptations. No source article, employer solution, or hiring rubric is reproduced.

## Run a 60-minute rehearsal

Spend **45 minutes designing, 10 minutes handling follow-ups, and 5 minutes reviewing**. Use your own timer and drawing tool; no coding is required. Test screen sharing before a remote mock. Produce a component diagram, a data model, API contracts, and one failure-recovery flow.

| Time | Activity | Evidence |
| --- | --- | --- |
| 0–7 minutes | Clarify the main journeys and constraints. | Requirements, assumptions, and exclusions |
| 7–20 minutes | Draw components and state owners. | Responsibilities and interaction contracts |
| 20–30 minutes | Define the data and APIs. | Identities, reads, writes, caching, and consistency |
| 30–45 minutes | Trace an interaction and a failure. | A usable recovery path and its limits |
| 45–55 minutes | Introduce the exercise’s follow-ups. | Decisions that must change and why |
| 55–60 minutes | Score the evidence and choose a retry focus. | One weak dimension and a concrete improvement |

Keep the discussion collaborative and let the interviewer redirect it. For a solo attempt, stop reading at the follow-ups until minute 45. Use the starting diagrams as prompts to challenge, not complete solutions.

## Exercises

- [Amazon — Picture-and-Word Learning Game](/docs/frontend/system-design-learning-game?path=frontend-system-design-interviews)
- [Atlassian — Collaborative Kanban Board](/docs/frontend/system-design-kanban?path=frontend-system-design-interviews)
- [Wayfair — Shopping Application](/docs/frontend/system-design-shopping?path=frontend-system-design-interviews)
- [Adobe — Browser File Manager](/docs/frontend/system-design-file-manager?path=frontend-system-design-interviews)
- [Salesforce — WhatsApp-Style Web Messaging](/docs/frontend/system-design-messaging?path=frontend-system-design-interviews)
- [Uber — Calendar Application](/docs/frontend/system-design-calendar?path=frontend-system-design-interviews)

## Review evidence

Score each dimension **0: missing, 1: mentioned, 2: explained with a concrete decision and consequence**. This is a practice rubric, not an employer hiring threshold.

| Dimension | Evidence to look for |
| --- | --- |
| Scope | Clear journeys, assumptions, and exclusions |
| Components | Responsibilities and interaction contracts |
| State and data | Explicit owners, identities, and invariants |
| APIs and consistency | Read/write contracts, caching, and reconciliation |
| Failure recovery | A complete failure path with usable recovery |
| Quality and trade-offs | Accessibility, performance, measurement, and alternatives |

After each attempt, choose the weakest dimension and redraw that part. On the next attempt, introduce a follow-up halfway through and explain which decisions must change.

The guided labs are not automatically graded and do not certify interview readiness. Select a prediction, perform the rehearsal, then check only evidence you can show. The app stores coarse completion; reflection text stays transient and is lost on reload or restart. Keep diagrams and any notes you want to retain in your own tool.
