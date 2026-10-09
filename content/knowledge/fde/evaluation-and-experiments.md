---
title: "Evaluation And Experimental Decisions"
slug: "fde/evaluation-and-experiments"
summary: "Create representative test sets, isolate failure modes and decide whether an AI or workflow change deserves rollout."
track: "Forward Deployed Engineering"
topic: "Evaluation And Experimental Decisions"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-morgan-stanley", "fde-google-slos"]
status: "published"
---

An evaluation is a decision instrument. Begin with the failure you are trying to detect and the decision its result will inform. Unit tests verify deterministic rules; offline evaluations probe examples; production monitoring observes actual use. None alone proves business impact.

## Assemble a useful evaluation set

For the fictional support workflow, record case ID, input, permitted sources, expected facts, expected action or abstention, customer segment, severity and rationale. Include routine cases, long-tail cases, missing data, stale data, conflicting evidence, denied access and adversarial document text. Separate a development set from a held-out set before tuning.

Ask domain reviewers to define an actionable rubric. For example: correct order identity, supported status, appropriate uncertainty, valid citations and no unauthorized information. Calibrate on a few examples and discuss disagreements. Preserve disagreement rather than forcing false certainty. A model judge can assist evaluation, but validate it against human judgments and inspect systematic errors; it is not an independent truth source.

## Use denominators and slices

A system gets 90 of 100 cases right, but fails all ten warranty exceptions. Reporting only 90% hides the exact population that may cause the greatest harm. Show results by workflow, language, tenant size or other relevant operational segment. Report the count behind each rate, severe failure counts and excluded cases. Repeating one example many times does not produce diverse coverage.

Measure latency and cost per successfully completed task, including retries, review and fallback. A cheaper model can increase total cost if it sends more work to humans. Accuracy, task success, adoption and financial value are separate quantities. The Morgan Stanley story offers an example of expert-informed evaluations accompanying deployment, not a universal acceptance threshold.

## Compare changes fairly

Hold inputs and rubric fixed when comparing two versions, and record model, prompt, corpus, retrieval configuration and application version. Inspect paired wins and losses, not just aggregate averages. Repeat stochastic cases where variation matters. Avoid tuning to the held-out set; once it becomes a development aid, create a fresh held-out set.

For a production pilot, start with shadow or advisory behavior where appropriate, then a limited authorized cohort. Choose the observation window and stop conditions before rollout. Randomized comparison can support stronger conclusions when feasible and ethically appropriate; before/after changes are vulnerable to workload mix, seasonal effects and operator learning. Be explicit about causal uncertainty.

## Practice

Author a forty-case evaluation: twenty development and twenty held out. Within each, include ten routine, four missing/stale evidence, three permission boundary and three exception cases. These small authored samples are training fixtures, not population estimates. Compare a template baseline with your candidate using a table of per-case judgments.

Introduce three regressions: remove source timestamps, omit permission filtering and alter an important policy sentence. Identify the cases that catch each mutation. If a regression changes nothing in the results, either your evaluation lacks coverage or your assertion is measuring the wrong behavior.

## Review your work

Can another reviewer reproduce a judgment? Are version changes and exclusions visible? Does your release decision protect critical slices even if the overall average improves? Preserve failed evaluation cases and explain what they changed in the design.

## Sources and further study

- [Morgan Stanley uses AI evals to shape the future of financial services](https://openai.com/index/morgan-stanley/): December 4, 2024 customer story. Adoption and evaluation claims are vendor-reported, not independently audited.
- [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/): Google Site Reliability Engineering book. Selected user-facing indicators and objective definitions.
