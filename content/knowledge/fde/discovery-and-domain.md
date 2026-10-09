---
title: "Customer Discovery And Domain Modeling"
slug: "fde/discovery-and-domain"
summary: "Turn a vague customer request into a verified workflow, stakeholder map, domain model and delivery brief."
track: "Forward Deployed Engineering"
topic: "Customer Discovery And Domain Modeling"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-openai-role", "fde-palantir-role"]
status: "published"
---

A request such as “build us an AI assistant” is a proposed solution. Your first task is to understand who does what, with which information, and what goes wrong. Treat stakeholder statements as claims to investigate. Observe an actual workflow with permission, or use the fictional exercise below.

## Run a useful discovery session

Open with a decision: “By the end, we should agree which workflow to investigate and who can verify it.” Ask the operator to walk through the last concrete instance. What triggered it? Which tools and spreadsheets were used? Where was information missing? Who could approve an exception? How did they know the work was complete? Ask about frequency, severity and rework before discussing architecture.

Map the operator, sponsor, domain expert, customer engineer, security reviewer, data owner and operational owner. A sponsor can fund a pilot while lacking authority to grant data access. A daily user can identify friction while lacking procurement authority. Record decisions and access approvals with the person empowered to make them.

Create a current-state flow: trigger → inputs → decisions → actions → evidence → exceptions. Label manual steps and waits separately; reducing computation time does little when most delay comes from an approval queue. Build a glossary with examples and counterexamples. “Closed” might mean an agent answered, a user confirmed resolution, or a ticket was automatically timed out. These are different events.

## Worked fictional discovery

Northstar Parts receives 120 support tickets per day. A sponsor requests automatic replies within two weeks. An operator reports that shipment answers require three systems, timestamps disagree, and warranty exceptions require approval. No baseline has been collected. The data owner can provide synthetic exports immediately; production access is unresolved.

A defensible first slice is an internal order-status lookup with source timestamps and a human-reviewed draft. Automatic refunds and warranty decisions stay outside the pilot. A sample of twenty observed or simulated cases can help discover categories; it cannot establish a precise population-wide savings estimate.

Write the brief before building:

```text
User and decision: support agent answering order-status questions
Observed friction: reconcile three sources and identify stale status
Evidence: walkthrough notes; baseline timing still pending
First slice: authorized lookup, timestamps, cited draft, human sends
Not included: refunds, warranty approval, autonomous outbound messages
Data owner / access status: named owner; synthetic export available
Success measure: eligible handling time plus accuracy and reopen rate
Decision owner / next review: named sponsor; end-of-week scope review
Uncertainty to resolve: which system owns shipment state?
```

## Practice

Run a 45-minute role-play: ten minutes on workflow, ten on exception cases, ten on data and permissions, ten on scope, five on playback. Give the “customer” the Northstar facts and let them reveal facts only when asked. A solo learner can record an initial brief, then reveal the constraints one by one and revise it. Never present simulated interviews as actual customer research.

Deliver a one-page brief, a stakeholder/decision table, ten domain terms and a current-state diagram. End with a playback: “Here is what I heard, what is still unknown, and the next decision.” Ask the role-play partner to correct it. Use the guided discovery lab to record the evidence checklist.

## Review your work

Your brief should connect a specific operator to a decision, name a baseline owner, and expose unresolved access. Watch for leading questions, designing while the customer speaks, accepting a manager's account as the whole workflow, and treating every requested feature as a commitment. A strong discovery artifact is small enough for the customer to correct.

## Sources and further study

- [Forward Deployed Engineer — Singapore](https://openai.com/careers/forward-deployed-engineer-singapore-singapore/): Dated role example: discovery, delivery, adoption and product feedback. Requirements vary by posting.
- [Forward Deployed Software Engineer](https://jobs.lever.co/palantir/dab396d4-2f14-4796-aac0-0d82883dccf0): Employer role description: customer collaboration, data and hands-on software delivery; not an interview specification.
