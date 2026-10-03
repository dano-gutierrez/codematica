# @codematica/ui

Shared React Native-compatible Codematica UI.

Screens in this package use React Native primitives, shared tokens, and platform adapters for navigation, progress, auth, links, and Mermaid rendering. Web can keep legacy Tailwind routes while native uses these screens directly; routes can then migrate one at a time.

The shared screen set includes discovery, catalogs, Japanese Learn/Review/Dictionary/Resources destinations, N5 flashcards and practice catalogs, dictionary details, embedded/path stroke practice, IME-backed open answers, approval-gated listening, interview collections, and read-only native web-exercise rubrics. Stroke handwriting uses `react-native-svg`; sentence answers use a real `TextInput` so iPadOS Scribble can recognize Pencil writing on-device. Japanese text exposes `ja-JP` accessibility language hints; font scaling remains enabled.

## Adaptive UI

See `docs/features/adaptive-ui.md` for persistent phone navigation, desktop/iPad sidebars, design rules, and validation gaps. Existing screens and feature logic are reused. Navigation coverage lives in `AppHeader.test.tsx`, native `adaptive-navigation.test.tsx`, Playwright `adaptive-navigation.smoke.spec.ts` / `adaptive-layout.regression.spec.ts`, and Maestro `adaptive-navigation.yaml`.

## Restore the Signal

`src/game/` provides NativeGameMap/NativeGamePlay, NativeGameBoard, NativeGameScene, and NativeDistrictArt. Skia and Reanimated are direct native runtime dependencies and UI peer dependencies. Editors and graph controls remain accessible native UI; CSS/SQLite use the bundled isolated local WebView. Jest instruments these files; Maestro must prove installed-app behavior.

`NativeGameScene` measures its own container and applies core miniature transforms to Skia, including paused/reduced-motion frames and success opacity. The shared atlas contains the editable chibi robot parts, enemies and ground shadows.
