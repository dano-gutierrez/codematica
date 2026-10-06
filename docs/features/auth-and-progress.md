# Auth And Progress

## Snapshot

- Status: `shipped`
- Last updated: `2026-10-03`
- Owner thread: `n/a`
- Current state: Supabase Auth is wired for Google, email/password, and Apple-ready login on web, with native Expo Auth/progress adapters using the same Supabase contract. Existing resume/completion history remains unchanged; Japanese skill mastery is additive through local review state and the RLS-protected `user_skill_progress` table.
- Target outcome: Users can keep reading, resume learning, and retain bounded Japanese mastery across devices without making anonymous browsing or review depend on Supabase.
- Code touchpoints:
  - `apps/web/src/lib/supabase/`
  - `apps/web/src/lib/progress/`
  - `apps/web/src/components/LoginForm.tsx`
  - `apps/web/src/components/KeepReadingSection.tsx`
  - `apps/web/src/components/SaveProgressPrompt.tsx`
  - `apps/web/src/components/ProgressTrackers.tsx`
  - `apps/web/src/app/api/progress/**/route.ts`
  - `apps/mobile/src/lib/supabase.ts`
  - `apps/mobile/src/lib/progress.ts`
  - `apps/mobile/src/lib/skill-progress.ts`
  - `packages/core/src/progress/`
  - `supabase/migrations/202606210001_create_auth_progress.sql`
  - `supabase/migrations/202608040001_create_user_skill_progress.sql`
- Primary tests:
  - `apps/web/src/lib/progress/*.test.ts`
  - `apps/web/src/components/LoginForm.test.tsx`
  - `apps/web/src/components/KeepReadingSection.test.tsx`
  - `apps/web/src/components/SaveProgressPrompt.test.tsx`
  - `apps/web/e2e/specs/auth-progress.regression.spec.ts`
  - `apps/mobile/src/__tests__/mobile-screens.test.tsx`

## One-Minute Brief

Codematica renders local content without Supabase credentials. Configure web `NEXT_PUBLIC_*` or native `EXPO_PUBLIC_*` Supabase variables to enable sign-in and save resume/completion state in Supabase across devices. Signed-out progress stays in `localStorage` on web and native local storage on mobile. Items are deduplicated by surface, slug, and path, with no arbitrary item-count eviction.

## Outcome / Contract

- `/login` supports Google OAuth, email/password sign-in and sign-up, and Apple OAuth when `NEXT_PUBLIC_AUTH_APPLE_ENABLED=true`.
- `/auth/callback` exchanges OAuth/PKCE codes and returns users through `/login?sync=1` so browser-local progress can sync after login.
- `/auth/sign-out` signs users out and redirects home.
- Signed-in web navigation replaces Sign in with the account name/email and an expandable Sign out control. Desktop uses the sidebar footer; phones reuse it in the header and More menu.
- Admin is a separate navigation group containing the LinkedIn icon/link, visible only for a signed-in user whose existing membership RPC succeeds. Database RLS and RPCs remain the authorization boundary.
- Navigation Sign out calls `auth.signOut({ scope: "local" })`, clears this browser session, returns home, and refreshes server content. Failures keep a retryable account menu. Other devices remain signed in.
- The account disclosure reserves the future Profile/settings entry point; this change adds no Profile route.
- The app remains usable without Supabase env vars; progress POSTs then fall back to the signed-out local buffer.
- `/api/progress/summary` returns signed-in Keep reading items or an empty signed-out summary.
- `/api/progress` validates and upserts one progress item for the authenticated user.
- `/api/progress/sync-anonymous` accepts a bounded batch of up to 20 items. Web and native clients send as many sequential batches as needed and clear the local copy only after every batch succeeds.
- `/api/progress/skills` reads the authenticated mastery snapshot and accepts bounded 20-item upsert batches. Web and native merge remote rows with the retained local snapshot before uploading the merged result; anonymous use remains local-first.
- `user_progress_items` continues to store resume/completion milestones only. `user_skill_progress` separately stores only best score, attempt count, review box, mastery state, last practice time, and next review time.
- Neither table stores individual answers, raw handwriting, recordings, or full attempt histories.
- Native uses the same progress validation and upsert helpers from `packages/core/src/progress/`; it writes directly with an anon-safe Supabase client when signed in and falls back to local buffering when signed out or offline.

## Detailed Behavior

### Navigation Account Session

`use-account-session.ts` subscribes synchronously to auth changes, retrieves the initial user, and ignores a lookup that completes after a newer event or unmount. Loading shows a neutral account check. Display names use full_name, then name, then the email prefix or “Account.”

The account disclosure uses native details/summary. Escape closes it and restores focus. Names and emails truncate without expanding the rail. The navigation area scrolls on short screens while the account footer stays reachable. Sign out uses the shared Button primitive.

### Navigation Validation

Component tests verify separate Admin grouping, active LinkedIn routes and icon, ordinary/signed-out access, identity fallbacks, failure/retry, disabled concurrent sign-out, and Escape focus. Hook tests cover optional configuration, initial lookup, auth events, stale results, and cleanup.

`account-navigation.regression.spec.ts` signs into intercepted synthetic Supabase endpoints on desktop and phone, checks Admin and the account menu, signs out, and verifies cookie removal and anonymous navigation. It runs with `npm run e2e:linkedin` alongside the editorial cases. No hosted account or database is changed. Coverage gates remain unchanged.

Local follow-up validation on 2026-10-03: 421 Vitest tests with aggregate/per-file coverage, six editorial/account browser journeys, nine public smoke cases, lint, workspace typechecks, production builds, and fresh production-only artifact readiness pass. The authenticated account-menu journeys also run axe checks on desktop and phone. The user requested a pull request after reviewing the local preview.

### App-wide account and form pass — 2026-10-03

Native navigation now accepts account identity, displays a separate Admin section, and offers an expandable Sign out action in the tablet footer or phone More menu. Sign out uses local scope, retains a retryable menu on failure and returns home on success. The shared native Supabase client is a singleton so adapters and navigation observe the same session. Account and membership lookups ignore results superseded by auth changes; foreground refresh checks the current account.

Both login forms use shared actions, visible field labels, password autofill modes, busy guards and concise recovery. Native login uses keyboard-aware `AppScreen` and disables unavailable methods instead of reporting success. Native Apple appears only with `EXPO_PUBLIC_AUTH_APPLE_ENABLED=true`. Web login reuses the bounded progress-sync helper: it retains local items on HTTP/network failure, offers Retry sync without another auth request, and offers Continue with progress kept on this device. The helper reports complete/failed sync to the UI.

Regression-first tests: `LoginForm.test.tsx` for live announcements, thrown network recovery and 25-item login sync; `client.test.ts` for explicit sync outcomes; native `design-controls.test.tsx`, `account-session.test.tsx`, `admin-access.test.tsx` and `supabase.test.ts` for unavailable/busy auth, account/sign-out recovery, lifecycle races and shared session ownership. Run targeted suites plus both aggregate coverage gates, typecheck, lint, production build and the synthetic `account-navigation.regression.spec.ts` journey. Installed screen-reader/keyboard proof remains open in the app-wide design audit. Coverage floors are unchanged.

### Native callback and sync recovery — 2026-10-03

The native singleton uses explicit PKCE with secure storage. The browser handoff validates callback scheme, host, port and path, then dispatches its code/error URL into Expo Router. Cancellation or an invalid/missing callback produces a recoverable sign-in error. A repeated current code shares its existing exchange outcome to avoid consuming the one-use code twice during duplicate handoffs. Only the most recent code is cached per client.

The callback visibly handles configuration, provider, exchange and network failures. Successful authentication with interrupted progress sync keeps the local buffer, offers Retry sync without another code exchange, and allows Continue. Password sign-in similarly returns a sync outcome independently from auth success; retry calls only sync and never reauthenticates. Native account display retains a known identity on transient offline refresh, while invalid sessions/sign-out clear it. Admin membership remains separately authorized and fails closed.

The web progress banner follows page content in normal document flow. Without hosted configuration it shows local saving and no unusable sign-in action. This avoids covering content, navigation and enlarged text.

Test plan additions: native `supabase`, `auth-code`, `auth-callback`, `account-session`, `adapters` and `design-controls` suites; web progress/login/banner tests; `design-content.regression.spec.ts` checks banner placement. Browser-provider consent and real hosted login are not performed by UI tests.

### Progress Events

- Documents: started on view; completed around 80% scroll or next-node click.
- Diagrams: completed on view.
- Flashcards: completed on reveal.
- Cloze prompts: completed on correct answer.
- Questionnaires: current question index tracked; completed on finish; answers are not stored.
- Guided labs: started after choosing a prediction; completed with prediction commitment and evidence count/total only. UI confirmation awaits the existing progress write; failed completion retains transient choices/notes for retry. Practice again clears transient work without deleting the saved milestone. Reflections stay in memory.
- Passive feeds: latest card sequence tracked; no completion state.
- Interviews: step, language, and track position tracked; completed when the final explanation is shown.
- Japanese review: a rating updates the deterministic review box, best score, attempt count, mastery state, and next-review time; individual prompts or answers are not stored.

### Data Model

- `public.user_profiles` stores only `user_id` and timestamps.
- `public.user_progress_items` stores `user_id`, `surface`, `slug`, `path_slug`, `status`, `position`, `first_seen_at`, `last_seen_at`, `completed_at`, and timestamps.
- `public.user_skill_progress` is additive and unique by `(user_id, path_slug, skill_id)`; its trigger never lowers best score or attempt count.
- Mastery merge uses the newest `lastPracticedAt` for review box/state/due time and the maximum `bestScore` and `attemptCount`. The merge is deterministic and never lowers the best score or attempt count. It cannot sum independent device histories because no per-attempt event log is stored.
- `(user_id, surface, slug, path_slug)` is unique.
- RLS is enabled; authenticated users can only select, insert, update, and delete their own rows.
- Repo Markdown, path JSON, exercise JSON, flashcard feeds, and interview JSON remain canonical. Supabase does not become the content source of truth.

### Provider Setup

- Google and Apple OAuth providers must be configured in Supabase Auth and their upstream provider consoles before production use.
- Apple is hidden unless `NEXT_PUBLIC_AUTH_APPLE_ENABLED=true`.
- Email/password uses Supabase Auth. Production should configure a real SMTP sender rather than relying on default low-rate email delivery.
- The service role key remains server-only and is not used by browser auth or progress code.
- Native Auth uses Expo SecureStore-backed session persistence and `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The service role key is never bundled in native.

### Snapshot acknowledgment and prompt lifecycle

Web sync validates each response's acknowledged count and zero rejected rows before clearing. Both platforms remove only unchanged entries from the submitted snapshot. New or updated learning recorded while network requests run stays local. Native AsyncStorage read/modify/write operations are serialized, including acknowledgment; a failed operation does not poison the write queue. Writes and acknowledgments propagate unreadable storage failures without replacing or clearing its bytes; read-only summaries can fall back to an empty display. Incomplete or rejected batches preserve the local snapshot for retry.

The web save prompt subscribes to the current Auth session and ignores a late initial summary after a newer event. Its sign-in return target follows route navigation. The global save prompt occupies normal flow after content, so its first appearance cannot shift a handwriting canvas. Lesson-return controls stay above the lesson in normal flow. Neither covers editors or navigation. Unconfigured web/native apps say that progress is saved on this device and omit the unavailable sign-in action.

## Test Plan

- Configured installed native: `apps/mobile/e2e/flows/auth-account.regression.yaml` is an opt-in disposable-project journey for invalid-password recovery, successful email sign-in, account identity, admin navigation, sign-out and denied admin access afterward. Its editorial child flow creates/refines test drafts only; publishing stays disabled. Stable email/password IDs preserve the existing labels. Keep evaluated commands and captures private. This does not establish real Google/Apple provider or installed iOS acceptance.

- Regression: deferred sync with new/updated learning, partial or malformed HTTP acknowledgments, failed batches, unreadable snapshot/acknowledgment storage, current-session prompt updates and stale-summary rejection in `anonymous.test.ts`, `client.test.ts`, `SaveProgressPrompt.test.tsx` and native `progress.test.ts`. Retain route/callback and sign-out journeys in the browser/native lanes. The disabled-auth Maestro flow matches the learner-facing unavailable message, scrolls the submit control fully into view within 20 seconds and asserts that it is disabled. Run at normal and enlarged system text and inspect the form capture.

- Unit: progress payload validation, content-index mapping, stale slug filtering, local dedupe/retention, bounded web/native batch sync, and clear-after-complete behavior.
- Server helper: authenticated upsert, unauthenticated rejection, summary mapping, anonymous sync batching, and skill-progress loading/sync.
- Component: login provider gating, Keep reading rendering, save-progress prompt, and progress callbacks from practice/interview/passive-feed components. Unconfigured web login displays “Sign-in is not set up here.” and keeps provider buttons disabled. Native explains that sign-in is unavailable and on-device learning remains usable; implementation/environment details stay out of the account form.
- E2E: signed-out user reads and practices without redirects, sees the save-progress prompt, and sees local Keep reading state.

Native mastery persistence uses `apps/mobile/src/lib/review-persistence.ts` to serialize every read/merge/rating write for `codematica:japanese-skill-progress:v1`. A reusable rating intent captures its base row, graded result and time once. Retry acknowledges an identical committed result or writes that result over the unchanged base, preserving unrelated rows; a changed same-skill record requires explicit reload. Schema-invalid or duplicate persisted records are not replaced. Native review tests cover write acknowledgment, concurrency, unknown-outcome reconciliation, failure and reload; installed skill-review checks cover real storage/restart. “Saved on this device” does not assert successful remote sync.

## Open Questions

- Which future scoring, streak, mastery, or review-queue events should become durable?
- Should signed-in users get a profile/settings page before additional gamification state ships?
- Which provider should be the production launch blocker if Apple account setup is not ready?

## Decision Log

- `2026-06-21`: Keep sign-in optional; browsing and learning remain available without Supabase credentials.
- `2026-06-21`: Store only resume/completion milestones, not answer drafts or scores.
- `2026-06-21`: Gate Apple login behind `NEXT_PUBLIC_AUTH_APPLE_ENABLED`.
- `2026-06-21`: Preserve local content as canonical and store only user identity/progress in Supabase.
- `2026-07-11`: Add native Auth/progress adapters that share the same Supabase tables, RLS assumptions, and core progress validation.
- `2026-08-03`: Remove silent 20-item local eviction and sync retained web/native progress in lossless 20-item batches.
- `2026-08-04`: Add six-box Japanese skill mastery and deterministic non-destructive local/remote snapshot merging without altering existing completion rows.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/auth-and-progress.md first. Compare the documented auth/progress contract against apps/web/src/lib/supabase, apps/web/src/lib/progress, apps/mobile/src/lib/supabase.ts, apps/mobile/src/lib/progress.ts, apps/mobile/src/lib/skill-progress.ts, packages/core/src/progress, apps/web/src/components/LoginForm.tsx, apps/web/src/components/KeepReadingSection.tsx, apps/web/src/components/SaveProgressPrompt.tsx, apps/web/src/components/ProgressTrackers.tsx, apps/web/src/app/api/progress/**/route.ts, and both progress migrations under supabase/migrations/, then update tests and docs with any behavior changes.`

## Separate game progress (2026-09-29)

[Restore the Signal](restore-the-signal.md) adds account-scoped local game awards and optional Supabase sync through `/api/progress/game` and `merge_game_progress`. Awards and successful calendar days merge by union. A replay cannot duplicate XP. The saved timezone defines streak dates; preferences retain earned cosmetics. Owner RLS and expected-account checks prevent cross-account reads/writes. Answers, code, and attempts stay transient. The existing save-progress prompt also recognizes anonymous game awards; learning-path progress tables and access rules are unchanged.

## Japanese notebook update — 2026-10-02

Languages exposes Japanese and Notebook practice in the tablet/sidebar and phone More menus. `/languages/japanese/notebooks` supports curated and custom 1–5-character prompts and saved pages. [Japanese writing notebooks](japanese-writing-notebooks.md) owns the shared 24-repetition engine, device-local ink, maximum-progress synchronization and validation gates. Live ink and feedback preserve page position; Input is detected automatically. Mouse wheel/trackpad scrolling remains available on web; two-finger gestures scroll the paper on touch screens and installed apps without adding ink. There are no Draw, Pen or Scroll buttons.

The additive `user_writing_notebook_progress` table and writing-notebooks API store bounded best counts and prompts with RLS ownership. Restart/stale updates preserve earned completion. Notebook ink is retained only in IndexedDB or separate AsyncStorage sheet/cell records; existing lesson/skill tables do not receive vectors.
