# @codematica/ui

Shared React Native-compatible Codematica UI.

Screens in this package use React Native primitives, shared tokens, and platform adapters for navigation, progress, auth, links, and Mermaid rendering. Web can keep legacy Tailwind routes while native uses these screens directly; routes can then migrate one at a time.

The shared screen set includes the discovery home, section catalogs, Japanese lookup/dictionary detail screens, always-visible Japanese path/flashcard/alphabet-guide shortcuts, embedded and path-based native writing practice, interview collections, and the read-only native view of web exercise rubrics and project files. Handwriting rendering uses `react-native-svg`; assisted mode labels and validates only the next stroke. Internal Markdown character links route through the native navigation adapter, while search/scoring logic stays in `@codematica/core`.
