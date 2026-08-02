# LLM Application Engineering

## Snapshot

- Status: `shipped`
- Last updated: `2026-08-02`
- Owner thread: `n/a`
- Current state: Codematica ships a local-first Langfuse and LangChain skill path with Markdown lessons, Mermaid diagrams, questionnaires, and passive flashcards.
- Target outcome: Users can learn LLM application architecture, LangChain, LangGraph, Langfuse tracing, prompt evaluation, RAG quality, and production risk governance without Supabase or executable code challenges.
- Code touchpoints:
  - `content/knowledge/ai-engineering/*.md`
  - `content/diagrams/ai-engineering/*.{mmd,mermaid}`
  - `content/exercises/ai-engineering/*.json`
  - `content/learning-paths/ai-engineering-langfuse-langchain.json`
  - `content/flashcard-feeds/ai-engineering-langfuse-langchain.json`
- Primary tests:
  - `packages/core/src/content/index.test.ts`
  - `packages/core/src/search.test.ts`
  - `apps/web/e2e/specs/ai-engineering.regression.spec.ts`

## One-Minute Brief

This feature adds a beginner-to-principal AI engineering path centered on production LLM applications. It teaches the practical system around model calls: prompts, retrieval, tools, tracing, prompt versions, datasets, experiments, scores, agents, human approval, and risk governance.

The path is content-only in this milestone. Coding challenges are authored as readable challenge sections and quiz reinforcement, but they are not executable until a future code editor and challenge schema exist. Evaluation guidance separates retrieval quality from answer quality, treats citation presence as weaker than claim-level support, and requires judge calibration against human review.

## Outcome / Contract

- The published path slug is `ai-engineering-langfuse-langchain`.
- The path title is `Langfuse And LangChain AI Engineering`.
- Canonical lessons live under `content/knowledge/ai-engineering/`.
- Canonical diagrams live under `content/diagrams/ai-engineering/`.
- Canonical questionnaires live under `content/exercises/ai-engineering/`.
- The passive feed route is `/paths/ai-engineering-langfuse-langchain/flashcards`.
- Lessons include reference anchors to primary or standards-oriented sources.
- No Supabase credentials, hosted search, auth, durable progress, or executable code editor behavior is required.

## Current State

The feature is shipped as local content and generated-index data. The app reuses existing path, document, diagram, questionnaire, and passive flashcard routes; no new UI component, schema, migration, or backend dependency was added.

## Content Contract

- Lessons should start with a beginner-friendly mental model and progress to practitioner, senior, or principal review standards.
- Langfuse is the primary platform for observability, prompt management, datasets, experiments, and scores.
- LangChain and LangGraph are taught as engineering building blocks for models, tools, RAG, agents, durability, streaming, persistence, and human-in-the-loop control.
- Risk guidance should align with OWASP LLM risks and NIST AI RMF concepts without turning the path into compliance paperwork.
- Coding challenge sections must clearly say they are non-executable in this milestone and include starter code plus acceptance checks for future editor support.

## Code Touchpoints

- `content/knowledge/ai-engineering/*.md`: source lessons and non-executable coding challenge sections.
- `content/learning-paths/ai-engineering-langfuse-langchain.json`: ordered path units and nodes.
- `content/exercises/ai-engineering/*.json`: active questionnaires for the path.
- `content/flashcard-feeds/ai-engineering-langfuse-langchain.json`: passive review cards.
- `packages/core/src/generated/content-index.json`: regenerated local runtime index.

## Test Plan

- Unit/integration: generated index loads the path, ordered nodes, published documents, questionnaires, diagrams, passive feed, and next-node route.
- Search: generated local index finds Langfuse, LangChain, RAG, and prompt evaluation documents.
- E2E: mobile user opens the path, reads the Langfuse tracing lesson, completes the deterministic tracing questionnaire, and opens the passive flashcard feed.

## Reference Anchors

- [Langfuse overview](https://langfuse.com/docs)
- [Langfuse instrumentation](https://langfuse.com/docs/observability/sdk/instrumentation)
- [Langfuse evaluation overview](https://langfuse.com/docs/evaluation/overview)
- [Langfuse datasets](https://langfuse.com/docs/evaluation/experiments/datasets)
- [LangChain agents](https://docs.langchain.com/oss/python/langchain/agents)
- [LangChain tools](https://docs.langchain.com/oss/python/langchain/tools)
- [LangChain RAG](https://docs.langchain.com/oss/python/langchain/rag)
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)
- [OWASP LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [NIST AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)

## Assumptions

- The first release is content-heavy, not platform-heavy.
- Future executable challenges will add or update schema and routes instead of overloading current questionnaire JSON.
- LangSmith may be mentioned only as LangChain's native platform when explaining ecosystem tradeoffs; this path teaches Langfuse as the primary observability and evaluation platform.

## Decision Log

- `2026-06-18`: Ship AI engineering as a local-first skill path using existing document, diagram, questionnaire, and passive flashcard contracts.
- `2026-06-18`: Author coding challenges as non-executable Markdown sections until the future code editor exists.

## Documentation Updates

- `docs/README.md`: Adds this feature doc to the feature map.
- Nested READMEs: Updates learning path, exercise, and flashcard feed authoring notes.
- `docs/engineering-overview.md`: Adds the AI engineering path to the content model and testing model.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/llm-application-engineering.md first. Compare the documented AI engineering path contract against content/knowledge/ai-engineering, content/exercises/ai-engineering, content/diagrams/ai-engineering, content/learning-paths/ai-engineering-langfuse-langchain.json, content/flashcard-feeds/ai-engineering-langfuse-langchain.json, packages/core/src/content/index.test.ts, packages/core/src/search.test.ts, and apps/web/e2e/specs/ai-engineering.regression.spec.ts, then update content, tests, generated index, and docs together.`
