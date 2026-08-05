# @codematica/ui

Shared React Native-compatible Codematica UI.

Screens in this package use React Native primitives, shared tokens, and platform adapters for navigation, progress, auth, links, and Mermaid rendering. Web can keep legacy Tailwind routes while native uses these screens directly; routes can then migrate one at a time.

The shared screen set includes discovery, catalogs, Japanese Learn/Review/Dictionary/Resources destinations, dictionary details, embedded/path writing practice, interview collections, and read-only native web-exercise rubrics. Handwriting uses `react-native-svg`, validates only the next assisted stroke, and sizes from compact phone/Split View to 480–560 pt iPad canvases. Japanese text exposes `ja-JP` accessibility language hints; font scaling remains enabled.
