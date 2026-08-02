---
title: Langfuse Prompts Datasets And Evals
slug: ai-engineering/langfuse-prompts-datasets-evals
summary: How prompt management, datasets, experiments, and scores turn LLM iteration into an engineering feedback loop.
track: AI Engineering
topic: Evaluation
difficulty: senior
tags:
  - langfuse
  - prompts
  - evaluation
  - datasets
  - experiments
prerequisites:
  - Langfuse tracing fundamentals
  - Basic test design
diagramRefs: []
status: published
---

## Evaluation Lens

Prompt changes are product changes. A small wording update can change tone, refusal behavior, citation quality, token usage, latency, and safety. Langfuse prompt management and evaluation features help teams move from "try a prompt and hope" to a measured release loop.

The feedback loop is:

1. Version the prompt.
2. Link prompt usage to traces.
3. Collect examples in a dataset.
4. Run experiments across prompt or model variants.
5. Score outputs with humans, code, or LLM-as-a-judge evaluators.
6. Promote a version only when it improves the right metrics.

## Prompt Management

Prompt management gives prompts names, versions, labels, and deployment control. That matters because prompts are not just copy. They encode product policy and operational behavior.

Use prompt management when:

- product, support, safety, or engineering stakeholders need to review prompt changes
- prompts differ by environment
- prompt performance must be compared across versions
- traces should show which prompt version produced an output

Do not hide prompt changes in anonymous string literals scattered across code. That makes rollback and evaluation harder.

## Datasets

A dataset is a set of inputs and expected outputs or review expectations. It can come from curated examples, synthetic examples, or production traces that humans mark as important.

Good dataset items are specific:

- user input
- relevant context or source ids
- expected behavior
- unacceptable behavior
- metadata such as language, region, tenant type, or risk category

Avoid building a dataset that only contains easy happy paths. A useful evaluation set includes ambiguity, missing context, adversarial wording, policy boundaries, and previously failed traces.

## Scores

Scores turn outputs into reviewable signals. Langfuse supports different score shapes, including numeric, categorical, boolean, and text. Choose the simplest score that supports the decision.

Examples:

- `grounded: true | false`
- `citation_quality: poor | acceptable | strong`
- `toxicity_risk: 0..1`
- `human_review_note: text`

One score rarely proves quality. A support assistant might track groundedness, helpfulness, policy compliance, and escalation correctness separately.

## Experiments

Experiments compare prompt versions or model choices against a dataset. They are useful before releasing a change and after production traces reveal a weakness.

A healthy experiment has:

- a named hypothesis
- a stable dataset
- a current baseline
- clear score definitions
- a decision rule

Example hypothesis: "Prompt v12 should reduce unsupported refund claims without making correct refund answers less helpful."

## Evaluation Validity

Evaluation code is production code. Keep a held-out set that prompt authors do not tune against, version datasets and rubric changes, and report uncertainty instead of only averages. Slice results by language, request type, risk class, and input length so a large easy segment cannot hide a serious regression.

LLM-as-a-judge is useful for scale, not an unquestionable oracle. Calibrate judges against blinded human review, randomize presentation order when comparing variants, test for verbosity and self-preference bias, and keep deterministic checks for properties such as schema validity, exact citations, latency, and tool permissions. Never let the same untrusted output rewrite the rubric that judges it.

## Real-Life Case: Prompt Regression

A team changes a prompt to be friendlier. Human review likes the tone, but the experiment shows answers are longer, costlier, and less likely to cite policy sections. The prompt improved one dimension and regressed two others.

That is not a failure of evaluation. That is evaluation doing its job before users pay the cost.

## Coding Challenge: Score A Support Answer

This is a non-executable challenge for the future code editor.

Starter code:

```ts
type AnswerReview = {
  answer: string;
  citedSourceIds: string[];
  requiredSourceIds: string[];
  escalated: boolean;
};

export function scoreGrounding(review: AnswerReview): "pass" | "warn" | "fail" {
  // implement
}
```

Acceptance checks:

- return `fail` when the answer has no cited sources and did not escalate
- return `warn` when some but not all required sources were cited
- return `pass` when all required sources were cited
- return `pass` when the answer escalated instead of answering from missing sources

## Senior Review Bar

Senior teams decide what "better" means before running the experiment. Principal teams connect scores to product risk: user harm, legal risk, support cost, latency budget, and model spend.

## Reference Anchors

- [Langfuse prompt management](https://langfuse.com/docs)
- [Langfuse evaluation overview](https://langfuse.com/docs/evaluation/overview)
- [Langfuse datasets](https://langfuse.com/docs/evaluation/experiments/datasets)
- [Langfuse experiments via UI](https://langfuse.com/docs/evaluation/experiments/experiments-via-ui)
- [Langfuse scores via SDK](https://langfuse.com/docs/evaluation/evaluation-methods/scores-via-sdk)
