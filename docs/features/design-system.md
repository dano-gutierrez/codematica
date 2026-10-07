# Codematica Design System

## Snapshot

- Status: `in_progress`
- Last updated: `2026-10-07`
- Current state: Shared controls and compositions are applied across web and native learning, account, editorial and campaign screens. The app-wide audit records verification; visual review and complete installed-native accessibility checks remain open.
- Target outcome: New and revised screens share controls, spacing, hierarchy, and accessible interactions.
- Code touchpoints: `apps/web/src/components/{Button,ButtonLink,Dropdown}.tsx`, `apps/web/src/app/globals.css`, `packages/ui/src/{Button,screens}.tsx`, `packages/ui/src/tokens.ts`.
- Primary tests: `Button.test.tsx`, `LinkedInAdmin.test.tsx`, `LinkedInPostText.test.tsx`, `linkedin-admin.regression.spec.ts`.

## One-Minute Brief

Use a quiet light canvas, a clear editing or reading surface, and concise controls. Reserve strong color for actions and status. Reuse the components below before introducing another control. The [app-wide audit](app-wide-design-audit.md) tracks adoption and verification across every reachable web and native route. The LinkedIn review page remains the editorial reference.

## Outcome / Contract

- Every action has a descriptive accessible name. Secondary actions can use icons on wide mouse-driven screens; touch and narrow layouts show their text labels without hover.
- Keep the main action visibly labeled. Approval, publishing, payment, and destructive confirmation state their effect in text.
- Secondary actions use a familiar icon and consistent semantic color. Color is an additional cue, never the only explanation.
- Use one spacing scale and control geometry. Align related controls on the same baseline.
- Keep errors, pending work, and consequential choices visible. Put supporting material behind a named disclosure.
- Check responsive layout, keyboard behavior, contrast, and workflow guards before accepting new UI.

## Current State

`Button` owns button geometry, semantic tones, busy/disabled state, and icon tooltips. `Dropdown` remains the shared Radix select. `LinkedInPostText` owns the framed composer and selection-based formatting. The editorial page uses these components. `ButtonLink` supplies the same visual language with actual link semantics and can render Lucide icons on the server. Native `Button` is extracted from the existing shared screen primitive and owns visible scalable labels, 48 dp targets, tones, busy/disabled/selected state. Learning, account and editorial screens use these primitives; campaign controls keep their painted treatment with the same target, naming, reflow and pending-state rules. The audit records route/state verification and remaining device checks.

## Scope

### In Scope

Shared controls, all reachable web/native layouts and flows, readable hierarchy, concise copy, responsive behavior, keyboard interaction, and accessible state. See the route matrix in app-wide-design-audit.md.

### Out Of Scope

New publishing permissions, dark appearance, replacement of the painted campaign identity, content/scoring changes, and production deployment.

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
| Targets | `--ui-control-size: 44px` on wide fine-pointer web; 48 px on narrow/touch web; 48 dp for native actions. Use at least 8 px between separate actions. |
| Icons | 18 px in actions, 24 px in section identity. Use Lucide; hide decorative SVGs from assistive technology. |
| Typography | 28–32 px page title; 20 px section title; 16 px content; 14 px controls; 12–13 px supporting text. Prefer semibold hierarchy to all-caps paragraphs. |
| Focus | 2 px teal outline, 3 px offset; preserve keyboard visibility. |
| Motion | Short color feedback only. Respect the existing reduced-motion rule. |

Decorative animation must pause when its region is outside the viewport or its route is covered. Derive native visibility from measured bounds and viewport size so enlarged text, rotation and keyboard resizing remain correct; avoid fixed scroll cutoffs. Preserve the campaign's visible artwork and animation identity.

Keep view-switching controls reachable when a large canvas or map scrolls to the current item. The native campaign places its wrapping Map/List toolbar outside the terrain scroller; each view establishes a useful starting position.

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
- Learn discovery cards: show titles and metadata without description previews, including search and Keep reading. Let height follow the content. Reuse the existing discovery/resume components with their summary option; full catalogs may keep descriptions.
- Native Learn card names include the title, type/category and displayed difficulty; resume names retain the type. Editorial collection names include title, topic and review status to help distinguish matching titles. Keep compact description hints absent and preserve existing full-catalog hints.
- Native Learn shortcuts wrap with text-scaled minimum widths rather than squeezing labels into one row. Keep search placeholders short; the visible/accessibility label carries the full search scope.
- Native Learn section headers stack their title and View all action at enlarged text when effective width (`width / fontScale`) falls below 350 pt and scale exceeds 1.4. Give the title a full row rather than a narrow leftover column. Preserve the compact header row at normal phone/tablet sizes.
- Android live system text-size changes keep the current activity, route and transient input mounted. The native prebuild hook forwards configuration changes and refreshes React Native's dimensions after configuration dispatch. Shared `AdaptiveText` refreshes only the native Text child when font scale changes, retaining parent/form state and standard Text props. Third-party Markdown text reparses on dimension changes; sibling diagram disclosure state remains mounted. The campaign map refreshes its terrain subtree to obtain fresh measurements and recenter the current level; its toolbar and game state stay mounted. Recheck the current screen in both directions; a cold large-text launch alone does not prove preservation during a live change.
- Native Learn and Browse share a local search hook with a 300 ms typing pause for expensive lookups. Announce the pending state politely, hide old-query results and cancel pending work on newer input, clear or unmount. Defer Browse filter lookups while typing and show its empty message only after results settle. Keep the text field immediately editable and preserve shared search semantics.
- Native editorial queue: group creation and refresh in a wrapping action row; keep search visible and optional filter groups in one disclosure with their active count. Closing filters preserves their values, and Reset filters restores the collection.
- Native collection/editor/create transitions start at the top and dismiss the previous keyboard through `AppScreen`'s opt-in scroll reset. Typing, background refresh and failed saves do not reset the view or dismiss the active keyboard.
- Details: named disclosures with counts or short hints. Required verification and failures stay outside collapsed details.
- Copy: an action verb and its object. Remove repeated explanations. Describe publishing once beside its action.

#### Pages, forms, and reading

- `ui-page` owns a 1200 px maximum and 16 px inner gutters; the app shell already adds desktop clearance. Child tools do not repeat whole-page padding.
- `ui-page-heading` gives a 28–36 px growing title and one short supporting sentence. Avoid duplicate page titles in tool panels.
- `ui-field`, `ui-input`, and `ui-form` provide visible labels, 16 px input text, 10 px corners, a contrast-safe border and 16 px field gaps. Set autofill, input mode, and field-specific hints. Password inputs distinguish existing from new credentials.
- `ui-filters` wraps according to available width; two-line `Dropdown` triggers grow from 56 px and wrap long values. Do not truncate the selected option.
- Use named word/source/outline disclosures to keep supporting catalogs readable; search and required instructions remain visible. Notebook tools use shared controls while paper/cell geometry stays fixed.
- `ui-result-row` frames a repeated destination. `ui-disclosure` holds optional sources, outlines and metadata; it does not hide failures or required task instructions.
- Reading prose is limited to about 768 px. Sources and the article outline remain reachable near the introduction. Code and diagrams retain their own horizontal scroll surfaces.
- `ui-notice` announces status/errors with a suitable live role. Retry actions name the failed operation and preserve typed data. Sign-in separates authentication errors from local-progress sync errors; Retry sync reuses the authenticated session.
- Learning feedback belongs near the active choices. Japanese matching places its live status before the choice grid so the first incorrect-pair message is visible without scrolling past every tile; web viewport and installed native journeys pin this placement.
- Painted campaign panels grow with text. Keep headings and controls in normal flow above decorative layers, and use minimum terrain heights rather than fixed heights. Native viewport culling uses actual measured panel height. Map/list controls stay reachable outside the scrolling terrain.
- Web `Button` defaults to neutral/secondary. `ButtonLink` has the same defaults and always carries a visible label. Import `ButtonLink` directly from its server-compatible module in Server Components; a Lucide component function must not cross a client boundary.
- Native `Button` keeps its existing primary/success defaults for caller compatibility. New compositions specify `variant` and `tone` explicitly: secondary/neutral for utilities, primary/success for the next consequential step, warning for retries/reset, and danger for sign out/rejection. It never depends on hover.
- Completed questionnaire restart, skill-review recall reset and writing-match repeat use the same warning tone as lab restart and recipe reset. Filter clearing remains a neutral utility; this visual rule does not change grading or persistence.
- Native `Disclosure` shares the action primitive, shows an expansion indicator and announces its expanded state. Web uses native `details`/`summary` with `ui-disclosure`. Interview assessment notes, criteria and red flags stay reachable through named disclosures; the question stays visible. Recipe controls and language choices precede lengthy solution text.

#### Async actions and recovery

Use `busy` on shared web/native `Button` to preserve its label, announce the pending state and disable repeat taps. Guard the handler synchronously when it creates or writes a record. A spinner does not replace the action name. Keep form values through failure; Retry repeats the failed operation rather than restarting authentication, grading or creation.

Device-local persistence may fail. Keep the current work in memory, state that it is not saved, and offer a specific retry. Only show “saved” after the write succeeds. Sync acknowledgment removes only unchanged records in the submitted snapshot; progress recorded during the request remains buffered.

Native skill-review ratings acknowledge device storage explicitly. Keep the chosen skill/rating and original recall snapshot through a failed save; Retry save must not grade again. Serialize reads and writes for the shared key, reconcile a possibly committed write, and require Reload progress if that skill changed. Unreadable persisted data stays intact. Optional remote sync must not delay local practice or imply a cloud acknowledgment.

Guided labs keep choices and private working notes through completion failures. Await the progress callback before confirming completion, offer Retry completion and reject repeated pending taps. Practice again clears transient work and returns to the beginning without removing earned progress. Focus the web completion heading; native announces completion and resets its existing page scroller on restart. Give a replacement action its own identity so a success-to-restart color transition cannot temporarily reduce contrast.

#### Native compositions

Reuse `SearchField` in shared screens for a visible label, a 16 dp input, the software-keyboard Search key and a visible Clear search action that returns focus to the field. Associate the label’s stable per-instance `nativeID` with the input’s `accessibilityLabelledBy` on Android; keep `accessibilityLabel` for iOS. Use `useId` so two mounted copies cannot reference the same label. This follows the [React Native accessibility contract](https://reactnative.dev/docs/accessibility#accessibilitylabelledby-android). A shortened placeholder does not replace the visible search scope. Browse and practice filters show counts and an actionable empty state. Path summaries lead to the path once; milestones and activities belong on its detail screen.

Use plain sections for readings, examples, path units and related diagrams. Reserve frames for repeated destinations and drawing/code/diagram tools. Name related dictionary destinations and stroke models for assistive technology. A diagram preview can disclose source; a load failure keeps the source visible and provides Retry preview.

#### New-page checklist

1. Reuse the shared page/screen shell and the closest existing screen pattern. Use one page title, ordinary reading width and the documented gutters.
2. Choose an explicit tone and treatment for each action. Keep the main action and every touch action labeled; provide an accessible name for icon actions and selected/expanded/busy states.
3. Keep required instructions, unsaved work, failures and consequential choices visible. Disclose optional metadata, source/history and secondary catalogs.
4. Use visible input labels, autofill/input modes, 16 px web input text, keyboard-aware native forms and specific retry controls. Preserve values and focus through errors.
5. Check phone, tablet/Split View and desktop at normal and enlarged text, keyboard navigation, reduced motion, safe areas and the real software keyboard. Code, diagrams and deliberate carousels own their horizontal scrolling.
6. Add the lowest useful regression tests and the changed user journey. Update the owning feature doc and this audit's route/state evidence. Separate source/browser proof from installed-device proof.

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
| iOS / Android native | Visible action text, 48 dp minimum targets, naturally wrapping text with system font scaling enabled, safe-area shell and keyboard-aware forms and editorial scroll views. No hover dependency. |

Web editorial typography uses rem units and growing controls. Reflow checks cover 320–1440 px, 200% text enlargement and short landscape screens, including long unbroken links in proposals. Keep input, source, proposal and validation text available; wrap long tokens instead of truncating them. Respect reduced motion and browser zoom.

Selecting a web draft moves focus to its heading. Returning restores the initiating collection button, or Search when filters removed that draft; creation focuses Title and cancelling returns to New post. Saved/dirty state is announced politely and explains how to unlock navigation. On both web and native, unsaved edits require save or explicit discard before switching drafts. Native keyboard-aware `AppScreen` is opt-in: handled taps reach formatting/actions while editing, dragging dismisses the keyboard, and iOS uses padding avoidance. Android uses height avoidance so the edge-to-edge window reserves keyboard space instead of covering the focused field. Keyboard show/hide must keep the same input and draft.

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
- `apps/web/src/components/ButtonLink.tsx`: server-compatible navigation with the same control contract.
- `packages/ui/src/Button.tsx`: extracted shared native action used by learning screens and account/login flows.
- `packages/ui/src/AdaptiveText.tsx`: scalable native text with live measurement refresh and preserved parent state.
- `apps/web/src/components/AppHeader.tsx`: shared navigation, separate Admin group, and reusable account disclosure with a labeled Sign out action.
- `apps/web/src/components/Dropdown.tsx`: accessible Radix filters; `triggerClassName` matches geometry.
- `apps/web/src/components/LinkedInPostText.tsx`: reusable composer and Unicode formatting.
- `apps/web/src/components/LinkedInAdmin.tsx`: reference layout and guarded action groups.
- `apps/web/src/app/globals.css`: control tokens and scoped editorial layout.
- `packages/ui/src/tokens.ts`: native palette, control borders and spacing.
- `docs/features/app-wide-design-audit.md`: complete route/state/platform scope and current evidence.

## Test Plan

- Unit: accessible icon names, visible primary text, disabled behavior, and formatting selection.
- Native: header and sidebar home links reserve at least 48 dp without a fixed height; pressing them opens the campaign home. Learn keeps five section shortcuts with scalable labels and omits its self-link on phone and tablet.
- Integration: collapsed supporting details, action semantics, text/comment/fact-confirmation discard, manual-create failure recovery, approval guards, and proposal adoption. Exercise delayed/superseded clipboard results, denied/unavailable clipboard recovery and retry.
- E2E: isolated RPC fixtures; existing create/refine/approve journeys plus keyboard tooltips, 44 px fine-pointer and 48 px touch controls, comment editing, draft navigation, axe accessibility, and overflow checks at 320, 390, 768, 1024, and 1440 px. Public `@design` matrices cover learning, practice, interviews, Japanese and every campaign level, including enlarged text.
- Classification: editorial cases use `@regression`; public navigation remains `@smoke`.
- Visual review: inspect desktop, phone and tablet captures with synthetic data. The first local pass was reviewed before the user requested a pull request.
- Commands: targeted component Vitest tests; `npm run test:coverage`; `npm run lint`; `npm run typecheck`; `E2E_PORT=3102 npm run e2e:linkedin`; `E2E_PORT=3102 npm run e2e:smoke`; production build and `npm run test:production:smoke`.
- Coverage thresholds and exclusions are unchanged. No content, migration or publishing-permission change.

## App-wide Validation — 2026-10-03

The current pass applies these standards to every web/native screen family while preserving campaign art. All 653 core/web tests and 287 native tests pass with coverage floors intact; lint, typechecks, content checks, production build and startup after a production-only install pass. The isolated editorial lane passes 45 Chromium/WebKit cases. Responsive/large-text matrices cover public learning, Japanese, interviews and every campaign level. The current Android Release APK also passes cold-process SQL entry/run offline with normal motion; complete chapter and installed iOS proof remain in the audit.

The complete WebKit lane passes 203 cases with bounded responsive worker groups; the revised Japanese/campaign matrices pass 274 phone/desktop Chromium cases. Every case, assertion and timeout is preserved. Earlier navigation/axe-page teardown failures and the unknown root cause remain recorded in [the audit](app-wide-design-audit.md). Fresh Android Release startup and iPhone/iPad Expo Go checks provide partial native evidence. Xcode 26.4+, installed iOS/regression lanes, real keyboards, native screen readers and physical Pencil validation remain required before all-platform release readiness. Whole-app user visual review precedes pushing this branch.

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

The review reproduced and fixed stale clipboard feedback, missing clipboard recovery, long-link proposal overflow and focus loss after filtering out the open draft. Tests also cover comment/fact-confirmation discard, account-name normalization and each phone language/admin link. Twelve deliberately broken behavior variants fail the regression tests. The browser lane now limits WebKit to one CI worker after two Linux-only game navigation failures; local repetitions passed, and all assertions/timeouts remain unchanged. Failure traces and review evidence remain private. No production deployment or hosted Supabase/Buffer mutation was performed; installed native accessibility checks remain open.

## Open Questions

The [app-wide audit](app-wide-design-audit.md) records current Android public and local account/editorial journeys at normal and enlarged text, including inspected capture limits and separately scoped keyboard checks. Installed iOS, complete keyboard/safe-area coverage, physical accessibility and VoiceOver/TalkBack acceptance remain open. Passing one journey or screenshot does not establish every route and state.

## Decision Log

- `2026-10-03`: Keep one responsive design system. Use content-width container queries for the editorial panes, visible touch labels, 48 px/dp actions, growing rem typography and normal-flow action bars; align native edit guards and keyboard mechanics.

- `2026-10-02`: Add one shared action primitive, reuse existing select/composer behavior, and make editorial review the first reference. Keep approval labeled and supporting details expandable.

## Documentation Updates

The docs hub, orientation, engineering overview, adaptive/editorial contracts, root and E2E READMEs, component inventory, and changelog link this contract.

## Thread Handoff Prompt

`Read docs/features/design-system.md and the owning feature doc before UI work. Reuse web Button/ButtonLink, native Button, Dropdown, and existing compositions. Continue the full route/platform scope in app-wide-design-audit.md. Preserve workflow guards, update tests, inspect phone/desktop rendering, and document intentional deviations. Complete installed native accessibility checks before claiming native release readiness.`

### Native search feedback

Learn and Browse use shared `LocalSearchFeedback`: concise failure text with a visible, warning-tone Retry search action. Pending search hides obsolete cards and avoids announcing an empty result. Clearing remains available while work is pending. The execution WebView contributes no visible layout, touch target or screen-reader item. Reuse [the local search hook](../../packages/ui/src/LocalSearch.tsx) and its ownership contract for these surfaces.
## Interview preparation integration

The interview tracker imports the shared Button and control styles. Keep those controls and its private tracker behavior when extending the app-wide redesign. Knowledge remains a web-only admin destination; LinkedIn and Interview preparation are available on web and native.


### October 7 integration checks

The LinkedIn design retains the current preparation, voice and Knowledge workflows. Shared control rules have one definition after merging the design styles already used by Interview preparation. Knowledge actions use the same Button geometry as the editor. Keep a return path when selected content is still loading or has failed; a hidden desktop Back control cannot be the only retry route. The overview/detail browser fixtures cover recovery at 390 and 1440 px, alongside the six-width touch/keyboard matrix. See [the editorial test plan](linkedin-editorial.md#main-integration-review--2026-10-07) for review fixes and validation limits.

Voice rules use shared disclosures: growing 44/48 px web targets, visible native indicators and announced expanded state. Collection navigation stays locked while rules are dirty or a save is pending. On-demand native draft loading retains a labeled return action through failure; returning invalidates the outstanding detail selection.
