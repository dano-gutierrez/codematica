---
title: "Adoption, Enablement And Sustainable Handover"
slug: "fde/adoption-and-handover"
summary: "Measure useful behavior, train operators and transfer a deployed workflow without creating permanent dependence on its builder."
track: "Forward Deployed Engineering"
topic: "Adoption, Enablement And Sustainable Handover"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-openai-role", "fde-morgan-stanley", "fde-intercom"]
status: "published"
---

Shipping creates an opportunity for value. Adoption determines whether people use it; correct task completion determines whether that use helps. An FDE should investigate why an operator returns to an old spreadsheet before assuming the answer is more training.

## Define an adoption funnel

For one workflow, track eligible users → users with access → trained users → weekly active users → completed eligible tasks → successful outcomes. Define each event, observation window and denominator. Logging in once is not sustained adoption. High usage can reflect compulsory use or repeated failed attempts, so pair it with outcome and experience measures.

Example: 100 eligible agents, 80 with access, 60 trained and 30 active this week. Activation among eligible agents is 30%; among trained agents it is 50%. Both describe something real but answer different questions. Fifty successfully assisted tasks out of 100 attempted tasks is a task metric, not an employee adoption rate.

Interview non-users, occasional users and regular users. Check whether workflow placement, trust, speed, missing permissions, hidden exceptions or incentives explain behavior. Avoid measuring only enthusiastic pilot champions. Give operators a fast way to report wrong answers and missing features with appropriate privacy controls.

## Train people on judgment

Show one normal task, one exception and one failure. Have the operator perform a fresh example while you observe; this teach-back reveals misunderstandings a slide presentation misses. Explain when to trust evidence, when to verify, when to escalate and how to return to the previous workflow safely.

Prepare a short operator guide and a separate maintainer runbook. The operator needs task steps and escalation. The maintainer needs configuration, deployment, tests, dashboards, recovery, permissions and dependency ownership. Record known limitations in the workflow where they matter, not only in a long document.

## Measure success without hiding rework

Define “resolved” with the customer: does a ticket need no reopen within seven days, user confirmation, or a completed action? Pick a definition before comparing systems. Report repeat contacts, human correction and escalations alongside nominal resolution. Historical customer stories use their own definitions; do not silently treat them as your metric specification.

Distinguish adoption, quality, operational reliability and economic value in the review. An adopted system can still be inaccurate. An accurate system can fail to fit daily work. A time saving can create capacity without reducing expenditure. Present each measurement with its population and limitations.

## Practice

Conduct a mock onboarding for two peers or two recorded personas. One trusts the system too much; the other refuses to use it after a single stale answer. Teach each a normal and exception workflow. Record confusion, revise the guide and repeat the task.

Build a handover checklist covering named owner, access, deployment, monitoring, incident route, maintenance budget, data retention decisions and a scheduled review. Ask the maintainer to recover from a fake dependency outage using only your runbook. If they cannot, identify the missing instruction or product affordance before ending the engagement.

## Review your work

Does the adoption report explain who could have used the tool but did not? Can another person operate and support it without your presence? Sustainable delivery leaves the customer with capability and an understandable support boundary.

## Sources and further study

- [Forward Deployed Engineer — Singapore](https://openai.com/careers/forward-deployed-engineer-singapore-singapore/): Dated role example: discovery, delivery, adoption and product feedback. Requirements vary by posting.
- [Morgan Stanley uses AI evals to shape the future of financial services](https://openai.com/index/morgan-stanley/): December 4, 2024 customer story. Adoption and evaluation claims are vendor-reported, not independently audited.
- [Intercom provides customer service tech that delivers up to 86% resolution rates with Claude](https://www.anthropic.com/customers/intercom): Vendor customer story inspected October 7, 2026. Historical reported average and maximum are distinct, not current product guarantees.
