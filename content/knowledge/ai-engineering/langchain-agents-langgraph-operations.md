---
title: LangChain Agents LangGraph And Operations
slug: ai-engineering/langchain-agents-langgraph-operations
summary: How to reason about LangChain agents, tool loops, LangGraph durability, human-in-the-loop workflows, and operational controls.
track: AI Engineering
topic: Agents
difficulty: senior
tags:
  - langchain
  - langgraph
  - agents
  - tools
  - operations
prerequisites:
  - LangChain models tools and RAG
  - Langfuse tracing fundamentals
diagramRefs:
  - ai-engineering/agent-tool-safety-flow
status: published
---

## Agent Lens

An agent is a system where the model can choose steps, often including tool calls. That flexibility is powerful, but it increases operational risk. The application still owns boundaries: available tools, tool schemas, approval gates, memory, retries, budgets, and audit trails.

LangChain provides agent building blocks and prebuilt loops. LangGraph focuses on durable execution, streaming, persistence, human-in-the-loop, and lower-level orchestration. Use LangChain when a prebuilt agent shape is enough. Use LangGraph when the workflow needs explicit state, checkpoints, interrupts, or long-running control.

## Workflow Or Agent

Use a workflow when the steps are known:

```text
classify -> retrieve -> draft -> check -> respond
```

Use an agent when the system genuinely needs dynamic choice:

```text
model decides whether to search docs, inspect an order, ask a clarifying question, or stop
```

The more freedom the model has, the more guardrails the application needs.

## Tool Safety

Tool safety starts before the model sees the tool.

Review each tool for:

- read or write capability
- data sensitivity
- cost
- rate limits
- authorization needs
- idempotency
- human approval requirement
- trace fields

Do not give an agent one "do anything" tool. Give it narrow tools that match product actions.

## LangGraph Operations

LangGraph is useful when agent execution must survive more than one simple request. Common needs include:

- checkpointed state
- short-term thread memory
- long-term application memory
- streaming events
- human approval interrupts
- time travel or replay for debugging
- explicit graph nodes for complex workflows

Durability changes the review standard. A workflow that can resume later must define which state is safe to persist, which tool calls are idempotent, and which approvals expire.

Checkpointing does not make side effects exactly-once. A process can perform an external write and crash before recording the successful checkpoint. Use idempotency keys, durable operation records, and reconciliation for money movement, messages, provisioning, and other external commitments. Resume logic must distinguish "not attempted" from "outcome unknown."

## Human-In-The-Loop

Human approval is not a weakness. It is the right design when a tool can spend money, send messages, change data, access sensitive records, or create external commitments.

A good approval step shows:

- what the user asked
- what the agent plans to do
- which tool will run
- validated tool arguments
- expected side effect
- rollback or cancellation option

Trace both the model proposal and the human decision.

## Real-Life Case: Billing Agent

A billing assistant can answer invoice questions and draft refund requests. It should not issue refunds without approval.

Safe design:

- read-only invoice lookup can run automatically after authorization
- refund draft tool creates a pending request only
- refund execution requires human approval
- every step is traced with request id, actor, tool, amount, and status
- failed tool calls are visible and do not trigger repeated charges

## Coding Challenge: Tool Permission Matrix

This is a non-executable challenge for the future code editor.

Starter code:

```ts
type Tool = "lookup_invoice" | "draft_refund" | "issue_refund";
type Role = "support-agent" | "billing-manager";

export function canRunTool(role: Role, tool: Tool, hasHumanApproval: boolean): boolean {
  // implement
}
```

Acceptance checks:

- support agents can run `lookup_invoice`
- support agents can run `draft_refund`
- support agents cannot run `issue_refund`
- billing managers can run `issue_refund` only with human approval
- no role can skip the approval rule for `issue_refund`

## Senior Review Bar

Senior agent design budgets tool calls, limits authority, records traces, and defines stopping conditions. Principal design adds organizational controls: approval policy, incident review, vendor fallback, prompt governance, and evaluation datasets for tool misuse.

## Reference Anchors

- [LangChain agents](https://docs.langchain.com/oss/python/langchain/agents)
- [LangChain tools](https://docs.langchain.com/oss/python/langchain/tools)
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
