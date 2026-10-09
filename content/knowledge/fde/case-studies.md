---
title: "FDE Case Studies: Outcomes And Evidence"
slug: "fde/case-studies"
summary: "Analyze three published customer stories and two fictional failure cases without confusing reported outcomes with transferable proof."
track: "Forward Deployed Engineering"
topic: "FDE Case Studies: Outcomes And Evidence"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-morgan-stanley", "fde-intercom", "fde-airbus-skywise"]
status: "published"
---

Customer stories help you identify delivery patterns and questions to investigate. They rarely provide a complete experiment, architecture or cost model. The three success studies below are vendor-reported accounts. They are not independently audited here and do not establish which work was performed by people with an FDE title. They are relevant examples of customer deployment work.

## Morgan Stanley: evaluation and adoption

[OpenAI's December 2024 account](https://openai.com/index/morgan-stanley/) describes an internal assistant for financial advisors, expert evaluation of responses and expansion into meeting summaries. It reports that over 98% of advisor teams used the assistant. That is an adoption claim about teams, not 98% answer accuracy, individual daily usage or causal proof of increased revenue.

Original review: identify the operator decision, permitted knowledge sources and domain-review role. Propose separate measures for supported answers, inappropriate answers, time spent searching and recurring use. Ask how usage was counted, what observation window applied, which teams were excluded and how review cost changed. Those questions are not answered merely by the headline adoption rate.

Practice transfer: design an internal policy assistant for fictional support agents. Define a held-out set, domain-review rubric and missing-evidence fallback before proposing rollout. Treat the financial-services setting as context, not permission to give financial advice or a compliance blueprint.

## Intercom: maximum versus average

[Anthropic's Intercom story](https://www.anthropic.com/customers/intercom) describes Fin support automation and testing changes against a production baseline. The inspected account reports a 51% average resolution rate out of the box and up to 86% for customer support volume. These are distinct reported statistics; the maximum is not a promised average for a new deployment.

Original review: ask how resolution was defined, whether later repeat contacts were counted, what traffic was eligible and how customer mix affected results. Consider whether escalation and human review costs change the economic interpretation. Published model comparisons are author claims, not a benchmark you independently reproduced.

Practice transfer: define “resolved” before building a support assistant. In your synthetic pilot, count reopened cases as failures under the declared seven-day rule. Compare a rules/template baseline and the candidate on identical cases. Show both aggregate and exception-category results.

## Airbus and easyJet: operational integration

[Airbus's March 2018 announcement](https://www.airbus.com/en/newsroom/press-releases/2018-03-easyjet-signs-skywise-predictive-maintenance-agreement-with-airbus) describes predictive-maintenance trials followed by an agreement for easyJet's fleet, approaching 300 aircraft. It identifies Skywise as developed in collaboration with Palantir. The release reports operational gains, while eliminating technical delays is framed as a long-term aim. The announcement does not demonstrate that all delays were eliminated or quantify causal fleet-wide savings.

Original review: trace sensor/maintenance data → a prediction → a human maintenance decision → a recorded operational outcome. Ask about data quality, missed faults, unnecessary replacements, decision authority and how predictions enter daily work. More data is useful only when the operational process can act appropriately on it.

Practice transfer: use fictional warehouse equipment with approved human maintenance decisions. Compare alert lead time and false alerts with a simple scheduled-inspection baseline. Do not present this toy as an aircraft-safety system.

## Two fictional failure studies

**The impressive demo nobody used.** A team delivers a chat interface after interviewing only the sponsor. Operators still need to copy every answer into a separate tool and cannot see source freshness. The remedy is workflow observation, integrated placement, visible evidence and a pilot with ordinary users. A stronger model alone does not remove duplicate work.

**The retry that duplicated a refund.** A service retries a timed-out write using a fresh operation key. The first request actually succeeded. The remedy is scoped operation identity, durable state, provider-supported idempotency or reconciliation, and explicit uncertainty when evidence is unavailable. A larger retry budget makes this failure worse.

## Practice

Write a one-page case analysis with seven fields: source/date, user/workflow, reported intervention, reported outcome/denominator, missing evidence, your transfer hypothesis, and an experiment that could disprove it. Pick one success case and one fictional failure. Label every number as reported, measured locally or assumed.

## Review your work

Did you preserve the original metric's unit? Did you separate plans from results and a maximum from an average? Can your transfer hypothesis fail a real test? Good case analysis produces questions and experiments, not borrowed performance promises.

## Sources and further study

- [Morgan Stanley uses AI evals to shape the future of financial services](https://openai.com/index/morgan-stanley/): December 4, 2024 customer story. Adoption and evaluation claims are vendor-reported, not independently audited.
- [Intercom provides customer service tech that delivers up to 86% resolution rates with Claude](https://www.anthropic.com/customers/intercom): Vendor customer story inspected October 7, 2026. Historical reported average and maximum are distinct, not current product guarantees.
- [easyJet signs Skywise Predictive Maintenance agreement with Airbus for its entire fleet](https://www.airbus.com/en/newsroom/press-releases/2018-03-easyjet-signs-skywise-predictive-maintenance-agreement-with-airbus): March 2018 press release: reported trial and fleet agreement; future plans and ambitions are not verified outcomes.
