# Codematica Design System

## Snapshot

- Status: `in_progress`
- Last updated: `2026-10-03`
- Current state: Shared web controls and the LinkedIn redesign are implemented and ready for pull-request review. Installed native accessibility checks remain open.
- Target outcome: New and revised screens share controls, spacing, hierarchy, and accessible interactions.
- Code touchpoints: `Button.tsx`, `Dropdown.tsx`, `LinkedInPostText.tsx`, `LinkedInAdmin.tsx`, `apps/web/src/app/globals.css`.
- Primary tests: `Button.test.tsx`, `LinkedInAdmin.test.tsx`, `LinkedInPostText.test.tsx`, `linkedin-admin.regression.spec.ts`.

## One-Minute Brief

Use a quiet light canvas, a clear editing or reading surface, and concise controls. Reserve strong color for actions and status. Reuse the components below before introducing another control. Existing screens adopt this contract when they change; the LinkedIn review page is the first implementation.

## Outcome / Contract

- Every action has a descriptive accessible name. Secondary actions can use icons on wide mouse-driven screens; touch and narrow layouts show their text labels without hover.
- Keep the main action visibly labeled. Approval, publishing, payment, and destructive confirmation state their effect in text.
- Secondary actions use a familiar icon and consistent semantic color. Color is an additional cue, never the only explanation.
- Use one spacing scale and control geometry. Align related controls on the same baseline.
- Keep errors, pending work, and consequential choices visible. Put supporting material behind a named disclosure.
- Check responsive layout, keyboard behavior, contrast, and workflow guards before accepting new UI.

## Current State

`Button` owns button geometry, semantic tones, disabled state, and icon tooltips. `Dropdown` remains the shared Radix select. `LinkedInPostText` owns the framed composer and selection-based formatting. The editorial page uses these components. Existing learning screens retain their established components; complete app-wide adoption remains incremental. Native editorial controls share the touch, text-scaling and edit-preservation rules below, using React Native primitives.

## Scope

### In Scope

Shared control styling, component reuse, alignment, readable hierarchy, compact copy, responsive web editorial review and native editorial touch/keyboard defaults.

### Out Of Scope

Backend changes, new publishing permissions, dark appearance, a wholesale native visual rewrite, and an immediate rewrite of every screen.

### Assumptions

The current Geist font and light appearance remain the baseline. Content can wrap and users can zoom. No new runtime dependency is needed.

## Detailed Behavior

### UI / UX

#### Tokens and geometry

| Property | Rule |
| --- | --- |
| Spacing | 4, 8, 12, 16, 24, 32, 48 px. Use 8 px between actions, 12–16 px between fields, 24–32 px between sections. |
| Canvas / surface | `--background: #f7f8fa` / `--panel: #ffffff`. White frames belong to tools, dialogs, and repeated content items. |
| Text | `--foreground: #202b33`; supporting control text `--ui-text-muted: #52616c`. |
| Borders | 1 px. Decorative separators use `--line`; outlined controls use `--ui-control-border: #7d8b94`. |
| Corners | `--ui-radius: 10px` for controls; 12 px for a composer; 16 px for content cards. |
| Targets | `--ui-control-size: 44px` on wide fine-pointer web; 48 px on narrow/touch web; 48 dp for native editorial controls. Use at least 8 px between separate actions. |
| Icons | 18 px in actions, 24 px in section identity. Use Lucide; hide decorative SVGs from assistive technology. |
| Typography | 28–32 px page title; 20 px section title; 16 px content; 14 px controls; 12–13 px supporting text. Prefer semibold hierarchy to all-caps paragraphs. |
| Focus | 2 px teal outline, 3 px offset; preserve keyboard visibility. |
| Motion | Short color feedback only. Respect the existing reduced-motion rule. |

Keep page content within roughly 1200 px. The app shell owns sidebar and bottom-navigation clearance. Use 16 px phone padding and 24–32 px on larger screens. Avoid duplicating full page gutters inside child components.

#### Action language

| Tone | Foreground / primary fill | Secondary surface | Meaning / example |
| --- | --- | --- | --- |
| Neutral | `#33434b` | White | Refresh, copy, formatting, cancel |
| Info | `#245fba` | `#eef4ff` | Save revision, create draft |
| Assist | `#5840b8` | `#f3efff` | Refine, use a proposed revision |
| Success | `#00645f` | `#eaf7f4` | Approve and queue |
| Warning | `#8a4b00` | `#fff6df` | Retry or return to review |
| Danger | `#b4233f` | `#fff0f2` | Reject; delete only where deletion exists |

Tone foregrounds meet 4.5:1 on their secondary surfaces. Primary controls use white text on the tone foreground. Enabled outlines and focus indicators meet 3:1. Disabled controls remain named and contextual; reduced opacity indicates unavailability.

Use the shared primitive:

```tsx
<Button label="Save revision" icon={Save} iconOnly tone="info" />
<Button label="Refine post" icon={Sparkles} iconOnly tone="assist" />
<Button label="Approve & queue" icon={Check} tone="success" variant="primary" />
```

`secondary` is the default outlined treatment; `quiet` suits formatting and navigation within a tool. Use the same treatment for the same kind of action. Keep one prominent labeled action per group. Do not show a trash icon for rejection: editorial rejection retains the post and its history.

Tooltips supplement accessible names on wide fine-pointer screens. They persist while the pointer is over the button or tooltip, and Escape dismisses them without moving focus. All icon actions show inline text when `(any-pointer: coarse)`, `(hover: none)`, or the viewport is narrower than 1024 px. This includes iPads with an attached trackpad. Never require a long press or a first tap to identify an action. Essential instructions belong beside the control. Name an icon action “Copy first comment,” never “Copy icon.”

#### Alignment and composition

- Heading: identity left; create and refresh right. Wrap naturally on small screens.
- Forms: labels above equal-height inputs; validation beside the relevant field. Keep body text left-aligned.
- Toolbars: one row with 8 px gaps. Separate utilities from the main action with available space.
- Lists: topic and status first, then title. Selected tint and border accompany the pressed state.
- Cards: frame items or tools that need a boundary. Avoid cards inside cards.
- Details: named disclosures with counts or short hints. Required verification and failures stay outside collapsed details.
- Copy: an action verb and its object. Remove repeated explanations. Describe publishing once beside its action.

#### Editorial reference layout

Use available content width rather than device names. Above 48 rem inside the editorial page, show a 240–290 px independently scrolling draft list beside the editor, with a 24–32 px gap. At 48 rem or below, selection opens one editor with “Back to collection”; filters return with the collection. The 224 px app sidebar counts against that available width. This gives iPad portrait and Split View a usable single-pane editor, while a wide landscape iPad can show both panes.

The composer contains formatting controls, textarea, and optional guidance. Saved state and character count sit immediately below. The action bar follows, then collapsed first comment, sources, analysis, and history. A proposal based on the current revision starts expanded for comparison.

Actions remain in normal document flow so they cannot cover focused content or occupy most of a short landscape viewport. Touch utilities and formatting use two-column groups with a full-width primary action. The shell reserves safe-area and bottom-navigation clearance. Pending work and publishing outcomes remain visible.

#### Platform and accessibility contract

One design system owns color, spacing, naming, hierarchy and workflow rules. Adapt layout and native mechanics without maintaining separate business logic.

| Surface | Presentation / interaction |
| --- | --- |
| Phone web | Labeled 48 px actions, wrapped two-column toolbars, single editor, bottom navigation and safe-area clearance. Inputs are at least 16 px to avoid focus zoom. |
| iPad / tablet web | Sidebar when the shell has room; page container decides one or two panes. Touch labels stay visible even with a mouse attached. Split View behaves like a narrow screen. |
| Desktop web | Two panes when there is room, compact secondary icons with hover/focus labels, full keyboard access. Approval remains labeled. |
| iOS / Android native | Visible action text, 48 dp minimum targets, naturally wrapping text with system font scaling enabled, safe-area shell and keyboard-aware editorial scroll view. No hover dependency. |

Web editorial typography uses rem units and growing controls. Reflow checks cover 320–1440 px, 200% text enlargement and short landscape screens, including long unbroken links in proposals. Keep input, source, proposal and validation text available; wrap long tokens instead of truncating them. Respect reduced motion and browser zoom.

Selecting a web draft moves focus to its heading. Returning restores the initiating collection button, or Search when filters removed that draft; creation focuses Title and cancelling returns to New post. Saved/dirty state is announced politely and explains how to unlock navigation. On both web and native, unsaved edits require save or explicit discard before switching drafts. Native keyboard-aware `AppScreen` is opt-in: handled taps reach formatting/actions while editing, dragging dismisses the keyboard, and iOS uses padding avoidance. Android uses the platform resize behavior.

Automated axe checks complement keyboard, touch geometry and reflow tests; they do not certify full accessibility. VoiceOver/TalkBack, the physical software keyboard, native large text and installed-device safe areas still need manual device verification before native release readiness is claimed.

Standards: [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [hover/focus content](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [Android 48 dp touch guidance](https://support.google.com/accessibility/android/answer/7101858?hl=en), and [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility). Our 48 px web target is a product choice beyond WCAG's 24 px minimum; CSS pixels and native dp/pt are platform-specific units.

### Data Model And Persistence

The design system adds no persisted data. Keep private drafts, credentials, and live editorial snapshots out of tracked examples. Visual fixtures use synthetic drafts.

### Business Logic

Preserve disabled guards, exact-revision approval, required manual-draft analysis, and idempotent submission. Iconification authorizes no additional operation. Retries must use an existing safe operation; unknown external publishing outcomes still require reconciliation.

### Failure And Edge Handling

Unsaved edits pause polling and disable creation, refresh, and navigation to another draft. Save or explicitly discard changes to continue. Validation and server failures preserve input. Never silently discard edits on list selection.

Copy feedback belongs to the exact text and copy attempt. Editing, discarding or leaving a draft invalidates pending feedback. A denied or unavailable clipboard keeps the comment and offers manual selection/copy; retry clears the previous error. Announce successful copying with a polite status.

## Code Touchpoints

- `apps/web/src/components/Button.tsx`: standard named action primitive.
- `apps/web/src/components/AppHeader.tsx`: shared navigation, separate Admin group, and reusable account disclosure with a labeled Sign out action.
- `apps/web/src/components/Dropdown.tsx`: accessible Radix filters; `triggerClassName` matches geometry.
- `apps/web/src/components/LinkedInPostText.tsx`: reusable composer and Unicode formatting.
- `apps/web/src/components/LinkedInAdmin.tsx`: reference layout and guarded action groups.
- `apps/web/src/app/globals.css`: control tokens and scoped editorial layout.
- `packages/ui/src/tokens.ts`: existing native tokens; consult before native adoption.

## Test Plan

- Unit: accessible icon names, visible primary text, disabled behavior, and formatting selection.
- Integration: collapsed supporting details, action semantics, text/comment/fact-confirmation discard, manual-create failure recovery, approval guards, and proposal adoption. Exercise delayed/superseded clipboard results, denied/unavailable clipboard recovery and retry.
- E2E: isolated RPC fixtures; existing create/refine/approve journeys plus keyboard tooltips, 44 px controls, comment editing, draft navigation, axe accessibility, and overflow checks at 320, 390, 768, 1024, and 1440 px.
- Classification: editorial cases use `@regression`; public navigation remains `@smoke`.
- Visual review: inspect desktop, phone and tablet captures with synthetic data. The first local pass was reviewed before the user requested a pull request.
- Commands: targeted component Vitest tests; `npm run test:coverage`; `npm run lint`; `npm run typecheck`; `E2E_PORT=3102 npm run e2e:linkedin`; `E2E_PORT=3102 npm run e2e:smoke`; production build and `npm run test:production:smoke`.
- Coverage thresholds and exclusions are unchanged. No content, migration or publishing-permission change.

## Local Validation — 2026-10-02

All 404 Vitest tests pass with aggregate and per-file coverage gates. All four isolated editorial browser journeys and nine public smoke cases pass. Axe checks pass on the desktop and phone editor; layout checks pass at 320–1440 px. Lint, workspace typechecking, production builds, and readiness/public-admin shell checks after a fresh production-only dependency install pass. Failed initial browser traces/reports are retained privately; they exposed keyboard-focus and disclosure selectors in the new test and were corrected without weakening behavior assertions.

The interactive local preview serves the built UI with synthetic, in-memory RPC responses. Preview edits reset on reload and never touch hosted Supabase or Buffer. No push, deployment, or live editorial mutation was performed.

The follow-up includes the previously local Admin navigation and account menu in this same checkout. The preview displays a synthetic signed-in editorial account so both surfaces can be reviewed together.

Follow-up validation on 2026-10-03: 421 Vitest tests pass with both coverage gates; all six editorial/account browser journeys and nine public smoke cases pass. Lint, all workspace typechecks, the built app, and fresh production-only artifact startup pass. The account journeys additionally check authenticated desktop/phone accessibility. First-pass visual review still precedes any push.

Private generated review scripts under the already Git-ignored `.local/` directory are also excluded from ESLint, like generated browser reports. Production source and coverage exclusions remain unchanged.

Additional gates: `E2E_PORT=3102 npm run e2e:linkedin:accessibility` runs touch/keyboard/reflow/axe checks on Chromium and iPhone WebKit. `npm run test:mobile:coverage` covers native targets and edit recovery. The existing `.maestro/linkedin-admin.yaml` now checks discard on disposable data; do not run it against production drafts.

### Touch validation — 2026-10-03

424 Vitest tests and both web/core coverage gates pass; 72 native Jest tests and coverage pass; Expo Doctor passes 20/20. All 21 cross-browser accessibility cases pass, along with six editorial/account workflows and nine public smoke cases. Lint, every workspace typecheck, production build and fresh production-only artifact readiness/public/admin shells pass. The first browser run reproduced 13 px inherited create inputs; the fix sets form input text to 1 rem (16 px). Failure screenshots/traces/reports are retained under ignored local review artifacts. Current phone, tablet and text-enlargement captures were visually reviewed.

The sample-data preview was rebuilt and verified, with no push, deployment or hosted data mutation. Native installed-device and physical screen-reader/keyboard checks remain unverified; the updated Maestro journey is ready for a disposable test account.

### Pull-request validation — 2026-10-03

After incorporating `main` at `3144320`, all 490 Vitest tests and aggregate/per-file coverage gates pass, along with 113 native Jest tests with coverage and Expo Doctor 20/20. The 21 accessibility cases across Chromium and iPhone WebKit, six editorial/account workflows and nine public smoke cases pass. Content freshness, lint, all workspace typechecks, production build and fresh production-only artifact readiness/public/admin shells pass. Notebook language navigation, native drawing/scroll contexts and the existing keyboard-tap policy are preserved during integration. The user requested a pull request after the local visual review; no deployment or hosted editorial mutation is included. Installed native accessibility checks remain open.

### Polish validation — 2026-10-03

Reviewed against `main` at `dec1c2d`: 576 Vitest tests with aggregate/per-file coverage gates, 147 native Jest tests with coverage, Expo Doctor 20/20, seven editorial/account browser workflows, 24 Chromium/iPhone WebKit accessibility cases and 15 public smoke cases pass. Content freshness, brand/game export checks, authored Python verification, lint, all workspace typechecks, production build, fresh production-only HTTP startup and the packaged game smoke pass.

The review reproduced and fixed stale clipboard feedback, missing clipboard recovery, long-link proposal overflow and focus loss after filtering out the open draft. Tests also cover comment/fact-confirmation discard, account-name normalization and each phone language/admin link. Twelve deliberately broken behavior variants fail the regression tests. Failure traces and review evidence remain private. No production deployment or hosted Supabase/Buffer mutation was performed; installed native accessibility checks remain open.

## Open Questions

Installed native VoiceOver/TalkBack, large-text, keyboard and safe-area checks remain open. Broader adoption uses the same primitive as existing screens are revised.

## Decision Log

- `2026-10-03`: Keep one responsive design system. Use content-width container queries for the editorial panes, visible touch labels, 48 px/dp actions, growing rem typography and normal-flow action bars; align native edit guards and keyboard mechanics.

- `2026-10-02`: Add one shared action primitive, reuse existing select/composer behavior, and make editorial review the first reference. Keep approval labeled and supporting details expandable.

## Documentation Updates

The docs hub, orientation, engineering overview, adaptive/editorial contracts, root and E2E READMEs, component inventory, and changelog link this contract.

## Thread Handoff Prompt

`Read docs/features/design-system.md and the owning feature doc before UI work. Reuse Button, Dropdown, and existing compositions. Preserve workflow guards, update tests, inspect phone/desktop rendering, and document intentional deviations. Complete installed native accessibility checks before claiming native release readiness.`
