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
