---
title: Salesforce — WhatsApp-Style Web Messaging
slug: frontend/system-design-messaging
summary: Design a messaging client with conversation history, sending, delivery status, and reconnect recovery.
track: Front-End Development
topic: System Design Interviews
difficulty: senior
tags: [frontend, system-design, interview, whiteboard, practice]
sourceRefs: [frontend-design-report-salesforce]
status: published
---

A Salesforce SMTS frontend account published November 23, 2025 reports a 60-minute WhatsApp Web design round, with messaging, synchronization, offline support, and encryption considerations. [Candidate report](https://saumyadip25.medium.com/salesforce-smts-frontend-interview-experience-5cae01d6a594)

Company attribution and interview details are not independently verified. Sources checked October 8, 2026. The prompt is paraphrased; practice constraints, follow-ups, diagrams, and review criteria are Codematica additions unless labeled as reported.

## Practice prompt

Design a messaging client with conversation history, sending, delivery status, and reconnect recovery.

Use the [60-minute schedule and rubric](/docs/frontend/system-design-interview-rehearsal). Spend 45 minutes designing, 10 minutes handling follow-ups, and 5 minutes reviewing. No coding is required.

- **Define:** conversation IDs, message IDs, client operation IDs, ordering, and pending/confirmed/failed states.
- **Draw:** send → pending message → server acknowledgment → reconciliation, including a lost acknowledgment.

## Follow-ups

Retry after disconnection. Open another tab. Receive duplicates. Load earlier history while new messages arrive.

## Self-review

Distinguish server acceptance, recipient delivery, and reading. Explain deduplication, ordering, scroll preservation, and where encryption changes the client/server boundary.

[Start the guided rehearsal](/practice/frontend/system-design-messaging-lab?path=frontend-system-design-interviews). Record a prediction, check your evidence, and reflect. Completion is self-assessed; it is not an architecture grade.
