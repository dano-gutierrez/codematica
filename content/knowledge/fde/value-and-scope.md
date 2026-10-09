---
title: "Value, Scope And Pilot Decisions"
slug: "fde/value-and-scope"
summary: "Choose a measurable pilot, calculate an honest value hypothesis and negotiate explicit delivery boundaries."
track: "Forward Deployed Engineering"
topic: "Value, Scope And Pilot Decisions"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-openai-role", "fde-google-slos"]
status: "published"
---

A useful pilot changes one observable workflow. It needs a baseline, a target population, a decision date, a decision owner and stop criteria. A list of features is insufficient because it cannot tell you whether the customer should continue investing.

## Calculate a value hypothesis

Use the fictional Northstar workload: 120 tickets/day, 60% eligible for the selected workflow, and a hypothesized five-minute reduction in handling time. Potential recovered capacity is 120 × 0.60 × 5 = 360 minutes, or six hours/day. At twenty working days this is 120 hours/month. If half the eligible work actually uses the tool, the modeled saving is sixty hours/month before training, review and rework costs.

These are assumptions, not observed results or cash savings. Recovered capacity becomes business value only if people use it effectively. Monetizing it requires an agreed cost model; subtract infrastructure, model calls, implementation, monitoring, maintenance and review effort. Separate one-time costs from recurring costs and show low/base/high adoption scenarios.

## Write a pilot decision contract

For an original practice pilot, define: thirty synthetic eligible tickets, at least 90% correct source-supported responses, zero cross-tenant disclosures in the security fixture, and a median handling-time comparison with the manual baseline. These are educational thresholds, not production acceptance standards. Explain why thirty cases provide limited statistical evidence.

For real delivery, negotiate representative sampling and risk-specific gates with the customer. Include exclusion rules before measuring. Track rejected and escalated tasks so a system cannot appear faster by avoiding hard work. Define a countermetric such as repeat contacts or operator correction rate. Google SRE's indicator/objective distinction is useful here: the measurement definition and the target are separate decisions.

## Control scope without losing trust

Split commitments into must-have for the pilot, useful next, and explicitly deferred. When a stakeholder adds refunds, say: “We can keep Friday's status-lookup pilot, replace the draft UI with refund discovery, or move the date after approval and reconciliation work. I recommend preserving the lookup pilot.” Attach consequences and a decision owner instead of saying yes and silently cutting quality.

Maintain a risk register: assumption, evidence, impact, probability estimate, owner, next check and mitigation. Include slow access, missing labels, low usage, unsupported platform behavior and limited customer engineering capacity. Estimate with ranges and milestones; the date of an unresolved external approval is not fully under your control.

## Practice

Create a two-week plan with five deliverables: brief, data contract, vertical slice, acceptance evidence and handover. Assign a decision owner to each. Add a midpoint review and an explicit stop when required data rights or operational ownership cannot be established. Recalculate the value model at 20%, 50% and 80% adoption: 24, 60 and 96 hours/month before overhead.

Then respond to a sponsor who wants all ticket categories in the same time. Give three options with a recommendation, what each excludes, and the earliest evidence that could change your choice. Keep the response under 150 words.

## Review your work

Can someone recompute every number? Are the denominator, observation window, baseline and exclusions explicit? Does the success criterion include correctness and sustained use? Avoid a vanity metric such as total model calls. The output is a testable investment hypothesis, not an ROI promise.

## Sources and further study

- [Forward Deployed Engineer — Singapore](https://openai.com/careers/forward-deployed-engineer-singapore-singapore/): Dated role example: discovery, delivery, adoption and product feedback. Requirements vary by posting.
- [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/): Google Site Reliability Engineering book. Selected user-facing indicators and objective definitions.
