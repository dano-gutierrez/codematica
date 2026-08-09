# @codematica/ui

Shared React Native-compatible Codematica UI.

Screens in this package use React Native primitives, shared tokens, and platform adapters for navigation, progress, auth, links, and Mermaid rendering. Web can keep legacy Tailwind routes while native uses these screens directly; routes can then migrate one at a time.

The shared screen set includes discovery, catalogs, Japanese Learn/Review/Dictionary/Resources destinations, N5 flashcards and practice catalogs, dictionary details, embedded/path stroke practice, IME-backed open answers, approval-gated listening, interview collections, and read-only native web-exercise rubrics. Stroke handwriting uses `react-native-svg`; sentence answers use a real `TextInput` so iPadOS Scribble can recognize Pencil writing on-device. Japanese text exposes `ja-JP` accessibility language hints; font scaling remains enabled.
