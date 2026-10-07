# Private Interview Preparation

## Snapshot

- Status: `implemented`
- Last updated: `2026-10-04`
- Owner thread: `n/a`
- Current state: Private web/native tracker, shared contracts/store, migration, local CLI and installed Codex skill are implemented; local validation is recorded below; hosted rollout remains separate.
- Target outcome: Find every tracked company, prepare for its roles and interviewers, and reuse relevant learning material without exposing personal research.
- Code touchpoints: `packages/core/src/interview-preparation.ts`, `apps/web/src/components/InterviewPreparationAdmin.tsx`, `packages/ui/src/InterviewPreparationScreen.tsx`, `scripts/interview-preparation/`, `.agents/skills/prepare-interview/`, migration `202610040001`.
- Primary tests: shared preparation/store tests, workflow tests, web/native screen tests, interview pgTAP and Playwright regressions.

## One-Minute Brief

Admin → Interview preparation groups private opportunities by company. Roles, rounds, interviewer profiles, resume context and versioned preparation live in optional Supabase. The Codex skill researches and personalizes preparation, always applies technical-edit, and imports an immutable brief. Anonymous learning remains local-first.

## Outcome / Contract

- `/admin/interview-preparation` exists on web and native and requires membership in `private.app_admins`. RLS and RPCs enforce access; navigation visibility is convenience only.
- Every brief has company/business/competitors, role fit/stories, likely questions/answer approaches, questions to ask, study/rehearsal, and assumptions/unresolved questions.
- Questions cover business health and competitive differentiation as well as technical/team/role expectations. Predicted questions remain distinct from reported candidate accounts.
- Every generated or refreshed preparation output receives the repository technical-edit skill before delivery or storage. Initial research/drafting precedes editing. Citations, uncertainty, technical literals, code and supported experience facts survive the comparison.
- Supabase preserves profile and brief revisions. Changed opportunity/round/profile versions require fresh preparation. Graph snapshot changes also mark assessed preparation stale.
- Finalization records actual skill and prose hashes and an operator comparison attestation. Mechanical checks cannot independently prove that editing happened, preserve every semantic fact, or establish claim accuracy.
- Prepared status requires a current accepted saved knowledge report bound to the edited body. Pending assessment is a readable draft. Model completion never supplies human acceptance.
- Private briefs enter the private-inclusive knowledge catalog; full resume/profile text does not. Public reusable lessons require anonymization and explicit review/authoring authorization.

## Current State

The implementation is stacked on knowledge evaluator PR #16. It reuses the Button implementation and control styles from design PR #15 without merging that branch's unrelated LinkedIn redesign. Both PRs remain independent review work. Real companies and resume content are intentionally absent from fixtures and the initial collection. The skill is maintained in-repo and installed under the operator's personal Codex skills directory.

## Scope

### In Scope

Private companies/opportunities/rounds, resume and evidenced project context, immutable briefs, search/status/preparation filters, archive/outcomes, Markdown export, local import/backup/context/finalization, private graph cataloging, and reviewed reusable-content proposals through the existing knowledge workflow.

### Out Of Scope

Always-on generation, recruiter outreach, automatic public authoring, hosted rollout, native store submission, and importing undocumented assumptions about past employment or achievements.

### Assumptions

One personal admin context shared by allowlisted accounts. A resume can start empty; missing context must be explicit. Roles under the same exact company name and website share the company identity. The company website disambiguates same-name organizations.

## Detailed Behavior

### UI / UX

The quiet light layout follows the design-system contract. Web groups roles by company, shows the next future round, and uses available container width for collection/detail panes. Small screens show the selected detail and Back to companies. Shared named Button/Dropdown controls, wrapped text, focus outlines and phone-safe padding remain accessible. Editing requires save or explicit discard; private forms preserve failed input.

Native uses 48 dp labeled controls, system font scaling and the shared keyboard-aware AppScreen. It exposes the same fields, status/preparation filters, revision selection and Markdown sharing. Native Markdown export shares the exact saved document text through the OS share sheet. Web downloads a `.md` file. Dates are entered with a UTC offset and an IANA display timezone; blank dates are allowed.

A new opportunity's company and position defaults are editable placeholders. Your experience accepts plain resume text and project-story prose containing evidence links. Knowledge-resource links open existing study routes. Generation is initiated in Codex using the displayed opportunity ID. Import accepts the skill's structured package, not arbitrary Markdown.

### Data Model And Persistence

Additive tables: `interview_companies`, `interview_opportunities`, `interview_rounds`, `interview_profiles`, `interview_briefs`; private request identities serialize retry-safe operations. Profile/brief update and deletion triggers preserve immutable history. Saving an opportunity replaces its current round projection within the same transaction and increments the opportunity version. Profile saves append a version. Snapshots include all profile revisions for private backup; each brief also retains the original opportunity input. Archive retains all records.

RPCs: `interview_snapshot`, `interview_save`, `interview_save_profile`, `interview_import`, `interview_assess`. Authenticated clients cannot write tables directly. Service credentials are confined to the local CLI. Every RPC checks admin or service-role access. Global transaction serialization protects profile/opportunity input checks and imports. Expected versions reject stale edits. Request keys bind the original payload; changed retries fail.

A brief stores six Markdown sections, citations/dates/source kinds, curriculum references with hashes and literal evidence, knowledge status/report bindings and technical-edit provenance. Markdown is derived from the selected saved revision. No private brief enters the public generated content index.

### Business Logic

The skill exports current context, verifies current company/interviewer research, drafts all sections, retrieves existing study resources, applies technical-edit and compares the entire draft. Finalization validates metadata and protected literals and computes hashes. Import rechecks edited-body identity, current profile/opportunity versions and resource evidence. `assess` queues the edited complete body through the existing knowledge worker; Admin → Knowledge supplies explicit human report review. Accepted report IDs must match the current snapshot and exact candidate body at import.

Private knowledge resources use `interview-preparation:<opportunity>` for the latest revision and `@revision:<revision>` for history. Resources retain visibility, revision identity and prose hashes. Only referenced curriculum evidence produces learning links; source/profile text is not bulk-exported. Reusable lessons are proposed separately in Admin → Knowledge after anonymization and technical editing; proposals never publish themselves.

### Failure And Edge Handling

Unconfigured Supabase shows an unavailable state. Non-admin users never load tracker snapshots. Account changes clear private state and ignore delayed reads/mutation completions. Failed saves/imports preserve input and retry identity; corrected payloads receive a new identity. The current edited prose must match its finalization hash. Invalid or stale evidence fails import. An unavailable evaluator leaves pending warnings; existing briefs remain readable. Missing technical-edit blocks completed output.

## Code Touchpoints

- Shared contracts/store: validation, client RPC boundary, access epochs, guarded editing and export.
- Web/native admin screens: collection, forms, details, study links and exports.
- CLI/skill/knowledge integration: private context, research workflow, finalization, catalog identity and human review bindings.

## Test Plan

- Unit/integration: required sections, editing receipt, metadata/code/link/number preservation, input freshness, export, safe URLs, retry identity, access-change races and private catalog exclusion of resume content.
- Database: transactional pgTAP for access/RLS, atomic round saves, payload-bound retries, version conflicts, immutable history, editing hashes, accepted graph evidence and archive retention. Replay every migration in a fresh database using `scripts/interview-preparation/test-database.py`; never reset an existing developer database.
- Web/native: create/edit/profile/import/detail/history/export, failed saves, denied access, sign-out and unsaved-input protection. Browser classification is `@regression`; navigation remains `@smoke`. Maestro uses a disposable admin account and test database.
- Required commands: targeted Vitest/Jest, skill validator, lint, all typechecks, aggregate/per-file coverage, mobile coverage, content freshness, Expo Doctor, clean database replay, production build, isolated interview Playwright and public smoke, and pruned HTTP artifact readiness.
- New workflow code and native screen are instrumented. Coverage floors/exclusions remain unchanged. The local CLI and database harness compose tested domain code and transactional assertions.
- Hosted migration application, installed-device acceptance, actual company research and deployment readiness are separate from source/browser/database checks.

### Local acceptance on 2026-10-04

The full Vitest suite passes (679 tests), with aggregate and per-file coverage gates preserved. Native Jest passes 151 tests with coverage. The interview browser lane passes six tests across desktop Chrome, mobile Chrome and iPhone WebKit, including Axe and horizontal-overflow assertions; the public smoke lane passes fifteen tests. All migrations and transactional pgTAP suites replay in a fresh local database, including accepted-report, evidence-route/skill, privacy, immutable-context and retry checks. Typecheck, lint, content freshness, Expo Doctor and both skill validators pass. The synthetic CLI finalization/validation check uses the real technical-edit source and private file permissions. A clean production-only install of the final Next artifact reaches HTTP readiness and serves public and private admin shells; artifact scanning keeps service credentials and local worker code outside HTTP bundles.

Evidence is retained under ignored `.local/interview-preparation/validation/`. No hosted data or real company/resume fixture was created. Installed-device Maestro acceptance and hosted migration rollout remain required before their respective release/deployment claims.

## Open Questions

- Populate the real candidate profile and company opportunities through the private UI.
- Confirm installed-device accessibility and account lifecycle before native release readiness.

## Decision Log

- `2026-10-04`: Supabase with Markdown export; web/native parity; skill-driven generation; empty initial collection; private profile and briefs with reviewed anonymized public reuse.
- `2026-10-04`: Always apply technical-edit after drafting and before saving/delivering every preparation output. Export already edited saved revisions unchanged.

## Documentation Updates

Docs hub, architecture/context guides, design reference, core/UI/mobile/Supabase/testing/knowledge READMEs and changelog link the feature. The operating runbook owns CLI commands and rollout gates.

## Thread Handoff Prompt

Read this contract and the interview-preparation runbook. Preserve privacy, immutable revisions, required preparation sections, mandatory technical-edit and explicit human knowledge review. Check input/graph freshness, inspect current validation evidence and distinguish local acceptance from hosted deployment and installed-device readiness.
