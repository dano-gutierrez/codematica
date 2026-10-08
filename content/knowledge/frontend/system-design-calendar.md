---
title: Uber — Calendar Application
slug: frontend/system-design-calendar
summary: Design a calendar with month/week views, event creation, editing, and recurring meetings.
track: Front-End Development
topic: System Design Interviews
difficulty: senior
tags: [frontend, system-design, interview, whiteboard, practice]
sourceRefs: [frontend-design-report-uber]
status: published
---

An Uber L4 candidate reported calendar system design alongside React coding exercises and described difficulty keeping the discussion focused. The frontend scope below is a Codematica adaptation. [Candidate report](https://leetcode.com/discuss/post/1746929/uber-l4-nyc-did-not-get-offer/)

Company attribution and interview details are not independently verified. Sources checked October 8, 2026. The prompt is paraphrased; practice constraints, follow-ups, diagrams, and review criteria are Codematica additions unless labeled as reported.

## Practice prompt

Design a calendar with month/week views, event creation, editing, and recurring meetings.

Use the [60-minute schedule and rubric](/docs/frontend/system-design-interview-rehearsal). Spend 45 minutes designing, 10 minutes handling follow-ups, and 5 minutes reviewing. No coding is required.

- **Define:** event identity, time zone, recurrence rules, exceptions, and the visible date range.
- **Draw:** the calendar shell, date navigation, event layout, editor, and range-based data fetching.

## Follow-ups

Edit one occurrence versus the series. Change time zones. Cross a daylight-saving transition. Resolve two users editing the same event.

## Self-review

Separate stored event semantics from display formatting. Explain overlapping-event layout, cache updates, and keyboard navigation.

[Start the guided rehearsal](/practice/frontend/system-design-calendar-lab?path=frontend-system-design-interviews). Record a prediction, check your evidence, and reflect. Completion is self-assessed; it is not an architecture grade.
