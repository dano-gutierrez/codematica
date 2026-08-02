---
title: LLM Application Map For Engineers
slug: ai-engineering/llm-application-map
summary: A beginner-friendly map of models, prompts, retrieval, tools, traces, evaluations, cost, and safety in production LLM applications.
track: AI Engineering
topic: LLM Applications
difficulty: foundation
tags:
  - llm
  - ai-engineering
  - langfuse
  - langchain
  - observability
prerequisites:
  - HTTP APIs
  - JSON basics
diagramRefs:
  - ai-engineering/llm-observability-loop
status: published
---

## Beginner Lens

An LLM application is still an application. It receives input, decides what work to do, calls dependencies, handles errors, and returns a result. The new part is that one dependency is probabilistic: a model can produce useful language, but it can also be incomplete, overconfident, expensive, slow, or unsafe.

The core engineering move is to stop treating the model as magic. Build a product loop around it:

1. Define the user job.
2. Prepare the prompt and trusted context.
3. Call the model or agent.
4. Record what happened.
5. Evaluate the result.
6. Improve the prompt, retrieval, tools, or model choice.

LangChain helps you build model, retrieval, tool, and agent flows. Langfuse helps you see and improve those flows through traces, prompt versions, datasets, experiments, and scores.

## The Main Pieces

Models turn messages into completions. Prompts shape the task. Retrieval adds outside knowledge. Tools let the system take deterministic actions. Traces explain what happened. Evaluations decide whether the output was good enough.

The pieces are easy to name and hard to operate. A support chatbot that answers one question might use:

- a system prompt that defines tone and policy
- a user message from the customer
- retrieved help-center passages
- a tool that checks order status
- a model call that writes the answer
- a trace that records latency, cost, prompt version, retrieved sources, and output
- an evaluation dataset that catches regressions before the next prompt goes live

## Trust Boundaries

Treat every input as belonging to one of three buckets:

- **User-controlled:** user messages, uploaded files, browser-visible content, and external websites.
- **System-controlled:** system prompts, tool schemas, allowlists, and policy configuration.
- **Model-generated:** draft answers, tool arguments proposed by the model, summaries, classifications, and plans.

Never let model-generated data skip validation just because the model sounded confident. If the model proposes a tool call, the application still owns permission checks, schema validation, rate limits, and audit logs.

## Why Observability Comes Early

Traditional observability asks "what happened in production?" LLM observability also asks what input and context the model received, which model and prompt version ran, how much the call cost, and whether another tested configuration performs better. A trace can reconstruct inputs and operations; it does not reveal a model's private causal reasoning or prove why one token was chosen.

Record enough information to debug:

- the input shape and safe metadata
- prompt version or prompt label
- retrieved source identifiers
- tool names, arguments after validation, and results
- model name, latency, token usage, and cost
- final output and status
- evaluation scores or human annotations

Do not record secrets or unrestricted personal data by default. A useful trace is not an excuse to build a data leak.

## Engineering Levels

At the foundation level, know the vocabulary: prompt, context, retrieval, tool, trace, dataset, score, and experiment.

At the practitioner level, build a small flow that can be debugged from one request to one answer.

At the senior level, design trace metadata, evaluation datasets, fallbacks, and release gates before the feature reaches production.

At the principal level, connect the AI feature to risk management: privacy, misuse, vendor failure, model upgrades, incident response, and business metrics.

## Real-Life Case: Support Answer Assistant

A support team wants an assistant that answers refund questions. A weak implementation sends the user message directly to the model and hopes for the best.

A production implementation does more:

1. Classify the request as a refund-policy question.
2. Retrieve the current refund policy and regional exceptions.
3. Ask the model to answer only from retrieved sources.
4. Refuse or escalate when the sources do not answer the question.
5. Trace the prompt, source ids, model, token usage, latency, and final status.
6. Add failed or uncertain traces to a dataset.
7. Run prompt experiments before changing production behavior.

The difference is not the model call. The difference is the engineering loop around the model call.

## Coding Challenge: Map An LLM Request

This is a non-executable challenge for the future code editor.

Starter data:

```ts
type LlmEvent = {
  requestId: string;
  userId?: string;
  promptVersion: string;
  retrievedSourceIds: string[];
  toolNames: string[];
  model: string;
  inputTokens: number;
  outputTokens: number;
  status: "success" | "fallback" | "error";
};
```

Task:

Write a `summarizeRequest(event)` function that returns:

- the request id
- whether retrieval was used
- whether tools were used
- total token count
- a review label: `healthy`, `needs-review`, or `failed`

Acceptance checks:

- `status: "error"` always returns `failed`.
- `status: "fallback"` returns `needs-review`.
- successful requests above 8,000 total tokens return `needs-review`.
- other successful requests return `healthy`.

## Review Standard

Before shipping an LLM feature, ask:

- Can we replay what the model saw without exposing secrets?
- Can we explain why the answer changed after a prompt or model update?
- Can we find high-cost, high-latency, and low-quality traces?
- Can a human create or approve evaluation examples from production failures?
- Can the system fail closed when retrieval, tools, or policies are uncertain?

If the team cannot answer these questions, the feature is still a prototype.

## Reference Anchors

- [Langfuse overview](https://langfuse.com/docs)
- [Langfuse instrumentation](https://langfuse.com/docs/observability/sdk/instrumentation)
- [LangChain agents](https://docs.langchain.com/oss/python/langchain/agents)
- [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)
