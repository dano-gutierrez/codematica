# <Feature Name>

## Snapshot

- Status: `proposed | in_progress | shipped | needs_audit`
- Last updated: `YYYY-MM-DD`
- Owner thread: `<thread id or n/a>`
- Current state: `<one sentence about what exists today>`
- Target outcome: `<one sentence about what should be true when this feature is correct>`
- Code touchpoints:
  - `path/to/file`
  - `path/to/file`
  - `path/to/file`
- Primary tests:
  - `path/to/test`
  - `path/to/test`

Keep this section short enough that a new thread can read it before opening code.

## One-Minute Brief

Explain the feature in plain language. Answer:

- What user problem it solves
- What the main behavior is
- What should not change while implementing it

## Outcome / Contract

List the behavior that should be treated as the product contract. Prefer concrete statements over design discussion.

Examples:

- When `<condition>`, the UI shows `<behavior>`.
- If `<edge case>`, the system must `<behavior>`.
- The feature must not silently fall back from `<primary rule>` to `<old rule>`.

## Current State

Describe the current implementation status honestly.

- What already exists
- What is missing
- What is ambiguous or stale

If the doc describes target behavior that is not yet live, say that directly here.

## Scope

### In Scope

- `<behavior or subsystem>`
- `<behavior or subsystem>`

### Out Of Scope

- `<explicit non-goal>`
- `<explicit non-goal>`

### Assumptions

- `<assumption>`
- `<assumption>`

## Detailed Behavior

### UI / UX

- `<user-facing interaction>`
- `<visibility, affordance, or layout rule>`

### Data Model And Persistence

- `<types or persisted fields>`
- `<normalization, cleanup, or migration expectations>`

### Business Logic

- `<ordering, dependency, readiness, or generation rules>`
- `<special cases or forbidden fallbacks>`

### Failure And Edge Handling

- `<delete / unlink / stale state behavior>`
- `<retry / no-op / blocked state behavior>`

## Code Touchpoints

List the most relevant files and why they matter.

- `path/to/file`: `<role in the feature>`
- `path/to/file`: `<role in the feature>`
- `path/to/file`: `<role in the feature>`

Prefer paths that a new thread can open immediately. Avoid naming abstract layers without files.

## Test Plan

- Unit: `<what should be covered>`
- Integration: `<what should be covered>`
- E2E: `<what should be covered, if applicable>`

If there are must-not-regress cases, list them explicitly.

## Open Questions

- `<question>`
- `<question>`

Keep unanswered questions here instead of mixing them into the contract.

## Decision Log

- `YYYY-MM-DD`: `<decision or clarification>`
- `YYYY-MM-DD`: `<decision or clarification>`

## Documentation Updates

- `docs/README.md`: `<whether this feature changes the docs hub, workflows, or reading order>`
- Nested READMEs: `<which existing README files need updates, or n/a>`
- `docs/engineering-overview.md`: `<whether architecture, Mermaid diagrams, or repo-level flow changed>`

## Thread Handoff Prompt

Use this when continuing in a fresh Codex thread:

`Read docs/codex-context.md and docs/features/<feature>.md first. Compare the documented contract against the current code touchpoints, implement or audit the remaining gaps, update the feature doc and relevant README files, and call out any doc/code mismatches explicitly.`
