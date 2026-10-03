# Feature Docs

Use one file per durable product feature. Keep PR summaries and temporary task lists elsewhere.

Each doc should help a new task answer:

- What is the feature supposed to do?
- What is already implemented versus still planned?
- Which files are most likely to matter?
- Which behaviors must not regress?
- Which tests should be trusted or added?

## Reading Order For Threads

When a thread picks up feature work:

1. Read the `Snapshot` section only.
2. Read `One-Minute Brief`.
3. Read `Current State` and `Outcome / Contract`.
4. Open the listed `Code Touchpoints`.
5. Use `Thread Handoff Prompt` when you want to continue in a fresh thread.

Most threads should not need the full document before they start exploring code.

## What Makes A Good Feature Doc

- The `Snapshot` fits on one screen.
- It distinguishes current behavior from target behavior.
- It lists concrete file paths instead of generic subsystems.
- It names edge cases and non-goals explicitly.
- It links behavior to tests.
- Its test plan identifies the lowest proving layer, E2E classification, coverage impact, and local release commands.
- It ends with a copy-pasteable handoff prompt for another thread.

## What To Update After A Change

Update the feature doc in the same branch when any of these change:

- User-visible behavior
- Data model or persistence expectations
- Key code touchpoints
- Test coverage expectations
- Known gaps, assumptions, or open questions
- Status such as `proposed`, `in_progress`, or `shipped`
- Coverage scope or exclusions, smoke/regression classification, database assertions, or native Maestro flows

Also update `docs/README.md` and any nested README that owns the changed area when a feature adds or changes folders, workflows, commands, conventions, integrations, or durable documentation surfaces.

## Status Meanings

- `proposed`: documented target behavior, not fully implemented
- `in_progress`: partially implemented, likely mismatches between docs and code
- `shipped`: intended behavior is live and the doc should mostly match code
- `needs_audit`: behavior exists but the doc may be stale or incomplete

## Recommended Structure

Follow `docs/features/_template.md`.

The most important sections are:

- `Snapshot`
- `Outcome / Contract`
- `Code Touchpoints`
- `Test Plan`
- `Thread Handoff Prompt`

## Feature References

- [Design system](design-system.md): shared web controls, semantic colors, spacing, alignment, borders, typography, and concise disclosure patterns. Read before new UI work.

- `rtk-query-interview-preparation.md` owns the RTK Query interview curriculum and its source/version refresh and validation contract.

- `linkedin-editorial.md`: private admin web/native post review, durable refinement/scheduling queue and exact-revision human approvals.

- [Frontend Interview Practice](frontend-interview-practice.md): seven guided frontend challenges, TS/Python companions, quizzes, and review. Existing material corrections are recorded in the interview catalog audit.
