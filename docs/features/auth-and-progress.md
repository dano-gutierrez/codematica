# Auth And Progress

## Snapshot

- Status: `shipped`
- Last updated: `2026-08-03`
- Owner thread: `n/a`
- Current state: Supabase Auth is wired for Google, email/password, and Apple-ready login on web, with native Expo Auth/progress adapters using the same Supabase contract. Signed-in users sync resume/completion progress, while signed-out users retain every unique local progress item until a complete batched sync succeeds.
- Target outcome: Users can keep reading and resume learning across documents, diagrams, practice, passive flashcards, and interview walkthroughs without making anonymous browsing depend on Supabase.
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
  - `packages/core/src/progress/`
  - `supabase/migrations/202606210001_create_auth_progress.sql`
- Primary tests:
  - `apps/web/src/lib/progress/*.test.ts`
  - `apps/web/src/components/LoginForm.test.tsx`
  - `apps/web/src/components/KeepReadingSection.test.tsx`
  - `apps/web/src/components/SaveProgressPrompt.test.tsx`
  - `apps/web/e2e/specs/auth-progress.regression.spec.ts`
  - `apps/mobile/src/__tests__/mobile-screens.test.tsx`

## One-Minute Brief

Auth and progress are additive. Codematica still renders local content without Supabase credentials, but when web `NEXT_PUBLIC_*` or native `EXPO_PUBLIC_*` Supabase variables are configured, users can sign in and persist resume/completion state to Supabase. Signed-out web users keep unique progress items in `localStorage`; signed-out native users keep them in native local storage. Local items are deduplicated by surface, slug, and path, but are not silently evicted by an arbitrary item-count cap.

## Outcome / Contract

- `/login` supports Google OAuth, email/password sign-in and sign-up, and Apple OAuth when `NEXT_PUBLIC_AUTH_APPLE_ENABLED=true`.
- `/auth/callback` exchanges OAuth/PKCE codes and returns users through `/login?sync=1` so browser-local progress can sync after login.
- `/auth/sign-out` signs users out and redirects home.
- The app remains usable without Supabase env vars; progress POSTs then fall back to the signed-out local buffer.
- `/api/progress/summary` returns signed-in Keep reading items or an empty signed-out summary.
- `/api/progress` validates and upserts one progress item for the authenticated user.
- `/api/progress/sync-anonymous` accepts a bounded batch of up to 20 items. Web and native clients send as many sequential batches as needed and clear the local copy only after every batch succeeds.
- Progress stores resume/completion milestones only. It does not store answers, scores, mastery, streaks, or full session history.
- Native uses the same progress validation and upsert helpers from `packages/core/src/progress/`; it writes directly with an anon-safe Supabase client when signed in and falls back to local buffering when signed out or offline.

## Detailed Behavior

### Progress Events

- Documents: started on view; completed around 80% scroll or next-node click.
- Diagrams: completed on view.
- Flashcards: completed on reveal.
- Cloze prompts: completed on correct answer.
- Questionnaires: current question index tracked; completed on finish; answers are not stored.
- Passive feeds: latest card sequence tracked; no completion state.
- Interviews: step, language, and track position tracked; completed when the final explanation is shown.

### Data Model

- `public.user_profiles` stores only `user_id` and timestamps.
- `public.user_progress_items` stores `user_id`, `surface`, `slug`, `path_slug`, `status`, `position`, `first_seen_at`, `last_seen_at`, `completed_at`, and timestamps.
- `(user_id, surface, slug, path_slug)` is unique.
- RLS is enabled; authenticated users can only select, insert, update, and delete their own rows.
- Repo Markdown, path JSON, exercise JSON, flashcard feeds, and interview JSON remain canonical. Supabase does not become the content source of truth.

### Provider Setup

- Google and Apple OAuth providers must be configured in Supabase Auth and their upstream provider consoles before production use.
- Apple is hidden unless `NEXT_PUBLIC_AUTH_APPLE_ENABLED=true`.
- Email/password uses Supabase Auth. Production should configure a real SMTP sender rather than relying on default low-rate email delivery.
- The service role key remains server-only and is not used by browser auth or progress code.
- Native Auth uses Expo SecureStore-backed session persistence and `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The service role key is never bundled in native.

## Test Plan

- Unit: progress payload validation, content-index mapping, stale slug filtering, local dedupe/retention, bounded web/native batch sync, and clear-after-complete behavior.
- Server helper: authenticated upsert, unauthenticated rejection, summary mapping, anonymous sync batching.
- Component: login provider gating, Keep reading rendering, save-progress prompt, progress callbacks from practice/interview/passive-feed components.
- E2E: signed-out user reads and practices without redirects, sees the save-progress prompt, and sees local Keep reading state.

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

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/auth-and-progress.md first. Compare the documented auth/progress contract against apps/web/src/lib/supabase, apps/web/src/lib/progress, apps/mobile/src/lib/supabase.ts, apps/mobile/src/lib/progress.ts, packages/core/src/progress, apps/web/src/components/LoginForm.tsx, apps/web/src/components/KeepReadingSection.tsx, apps/web/src/components/SaveProgressPrompt.tsx, apps/web/src/components/ProgressTrackers.tsx, apps/web/src/app/api/progress/**/route.ts, and supabase/migrations/202606210001_create_auth_progress.sql, then update tests and docs with any behavior changes.`
