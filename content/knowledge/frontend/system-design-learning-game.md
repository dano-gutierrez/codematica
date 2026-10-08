---
title: Amazon — Picture-and-Word Learning Game
slug: frontend/system-design-learning-game
summary: Design a mobile-first picture-and-word learning app with answer feedback and session progress.
track: Front-End Development
topic: System Design Interviews
difficulty: senior
tags: [frontend, system-design, interview, whiteboard, practice]
sourceRefs: [frontend-design-report-amazon]
status: published
---

An Amazon FEE L5 candidate reported two learning workflows: choose the picture matching a word, and type the word matching a picture. The discussion also covered architecture and asset delivery. [Candidate report](https://www.reddit.com/r/cscareerquestions/comments/1iudddy/rainforest_loop_experience_frontend_l5_12_yoe/)

Company attribution and interview details are not independently verified. Sources checked October 8, 2026. The prompt is paraphrased; practice constraints, follow-ups, diagrams, and review criteria are Codematica additions unless labeled as reported.

## Practice prompt

Design a mobile-first learning app with both question types, answer feedback, and session progress.

Use the [60-minute schedule and rubric](/docs/frontend/system-design-interview-rehearsal). Spend 45 minutes designing, 10 minutes handling follow-ups, and 5 minutes reviewing. No coding is required.

- **Define:** question types, answer state, grading ownership, image loading, and progress persistence.
- **Draw:** the session controller, question renderers, asset delivery, and progress API.

## Follow-ups

An image fails to load. The user reloads after answering. A submission times out. Offline practice becomes required.

## Self-review

Can you add a question type without duplicating the session workflow? Can retrying a submission award progress twice?

## Starting diagram

Use this state diagram as a starting point. Extend it to show reload and an uncertain submission outcome.

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Answering: Question ready
    Loading --> LoadError: Load failed
    LoadError --> Loading: Retry
    Answering --> Submitting: Submit
    Submitting --> Feedback: Grading result
    Submitting --> Answering: Failure, retain answer
    Feedback --> Loading: Next question
    Feedback --> Complete: Session finished
```

[Start the guided rehearsal](/practice/frontend/system-design-learning-game-lab?path=frontend-system-design-interviews). Record a prediction, check your evidence, and reflect. Completion is self-assessed; it is not an architecture grade.
