# @codematica/ui

Shared React Native-compatible Codematica UI.

Screens use React Native primitives, shared tokens, and platform adapters for navigation, progress, auth, links, and Mermaid rendering. Native uses them directly. Web can retain legacy Tailwind routes and migrate one at a time.

Block code uses the fixed dark surface across Markdown, interviews, review, and diagram source. Both fenced and indented Markdown share `markdownBlockCodeStyle`; inline snippets keep the readable prose chip. `apps/mobile/src/__tests__/code-styles.test.tsx` guards these styles. User-selectable themes are deferred. See the code-surface audit in `docs/features/markdown-knowledge-browser.md`.

Shared screens cover discovery, catalogs, Japanese Learn/Review/Dictionary/Resources, N5 flashcards and practice catalogs, dictionary details, embedded/path stroke practice, IME-backed open answers, approval-gated listening, interview collections, and read-only native web-exercise rubrics. Stroke handwriting uses `react-native-svg`; sentence answers use a real `TextInput` so iPadOS Scribble can recognize Pencil writing on-device. Japanese text exposes `ja-JP` accessibility language hints; font scaling remains enabled.

## Adaptive UI

See `docs/features/adaptive-ui.md` for persistent phone navigation, desktop/iPad sidebars, design rules, and validation gaps. Existing screens and feature logic are reused. Navigation coverage lives in `AppHeader.test.tsx`, native `adaptive-navigation.test.tsx`, Playwright `adaptive-navigation.smoke.spec.ts` / `adaptive-layout.regression.spec.ts`, and Maestro `adaptive-navigation.yaml`.

## Private editorial screen

`LinkedInAdminScreen` composes `AppScreen` and existing design tokens with the shared editorial store. NativeNavigation accepts an admin-membership flag for its private destination. Database RLS and RPC guards enforce authorization. Native review supports manual creation, Unicode bold/italic/bullets/plain text, required analysis for manual drafts, edits, proposals, approval, rejection, withdrawal, sources and history. See `docs/features/linkedin-editorial.md`.
