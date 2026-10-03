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

Evidence is preserved under `test-results/native-notebook-{layout,gestures}/`.
The Android runner uses timed pans because this CLI version's fast fling can
cancel vertical contacts. Its batch syntax is version-specific; revalidate the
runner when upgrading agent-device. Expo Go checks the SVG fallback. Installed
PencilKit and physical Pencil checks are separate; follow the checklist in
[Japanese writing notebooks](../../../docs/features/japanese-writing-notebooks.md#deferred-physical-ipad-checklist).
