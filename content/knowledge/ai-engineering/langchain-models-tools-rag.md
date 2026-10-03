---
title: LangChain Models Tools And RAG
slug: ai-engineering/langchain-models-tools-rag
summary: A practical introduction to LangChain model calls, tool contracts, structured output, and retrieval augmented generation.
track: AI Engineering
topic: LangChain
difficulty: practitioner
tags:
  - langchain
  - rag
  - tools
  - structured-output
  - ai-engineering
prerequisites:
  - LLM application map
  - JSON schemas
diagramRefs: []
status: published
---

## Builder Lens

LangChain provides building blocks for workflows that combine chat models, prompt assembly, tools, structured output, retrieval, and agents.

Start with the smallest deterministic flow that solves the user's task. Add tool calling, retrieval, memory, and orchestration only when the product needs them.

## Model Calls

A model call has three parts:

- messages or prompt content
- model configuration
- response handling

Model calls need more than prompt text: define timeout behavior, retries, token budgets, output validation, error handling, and trace metadata.

```python
from langchain.agents import create_agent

agent = create_agent(
    model="openai:gpt-5.1",
    tools=[],
    system_prompt="Answer with concise engineering guidance.",
)

result = agent.invoke({
    "messages": [{"role": "user", "content": "Explain RAG in one paragraph."}]
})
```

Model names and providers can change. Test model invocation as application code.

## Tool Contracts

Tools let a model request data, search an index, run a calculation, or create an action request. The application controls the tool boundary.

Good tool contracts are narrow:

- clear name
- plain-language description
- explicit input schema
- deterministic output shape
- permission and rate-limit checks outside the model
- traceable arguments and results

Bad tool contracts are vague, powerful, and hard to audit.

```ts
import { tool } from "langchain";
import * as z from "zod";

const lookupPolicy = tool(
  async ({ policyId }) => {
    return await policies.getPublishedPolicy(policyId);
  },
  {
    name: "lookup_published_policy",
    description: "Fetch a published policy by stable id. Does not read drafts.",
    schema: z.object({ policyId: z.string().min(1) }),
  },
);
```

The model may choose when to request this tool, but it does not get to bypass the schema or read unpublished content.

## Structured Output

Structured output asks the model to return data that matches a schema. It is useful for extraction, classification, routing, and downstream automation.

Use structured output when the next step expects fields. The application must still validate the model's result.

Example shape:

```ts
type SupportIntent = {
  intent: "refund" | "billing" | "technical" | "unknown";
  confidence: number;
  escalationReason?: string;
};
```

Review questions:

- What happens when confidence is low?
- Which fields are allowed to drive actions?
- Which fields are only hints for a human or a later model call?

## RAG In Plain Terms

Retrieval augmented generation (RAG) gives the model relevant source material before it answers. The application retrieves trusted context so the model can use it instead of relying entirely on training.

Basic RAG flow:

1. Receive the user question.
2. Search trusted documents.
3. Select a small set of relevant passages.
4. Put the passages in the prompt with source identifiers.
5. Ask the model to answer from the passages.
6. Return citations or a fallback when sources are insufficient.
7. Trace the query, retrieved source ids, answer, and quality outcome.

## Real-Life Case: Internal Policy Assistant

An internal HR assistant answers policy questions. LangChain can organize the retrieval and model call. Langfuse can record the trace.

When retrieval fails, the assistant should say "I do not have enough policy context". Employees may act on its answer, so a fallback is safer than an unsupported claim.

## Coding Challenge: Safe Tool Router

This is a non-executable challenge for the future code editor.

Starter code:

```ts
type Intent = "read-policy" | "create-ticket" | "unknown";

type ToolDecision = {
  toolName?: "lookup_published_policy" | "draft_ticket";
  needsHumanApproval: boolean;
  reason: string;
};

export function chooseTool(intent: Intent, confidence: number): ToolDecision {
  // implement
}
```

Acceptance checks:

- `read-policy` with confidence `>= 0.75` uses `lookup_published_policy` without approval.
- `create-ticket` with confidence `>= 0.85` uses `draft_ticket` but still requires approval.
- low confidence or `unknown` uses no tool and returns a reason.
- the function never returns a write-capable tool without `needsHumanApproval: true`.

## Senior Review Bar

Make control flow and product decisions visible in code. Use small tools, validated outputs, fallbacks, trace metadata, and tests for low-confidence and missing-context cases.

## Reference Anchors

- [LangChain agents](https://docs.langchain.com/oss/python/langchain/agents)
- [LangChain tools](https://docs.langchain.com/oss/python/langchain/tools)
- [LangChain structured output](https://docs.langchain.com/oss/python/langchain/structured-output)
- [LangChain RAG](https://docs.langchain.com/oss/python/langchain/rag)
