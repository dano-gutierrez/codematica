# @codematica/ui

Shared React Native-compatible Codematica UI.

Screens in this package use React Native primitives, shared tokens, and platform adapters for navigation, progress, auth, links, and Mermaid rendering. Web can keep legacy Tailwind routes while native uses these screens directly; routes can then migrate one at a time.

The shared screen set includes the discovery home, section catalogs, Japanese lookup/detail screens, native writing practice, interview collections, and the read-only native view of web exercise rubrics and project files. Handwriting rendering uses `react-native-svg`, while discovery/search logic, correctness, and assisted completion stay in `@codematica/core`. React/TypeScript execution remains in the web Sandpack component rather than a native WebView runtime.
