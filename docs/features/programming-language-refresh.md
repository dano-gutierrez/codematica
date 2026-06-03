# Programming Language Refresh

## Snapshot

- Status: `shipped`
- Last updated: `2026-06-02`
- Owner thread: `n/a`
- Current state: Python ships as the first senior language-refresh path for TypeScript and JavaScript engineers, with questionnaires, a passive flashcard feed, and a final interview-practice unit linked to the existing interview catalog.
- Target outcome: Users can search Python refresh docs, follow a path, complete transient mobile questionnaires, review a path-scoped flashcard feed, and apply Python concepts to existing senior interview problems without auth or Supabase.
- Code touchpoints:
  - `content/knowledge/programming/python-*.md`
  - `content/exercises/programming/python-*.json`
  - `content/flashcard-feeds/python-for-ts-js-engineers.json`
  - `content/learning-paths/python-for-ts-js-engineers.json`
  - `src/components/PassiveFlashcardFeed.tsx`
  - `src/components/QuestionnaireSession.tsx`
  - `src/components/InterviewQuestionSession.tsx`
  - `src/app/interviews/**/page.tsx`
- Primary tests:
  - `src/lib/content/index.test.ts`
  - `src/lib/practice/questionnaire.test.ts`
  - `src/lib/flashcards/passive.test.ts`
  - `src/components/PracticeCard.test.tsx`
  - `src/components/PassiveFlashcardFeed.test.tsx`
  - `e2e/specs/python-refresh.regression.spec.ts`

## One-Minute Brief

Language refresh paths are skill paths that teach one programming language from the perspective of engineers already senior in a neighboring ecosystem. The first shipped path is Python for TypeScript and JavaScript engineers. It focuses on similarities, differences, migration traps, senior review standards, and production pain points.

## Outcome / Contract

- Python refresh content is canonical Markdown under `content/knowledge/programming/` and is searchable through `/browse`.
- Python practice is canonical questionnaire JSON under `content/exercises/programming/`.
- Python passive review cards are canonical feed JSON under `content/flashcard-feeds/`.
- The path `python-for-ts-js-engineers` alternates each Markdown document with a questionnaire for the same concept, then ends with a Python interview-practice unit.
- The passive feed route is `/paths/python-for-ts-js-engineers/flashcards`.
- The interview-practice unit uses existing interview routes with `?path=python-for-ts-js-engineers` so completed solutions can continue to the next path node.
- Questionnaires are local-only, randomized per attempt, one question per screen, and do not store score, completion, streaks, or progress.
- Passive flashcards are local-only, use the shared highlighted code theme for snippet cards, and do not store read state, mastery, score, streaks, or progress.
- Python guidance should stay aligned with official Python and PyPA references when docs are updated.

## Python V1 Content

- `python-runtime-model`: names and bindings, mutability, truthiness, exceptions, data model hooks, and imports.
- `python-types-and-contracts`: gradual typing, `Any`, annotations, dataclasses, protocols, and runtime validation.
- `python-packaging-environments`: `pyproject.toml`, virtual environments, dependency grouping, import/package names, lockfiles, and project layout.
- `python-async-testing-production`: `asyncio`, blocking work, test boundaries, style standards, timeouts, and production maintainability.

Each questionnaire has ten senior-level questions and includes `choice`, `cloze`, `ordering`, and `matching` question kinds.

The passive feed contains 480 senior cards for short mobile refresh sessions. Cards are balanced across `concept`, `practical`, `snippet`, and `interview` types and cover runtime behavior, data model protocols, collections, typing/contracts, packaging, async, testing, production maintainability, and theoretical interview prompts.

The final path unit, `python-interview-practice`, links to existing senior interview prompts that naturally exercise professional Python:

- `amazon/lru-cache`
- `airbnb/in-memory-file-system`
- `airbnb/alien-dictionary`
- `google/word-ladder`
- `microsoft/serialize-deserialize-binary-tree`
- `netflix/auto-expire-cache`
- `uber/shortest-path-weighted-road-graph`

## Reference Anchors

- [Python docs](https://docs.python.org/3/)
- [Python typing docs](https://docs.python.org/3/library/typing.html)
- [Python type system specification](https://typing.python.org/en/latest/spec/concepts.html)
- [PyPA Packaging User Guide](https://packaging.python.org/en/latest/)
- [PyPA specifications](https://packaging.python.org/en/latest/specifications/)
- [PEP 8](https://peps.python.org/pep-0008/)

## Test Plan

- Unit: questionnaire randomization, answer checking, and passive flashcard windowing.
- Integration: generated index loads Python docs, path nodes, interview nodes, questionnaire routes, passive feed routes, and path-scoped next-node routes.
- Component: questionnaire renders one question at a time and shows immediate feedback.
- E2E: mobile user opens the Python path, searches Python docs, completes a deterministic questionnaire attempt, reviews flashcards, opens a path-scoped interview problem, and follows the next path node.

## Assumptions

- Language refresh content remains local-first Markdown plus structured JSON until hosted authoring or durable progress exists.
- Python v1 is intentionally senior-level and written for TypeScript/JavaScript engineers, not absolute beginners.
- New language refresh paths should reuse the questionnaire type for active practice and the passive feed type for scroll-only review instead of adding one-off route surfaces.
