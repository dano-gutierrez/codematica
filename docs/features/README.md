# Feature Docs

Each file in this folder should describe one durable product feature, not one PR and not one temporary task list.

The goal is to let a new thread answer these questions quickly:

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
- It ends with a copy-pasteable handoff prompt for another thread.

## What To Update After A Change

Update the feature doc in the same branch when any of these changed:

- User-visible behavior
- Data model or persistence expectations
- Key code touchpoints
- Test coverage expectations
- Known gaps, assumptions, or open questions
- Status such as `proposed`, `in_progress`, or `shipped`

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
