# Native code layout regression

Jest cannot measure native layout or dispatch real touch gestures. `code-layout.mjs`
uses an existing **agent-device** phone simulator/emulator session to open the
bundled BFS lesson and verify that horizontal swipes move its code source while
the surrounding prose, code container, and navigation keep the same bounds. It
checks reverse scrolling, source containment, and vertical scrolling from code.
No credentials, remote content, or additional npm dependencies are needed. The runner
was validated with agent-device 0.20.3; the Maestro flow uses the repo-pinned 2.8.0.

With a Codematica build installed, open one session per platform and run:

```bash
agent-device open com.codematica.app --platform ios --device "iPhone 17" --session snippets-ios
npm run mobile:e2e:code-layout -- --session snippets-ios
agent-device open com.codematica.app --platform android --device S24 --session snippets-android
npm run mobile:e2e:code-layout -- --session snippets-android
```

For Expo Go, start this worktree's Metro server and open its emitted project URL
in Expo Go with agent-device first. Dismiss Expo's first-run developer menu. Pass
`--app host.exp.Exponent` on iOS or `--app host.exp.exponent` on Android and
`--url exp://127.0.0.1:8081/--/docs/programming/bfs-dfs-fundamentals` (adjust the
host/port to the running server; Android can use `10.0.2.2` to reach host loopback
without relying on a session-owned `adb reverse` mapping). In this workspace, Expo CLI's typed-route
generator may need `NODE_PATH="$PWD/apps/mobile/node_modules"` when starting
from the repo root. Use `npm run dev -w @codematica/mobile -- --port 8081 --host lan`;
`--localhost` can bind only IPv6 on macOS while device URLs use IPv4.

The test preserves snapshots, before/after screenshots, and measured bounds under
`test-results/native-code-layout/<session>/<timestamp>/`. Failures also retain a screenshot;
reruns keep the previous run's evidence.
Use `--artifacts` for a different output root. The script leaves the session open
for inspection; close it with `agent-device close --session <session>` afterward.

The related `.maestro/code-layout.yaml` runs in the existing Android/iOS EAS release
lane. It verifies the real lesson's code viewport, both swipe directions, following
prose, and navigation, and captures screenshots. The geometry assertions are in
the local agent-device runner; Maestro screenshots still need visual review.

## Notebook layout and handwriting

Use disposable simulator/emulator notebooks with agent-device 0.20.3. Open
`/languages/japanese/notebooks`, create the single-character prompt `あ`, and keep
that page open. These checks add one repetition and exercise Undo; they are not
intended for a learner's saved page. iOS snapshots use points. Android snapshots
use pixels; pass its density ratio (`adb shell wm density` divided by 160).

```bash
npm run mobile:e2e:notebook-layout -- --session notebooks-ios
npm run mobile:e2e:notebook-gestures -- --session notebooks-ios
npm run mobile:e2e:notebook-layout -- --session notebooks-android --pixel-ratio 3
npm run mobile:e2e:notebook-gestures -- --session notebooks-android --pixel-ratio 3
```

`notebook-layout.mjs` requires at least 180pt/dp of paper visible on entry and
checks containment beside tablet navigation. `notebook-gestures.mjs` draws rough
あ away from the target cell using real contacts and extra pen lifts, rejects a
missing loop and a tap, waits for error ink to expire, verifies Undo reaches the
accepted character, then scrolls with two fingers without adding a repetition.
It also requires the notebook to stay on screen and the paper bounds to stay
fixed during writing and feedback. Review the before/scrolled/returned screenshots
to verify the ruled rows actually moved and returned. Reopen the saved notebook
after relaunch to check retained ink. Run on iPhone, Android, and iPad portrait
and landscape; keep a settled snapshot after rotation before choosing coordinates.
The return pan retraces the upward contacts so both fingers stay within a short
landscape viewport. Begin from a freshly opened page, rather than an unfinished
overscroll from an earlier failed gesture.

The one-finger Maestro notebook flow scrolls the outer page from its 2% gutter
in both directions. Use bounded gutter swipes before returning to All notebooks
after Restart sheet, then retain the 100%/20-second target check and verify that
no rejected-ink feedback appeared. A center swipe through the paper is drawing,
so it does not test page navigation. The real two-finger runner remains separate.

Evidence is preserved under `test-results/native-notebook-{layout,gestures}/`.
The Android runner uses timed pans because this CLI version's fast fling can
cancel vertical contacts. Its batch syntax is version-specific; revalidate the
runner when upgrading agent-device. Expo Go checks the SVG fallback. Installed
PencilKit and physical Pencil checks are separate; follow the checklist in
[Japanese writing notebooks](../../../docs/features/japanese-writing-notebooks.md#deferred-physical-ipad-checklist).

## Installed Maestro readiness

For public layout checks, run every `.maestro/*.yaml` except the full chapter
`game-chapter.regression.yaml` and configured `linkedin-admin.yaml`. This selects
15 credential-free flows; the chapter and configured account journey are separate
gates. Run the public set at normal and enlarged system text. Record the installed
artifact digest, flow hashes, JUnit report and inspected screenshots for each run.
Keep failed runs alongside later passes.

Scroll actual controls or nearby section headings into view before asserting or
tapping, and hide the keyboard before inspecting search results. For a tall code
block, find its language heading below the nearby usage note, distinct from the
language choice button; a clipped parent does not prove its source is readable.
Keep 100% visibility, a 20-second
timeout per search and no extra centering requirement. Long solutions use section
waypoints rather than increasing the timeout. See the official
[relational selectors](https://docs.maestro.dev/reference/selectors/relational-selectors)
and [scrollUntilVisible](https://docs.maestro.dev/reference/commands-available/scrolluntilvisible)
contracts. Inspect captures separately from automation results.

Browse and Learn display a pending state while their shared local search hook
waits. Wait for the settled numeric result count before traversing results; a
native text field can display the complete query before JavaScript receives its
final event. Keep the exact destination checks and avoid fixed sleeps or a
hardcoded delay as a substitute for visible readiness.

At enlarged Android text, the editor's selection menu can put Select all behind
its overflow button. The code-entry flows open `android:id/overflow` only when
running on Android and Select all is absent. Selecting all, replacing once and
asserting the exact authored source remain mandatory; the conditional never skips
those checks. See the official
[conditions](https://docs.maestro.dev/maestro-flows/flow-control-and-logic/conditions)
contract.

The credential-free `.maestro/learn-discovery.regression.yaml` checks compact Learn cards, search/clear and the path destination on a fully visible card. It complements the native component tests and `.maestro/offline-learning.yaml`. Its settled-count assertion accepts platform text casing while retaining the exact result count. Retain JUnit and failure screenshots for each installed platform; a Jest pass does not establish device execution.

Run the additional credential-free journeys on a disposable installed app:

```bash
maestro test apps/mobile/.maestro/practice-recovery.regression.yaml apps/mobile/.maestro/review-and-recovery.regression.yaml --format junit --output test-results/native-review-recovery.xml
```

`skill-review-save.regression.yaml` additionally checks acknowledged skill ratings, real process-restart restoration and another deliberate recall. Retry/commit-then-reject/conflict/storage-fault cases use injected native unit and route tests; these are not installed fault-injection proof.

`guided-lab-and-sources.regression.yaml` follows the ML path's prerequisite section and local source companion into the lab. It checks source disclosure, private notes, acknowledged completion, a restart that returns to the beginning and clears transient notes, and the next lesson. Long roadmap traversal uses nearby canonical stage headings while retaining each 20-second full-visibility locator bound. Run at normal and enlarged system text and inspect source, note, completion, restart and continuation captures.

They cover cloze keyboard correction, checkpoint completion/restart, missing-page recovery, passive scroll/source navigation, vocabulary examples, deck reveal/reset and pending audio approval. Inspect captured feedback, completion and navigation screens; reported full container visibility can still include clipped content. Passive feeds and vocabulary decks have no completion action. No draft audio is approved by these flows.

After `launchApp`, assert `mobile-nav-learn` before opening a warm deep link. The
Android activity can launch before the React navigator subscribes to URL events.
The first local Release pass delivered links too early; the same URL and unchanged
login assertions passed after waiting for navigation. Use visible UI readiness,
never a fixed delay. Scroll to path cards and activity nodes outside the viewport
before tapping. Run only on disposable device data; the editorial flow additionally
requires a disposable signed-in project with publishing disabled.

## Configured account and editorial journey

`flows/auth-account.regression.yaml` covers wrong-password recovery, successful
email sign-in, the account disclosure, admin navigation, draft discard/refinement,
manual creation for analysis, sign-out and denied admin access afterward. It calls
`.maestro/linkedin-admin.yaml` for the editorial work. This opt-in flow lives outside
the default credential-free `.maestro` lane.

At enlarged text, the sign-in confirmation can fall below the fields. The flow
starts one upward swipe at the page edge before its bounded confirmation search,
avoiding the fields' horizontal scrolling. After expanding the account, it also
scrolls to the complete email before asserting it. Keep the success, Continue learning,
account, editorial and sign-out assertions and their original deadlines. Inspect
captures separately; a reachable confirmation does not prove the entire form fits
in one viewport.

Run it only with an installed build configured for a disposable test project and
an allowlisted test admin. Pass `EDITORIAL_TEST_EMAIL` and
`EDITORIAL_TEST_PASSWORD` and a fresh material fixture’s `EDITORIAL_TEST_POST_ID`
with Maestro’s `-e` parameters from private local test
configuration; shell environment variables alone are not substituted by Maestro. Keep publishing
disabled and both Buffer identifiers unset; never use a hosted personal draft or
production account. The flow does not approve posts. Repeated runs use a new fixture rather than
deleting or reusing earlier pending refinement jobs. Retain the JUnit report,
screenshots and command metadata privately: evaluated commands include test
credentials and screenshots can include account/draft text.

Run at normal and enlarged system text. Hide the keyboard between separate form
fields, scroll the actual control fully into view, and inspect captures: Android
can report a clipped container as fully visible. Keep explicit 20-second locator
bounds and preserve earlier failed artifacts. Verify the created manual draft's
exact text and pending refinement in the test database, with no approval or
publication records.

```bash
maestro test -e EDITORIAL_TEST_EMAIL=<test-email> -e EDITORIAL_TEST_PASSWORD=<test-password> \
  -e EDITORIAL_TEST_POST_ID=<fresh-test-post-id> \
  --udid <test-device> --format JUNIT --output <private-report.xml> \
  --debug-output <private-artifacts> e2e/flows/auth-account.regression.yaml
```

The command runs from `apps/mobile`. Native login fields expose
`mobile-login-email` and `mobile-login-password` alongside their accessible labels.
For a local HTTP fixture, use a separately labeled test artifact with a network
exception limited to loopback; restore generated manifests and normal build
outputs afterward. Never deploy that fixture artifact or weaken production
network policy. A local password journey does not verify Google/Apple OAuth,
provider callbacks, screen-reader speech or an installed iOS build.

## Native screen-reader checks

Use a disposable emulator or simulator and verify the installed artifact before
interacting. Android's `-datadir` option alone can still use the named AVD's
existing writable images. Select private data, cache and encryption images
explicitly with `-data`, `-cache` and `-encryption-key`; inspect the process's open
image paths and compare the installed APK digest with the tested artifact.
Preserve existing images and user data. Do not reset an unrelated device.

Enable the real TalkBack service. Verify forward/backward focus, activation,
software-keyboard entry, menu dismissal and focus return. An injected shell swipe
or accessibility-tree lookup does not establish TalkBack gesture behavior. For an
emulator, its console's touchscreen events provide hardware input; use a
persistent connection when timing matters. Keep console authentication private.
TalkBack's temporary **Display speech output** setting can capture announcement
text, but does not prove audible speech quality. Record that distinction and
restore the original service, speech-display and keyboard settings afterward.
Retain private captures, artifact identity and cleanup evidence. A focused Learn
journey does not replace wider TalkBack, VoiceOver or physical-device acceptance.

### Local search runtime checks

Learn and Browse use the fixed bundled matcher in a hidden offline WebView. Keep their existing settled-count, title, navigation and 20-second readiness assertions when testing normal and enlarged text. Confirm the installed artifact contains the current generated runtime, then test without credentials/network. Readiness, invalid replies, source/index ownership, deadline, renderer failures and retry are covered below the device layer; a passing installed happy path does not prove failure injection. Preserve every failed timing capture rather than increasing the deadline to obtain a pass.
