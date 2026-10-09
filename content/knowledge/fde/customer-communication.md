---
title: "Customer Communication And Product Feedback"
slug: "fde/customer-communication"
summary: "Lead technical decisions through concise updates, credible demos, scope negotiation and actionable field feedback."
track: "Forward Deployed Engineering"
topic: "Customer Communication And Product Feedback"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-openai-role", "fde-palantir-role"]
status: "published"
---

FDE communication should help someone make a decision or take an action. Technical accuracy matters, but an exhaustive explanation can still fail if the owner, recommendation or deadline is hidden.

## Write updates people can use

Use five lines: outcome sought, evidence since last update, blocker or uncertainty, recommended next action, decision owner and date. Adapt depth to the audience. An operator needs workflow impact; an engineer needs a reproducible failure; a sponsor needs options and consequences. Keep a shared decision log so a hallway conversation does not silently become a requirement.

Example: “The synthetic lookup handles the three agreed ticket types and denies cross-tenant reads. We have not tested the customer's staging API because its service account is pending. We can demo the fixture on Friday, or move integration acceptance until access is available. I recommend the fixture review plus a separate staging gate. The customer engineering lead owns the access decision by Thursday.”

This update separates demonstrated behavior from unresolved delivery. It does not disguise the fixture as production integration.

## Demonstrate a workflow, including its limits

Open with the user's problem and show a before/after task. Name the environment and data. Use a realistic example, then show an exception, the source evidence and the fallback. End with the decision you need. Rehearse a dependency outage and keep a clearly labeled recording or fixture as a backup. Never imply the backup is live.

During disagreement, restate the shared outcome, identify the conflicting constraint, offer two or three choices and recommend one. Say what evidence could change your recommendation. If you do not know an answer, state what you will verify and when you will return. Avoid guessing to maintain apparent authority.

## Turn custom work into product learning

A useful field report contains: customer workflow, frequency and severity, smallest reproduction, expected versus observed behavior, versions, safe logs, workaround, business consequence and how broadly the need appears. Keep customer-specific data out of a public issue. Route evidence through the approved channel and distinguish a product defect from configuration, documentation or training gaps.

Before generalizing a feature, compare at least two meaningfully different use cases where possible. Look for a shared invariant and the differences that should remain configuration or adapters. One urgent request is evidence of one customer's need, not proof of market demand. Conversely, avoid dismissing field work as bespoke before understanding its recurring pattern.

## Practice

Take the stale-order incident from the previous unit and produce three versions: a 75-word sponsor update, a five-step engineer reproduction with synthetic data, and a one-screen operator notice. Include uncertainty and the next action in each. Record a five-minute demo showing normal, denied and stale cases.

Role-play a sponsor asking you to bypass security to meet a date. Offer a reduced data scope, a synthetic demonstration or a revised date with the required reviewer. Explain the delivery consequence calmly and preserve the authorization boundary.

## Review your work

Does every update contain something its reader can decide or do? Are promises within your control? Does your product report let another engineer reproduce the issue? Useful habits include writing the decision first, ending meetings with owners, using explicit dates and asking the customer to correct your summary.

## Sources and further study

- [Forward Deployed Engineer — Singapore](https://openai.com/careers/forward-deployed-engineer-singapore-singapore/): Dated role example: discovery, delivery, adoption and product feedback. Requirements vary by posting.
- [Forward Deployed Software Engineer](https://jobs.lever.co/palantir/dab396d4-2f14-4796-aac0-0d82883dccf0): Employer role description: customer collaboration, data and hands-on software delivery; not an interview specification.
