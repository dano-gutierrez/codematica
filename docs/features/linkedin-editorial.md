# LinkedIn Editorial Workflow

## Snapshot

- Status: `in_progress`
- Last updated: `2026-10-03`
- Owner thread: `n/a`
- Current state: Admin web/native screens, hosted Supabase persistence, fixed prompt, local worker CLI and 100 unapproved drafts exist. Personal account onboarding and installed-device verification remain.
- Target outcome: A human reviews source-grounded learning posts, requests refinements and authorizes each exact revision before Buffer schedules it.
- Code touchpoints: `packages/core/src/linkedin.ts`, `packages/core/src/linkedin-store.ts`, `apps/web/src/components/LinkedInAdmin.tsx`, `packages/ui/src/LinkedInAdminScreen.tsx`, `scripts/linkedin/cli.ts`, `prompts/linkedin/worker.md`, `supabase/migrations/202609290001_create_linkedin_editorial.sql`.
- Primary tests: shared `linkedin*.test.ts`, web/native editorial tests, `supabase/tests/database/linkedin*.test.sql`, `apps/web/e2e/specs/linkedin-admin.regression.spec.ts`.

## One-Minute Brief

The private collection turns existing Codematica lessons into LinkedIn learning posts. `/admin/linkedin` and the native More destination let an allowlisted personal account create manual drafts, edit, refine, reject, adopt proposals and approve posts. Supabase holds editorial state; canonical learning Markdown and anonymous browsing remain local-first.

Refine enqueues durable work. A manually requested local Codex run reads the checked-in prompt, verifies sources and writes a proposed revision with an analysis. Approval authorizes Buffer scheduling, without another approval prompt. No post is automatically approved.

## Outcome / Contract

- Authenticated membership in `private.app_admins` is required by database RLS and every review RPC. Hidden navigation is convenience, not authorization.
- Supabase service credentials exist only in local operator environments. Clients use public anon-safe credentials. Neither ordinary users nor admins can write editorial tables directly.
- Revisions are immutable. Saving creates a revision; approval binds an exact revision and locks editing. Refine creates a proposal without replacing current text.
- Stale edits, stale approvals and stale proposals fail explicitly. Polling pauses during unsaved edits, including discarding an already in-flight poll.
- Flagged facts require a saved human confirmation; unresolved ADD/VERIFY/TODO placeholders prevent approval.
- Approve & queue schedules the exact saved body through the configured personal Buffer channel. First comments remain manual on Free.
- Buffer determines daily posting times. Capacity is currently ten scheduled posts per free channel; overflow remains approved in Supabase.
- A scheduling timeout never causes a blind retry. Unknown results require reconciliation. Withdrawal only unlocks a scheduled revision after Buffer confirms it is a draft; an already published post cannot be withdrawn.
- Private drafts, job envelopes, backups and results are excluded from Git and the public generated content index.

## Current State

The initial storage/recovery migrations are applied to hosted Supabase. The manual-create migration `202609300001` is included in the PR and has only been applied to the disposable local stack so far. The initial 100 posts cover nine groups: system design, production engineering, PostgreSQL, AI engineering, ML systems, frontend architecture, Python/type contracts, algorithms and architecture diagrams. Every initial draft has local source paths, SHA-256 provenance, an excerpt and references. All remain unapproved.

The Buffer personal channel is connected, with one recommended slot each day in America/Los_Angeles. Runtime configuration is local; no app deployment or native store build is implied by database setup. The manual worker requires a complete local developer install and an explicit request such as “Process the LinkedIn queue.” It consumes the existing Codex account allowance, not a separately billed model API. This is not an always-on cloud worker.

Personal admin identity must be confirmed and a verified Supabase Auth account created through the normal sign-in flow before privileged bootstrap. Installed-device Maestro validation remains outstanding. The SDK patch alignment from `main` now passes all 20 Expo Doctor checks; this does not replace installed-device validation.

## Scope

### In Scope

Manual creation and Unicode text formatting, web/native review, durable Postgres jobs, fixed-prompt analysis, source provenance, Buffer approval/scheduling/cancellation reconciliation, private exports and conservative restore.

### Out Of Scope

Automated comments, connection requests, direct messages, automatic approval, automated visuals, analytics optimization, and public/native app deployment.

### Assumptions

One personal editor and one LinkedIn channel. Free-tier limits and recommended slots are rechecked by the operator when they change. Backup files must be copied to a user-controlled durable location for protection against loss of this computer.

## Detailed Behavior

### UI / UX

The web layout follows [the design system](design-system.md). “LinkedIn” has compact queue counts and expandable worker details. New post stays labeled; refresh, formatting, save, refine, reject, copy, and withdrawal use named controls with semantic colors: compact icons on wide fine-pointer screens and visible text on touch/narrow layouts. Approve & queue keeps its visible label and publishing explanation. First comment, sources, analysis, and history start collapsed; a current proposal starts expanded. Errors, pending/failed requests, publication outcomes, and required fact checks remain visible.

Unsaved edits disable switching drafts, Back to collection, New post, and refresh. Save or explicitly discard changes to continue. The web editor never silently discards text on list selection. Native uses the same save-or-discard guard, visibly labeled 48 dp actions, system text scaling and an opt-in keyboard-aware scroll view.

Search and topic/review/publication filters lead to a post detail editor. On small screens selection replaces the list/filters with the editor and a Back to collection button; the list scrolls beside the editor when more than 48 rem of page content width is available. Opening a web draft focuses its heading; returning restores the collection button. Text and first comment are separate. Source excerpts, references, analysis scores, alternative hooks, posting plan, proposals, job status and revision history remain inspectable. Use revision is explicit. Approve & queue explains its external effect. Public anonymous users receive a sign-in/admin-access state and never load the collection.

Create opens a title/topic/text form on web and native. Add for analysis atomically stores a manual post, its initial immutable revision and a pending refinement job. It does not approve or schedule anything. Input survives failed submissions; retries in the same composer session reuse an idempotency key. After success the editor opens the new post, even if collection filters would hide it. Cancel leaves the form without saving. A manual post requires an analyzed, explicitly adopted revision before approval; changing post text or first comment invalidates its analysis. Saving only fact confirmation preserves the prompt hash and analysis.

The reusable web `LinkedInPostText` and native editor support selection-based Unicode bold/italic, bullet lines and restoration to plain text. Existing post editors use the same controls. URLs, hashtags, emoji, line breaks and unstyled characters are preserved; typing an @name does not create a LinkedIn mention. Unsupported accented letters remain plain. Styled letters can reduce screen-reader accessibility. The counter and schema use UTF-16 units, so mathematical letters and most emoji count twice. Buffer separately normalizes URL lengths; its final validation can differ for links ([official character rules](https://developers.buffer.com/guides/character-limits.html)). No HTML/Markdown or rich-text editor dependency is introduced.

### Data Model And Persistence

`linkedin_posts.origin` distinguishes `material` from `manual`; material drafts require source snapshots, while manual drafts can start with an empty source array. `linkedin_create` is admin-only and uses an auth-user-scoped unique request key to serialize retries and atomically enqueue analysis. The initial revision remains the retry comparison source after later edits. No draft text enters public learning indexes. `linkedin_posts` tracks the current/approved revision and human approval identity. `linkedin_revisions` stores immutable text, first comment, sources, structured analysis, fact confirmation and prompt hash. `linkedin_jobs` holds refine/schedule/cancel requests, leases and attempt counts. `linkedin_publications` records external identity and confirmed state. `linkedin_settings` holds author context, channel, timezone, publishing switch and worker heartbeat. The private membership table is not exposed to clients.

`linkedin_review` serializes per-post changes and checks the expected revision. Worker RPCs are service-role only. Atomic claim uses `FOR UPDATE SKIP LOCKED`, a twenty-minute lease and at most three refinement attempts. Only one active job exists per post/revision/kind. An expired publish/cancel lease becomes uncertain, never automatically pending. A publication attempt is recorded before external creation. Reapproval after confirmed cancellation receives a fresh revision identity.

Migration `202609300001` adds manual provenance, creation and analysis gates. New revisions enforce UTF-16 body/comment limits without rewriting immutable history (new constraints are `NOT VALID` for historical rows). Older backups without origin restore as material posts. Existing seeded material approval behavior is preserved.

### Business Logic

`prompts/linkedin/refine.md` is the fixed editorial prompt; `worker.md` is the trusted operations contract. The claim captures the prompt and completion stores its hash. The response schema preserves eight analysis sections and verification notes. Draft text and references are untrusted data, never instructions to tools. Worker instructions prohibit approval, identity changes, migrations and channel changes.

### Failure And Edge Handling

Transient refinement failures become eligible after a one-hour backoff and are retried on a later manual run, within a bounded count. Stale proposals stay in history but cannot be adopted. Unknown Buffer creation requires matching the external channel, exact text, time and identity; ambiguous matches remain blocked. If publication wins a cancellation race, reconciliation marks the publication sent and cancellation failed, releasing its lease. Exports retain all revisions; restore only accepts an empty editorial collection, restores destination/context settings and always pauses publishing. Auth identities and admin grants must be provisioned separately.

## Code Touchpoints

- `packages/core/src/linkedin.ts`: shared schemas, approval guard, filters and RPC adapter.
- `packages/core/src/linkedin-formatting.ts`: platform-independent selection formatting and token protection.
- `apps/web/src/components/LinkedInPostText.tsx`: reusable post textarea and formatting toolbar.
- `packages/core/src/linkedin-store.ts`: race-aware review state and polling/edit boundaries.
- `apps/web/src/components/LinkedInAdmin.tsx`: web review surface; `AppHeader.tsx` adds admin navigation.
- `packages/ui/src/LinkedInAdminScreen.tsx`: native review surface; native route/auth hook gates navigation.
- `scripts/linkedin/worker.ts`: pure seed/refinement/publication validators.
- `scripts/linkedin/cli.ts`: local service-role operator commands.
- `scripts/linkedin/smoke-local.ts`: real local Auth/REST/CLI lifecycle with inert external publications.
- `supabase/migrations/202609290002_linkedin_recovery.sql`: cancellation race and restore settings.

## Test Plan

- Web design regression: named icon controls, collapsed details, dirty draft/comment navigation guards, explicit discard, visible failed requests, and saved fact confirmation. Browser checks cover keyboard tooltips, 44 px controls, axe accessibility, and 320/390/768/1024/1440 px layouts with synthetic fixtures. Run `E2E_PORT=3102 npm run e2e:linkedin` if port 3100 is occupied. Inspect desktop/phone captures with synthetic data; the first local pass was reviewed before the user requested a pull request.

Local design validation on 2026-10-02: 404 Vitest tests and both coverage gates, four editorial browser journeys, nine public smoke cases, lint, workspace typechecking, production builds, and startup with a fresh production-only install pass. The visual preview uses temporary synthetic data; no hosted queue or publishing state changed. The user requested a pull request after reviewing the local preview.

Pull-request validation on 2026-10-03 after incorporating latest `main`: 490 Vitest tests and both coverage gates, 113 native Jest tests with coverage, Expo Doctor 20/20, six editorial/account workflows, 21 cross-browser accessibility cases and nine public smoke cases pass. Content freshness, lint, workspace typechecks, production build and production-only artifact startup pass. Native installed-device screen-reader/keyboard checks remain open; publishing permissions and hosted data are unchanged.

- Unit: formatting selection offsets, plain restoration, protected tokens and Unicode limits; manual approval gating, request validation, idempotent retries and busy-state serialization; shared schemas, exact approval guard, filters, RPC errors, race suppression and serialized writes; prompt hash and publication arguments.
- Integration: web/native screens, membership hooks, local CLI through actual Supabase Auth/REST. CLI subprocess startup is tested with a full developer install; it is not a deployed HTTP dependency.
- Database: manual creation authorization, atomic job insertion, retry identity/mismatches, analysis adoption, fact-only confirmation, edit invalidation and Unicode limits; transactional pgTAP tests for RLS, grants, verified bootstrap, immutability, stale actions, duplicate claims, bounded retries, uncertain publishing, withdrawal/reapproval and restoration. Clean local migration replay is required.
- E2E: manual creation, selection formatting, failed submission retry, reload persistence, analysis/adoption/approval and mobile layout; `npm run e2e:linkedin` uses isolated fake Supabase public configuration and intercepts only editorial RPCs. Ordinary public smoke tests explicitly disable Supabase regardless of local `.env` files. The dedicated lane is separate from `e2e:web:release` and runs in CI.
- Responsive accessibility: `npm run e2e:linkedin:accessibility` covers Chromium/iPhone WebKit at 320, 390, 768, 1024, 1180 and 1440 px, touch labels/targets, hover/Escape, keyboard focus, 200% text and short landscape reflow. Axe checks are not a full screen-reader audit.
- Native: Jest review/navigation coverage and `.maestro/linkedin-admin.yaml`; the latter requires an installed app signed into an allowlisted disposable local account with publishing disabled.
- Coverage: existing floors remain unchanged. `scripts/linkedin/worker.ts` is instrumented; the thin CLI orchestration and local smoke entrypoint use subprocess integration coverage rather than V8 unit instrumentation. No existing file is excluded.
- Commands: `npm run test:coverage`, `npm run test:mobile:coverage`, `supabase db reset --local`, `npm run test:db`, `npm run test:linkedin:local`, `npm run lint`, `npm run typecheck`, `npm run content:check`, `npm run build`, `npm run test:production:smoke`, `npm run e2e:smoke`, `npm run e2e:linkedin`.
- Production smoke installs only production dependencies in a fresh temporary copy of the built Next artifact, checks HTTP readiness and public/admin shells without service credentials. It preserves logs. No worker or Buffer mutation is executed by the web artifact.
- First failing regressions captured stale revision approval, RLS, duplicate publishing, lost in-flight edits, and the already-sent cancellation race before fixes.

## Open Questions

- Confirm the personal admin email and complete verified app sign-in/bootstrap.
- Complete installed Android/iOS verification before native release.

## Decision Log

- 2026-09-29: Supabase is canonical editorial storage; Buffer holds only scheduled approved posts. Local Codex hourly automation avoids a separate model API bill and database cron/WebSocket infrastructure.
- 2026-09-29: Web and native share schema/store/RPC behavior. Only the human adopts or approves proposals. Buffer Free first comments remain manual.

- 2026-09-29: Removed the recurring automation at the user’s request. Incoming requests remain queued until a manual Codex run; approval and Buffer publication rules are unchanged.

- 2026-09-30: Added manual creation with atomic refinement enqueue and required analysis/adoption before approval. Formatting remains literal Unicode text; no rich-text runtime dependency.

## Documentation Updates

The docs hub, engineering overview, repo context, app/package/Supabase READMEs and `docs/runbooks/linkedin-editorial.md` describe this workflow. Prompt/operator directories have their own READMEs.

## Thread Handoff Prompt

Read `docs/codex-context.md`, this feature and `docs/runbooks/linkedin-editorial.md`. Inspect live status using the CLI without exposing credentials. Preserve all drafts/history and human approval boundaries. Complete the remaining onboarding/device checks without inferring that local tests prove deployment readiness.

## Validation record — 2026-09-29

Checks repeated on the isolated PR branch passed: 324 Vitest tests with aggregate/per-file coverage gates, 52 native Jest tests with coverage gates, 85 transactional pgTAP assertions after clean migration replay, nine public browser smoke checks and two editorial browser checks. The CLI local lifecycle, lint, workspace typecheck, content check, production build and clean production-only artifact startup also passed. The artifact check verifies privileged worker code/service-key names are absent from built HTTP JavaScript. Failure logs and the mobile layout regression trace remain in local evidence; fixes were rechecked.

The `linkedin-editorial-worker` recurring automation was deleted at the user’s request. Processing now runs only on explicit manual requests. Hosted state was verified at 100 posts, all `review`, zero queued jobs and zero app Auth users. Local web production serving is available at `http://127.0.0.1:3100/admin/linkedin` for onboarding. This does not establish a hosted app deployment or installed native release; account/device checks remain; the later merge validation below supersedes the Expo Doctor gap.

## Manual-create validation — 2026-09-30

The manual-create extension passed 336 Vitest tests with coverage gates, 53 native Jest tests with coverage gates, 116 pgTAP assertions after clean migration replay, and a real local Auth/REST/CLI flow including concurrent idempotent creation and analysis-gated approval. Nine public browser smoke checks and three editorial browser checks passed. The dedicated mobile browser journey covers text selection/styling, a reported create error, retry, reload, proposal adoption and approval. Lint, typecheck, content validation, the production build and clean production-only artifact HTTP readiness checks passed. No new production dependencies were introduced; the formatter uses the existing core workspace import in web/native, and worker code remains outside HTTP startup.

This PR includes the hosted migration but does not deploy it or the clients. Personal account and installed-device checks still apply; the later merge validation below resolves Expo Doctor patch alignment. No Buffer mutation was made by this extension.

## Latest-main merge validation — 2026-09-30

Merged `main` at `d8c295b`, preserving both frontend interview documentation and the LinkedIn workflow, Python verification and editorial npm scripts, and separate public/editorial browser configurations. No editorial database migration or publishing behavior changed. A clean dependency install, 389 Vitest tests with coverage gates, 58 native Jest tests with coverage gates, authored Python verification, content check, lint and workspace typecheck passed. Expo Doctor passes all 20 checks after the upstream SDK alignment. The merged production build, nine public browser smoke cases, three editorial browser cases and startup with a clean production-only dependency install also passed. Installed-device validation and hosted deployment remain separate tasks.
