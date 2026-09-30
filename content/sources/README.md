# Primary Sources

Store canonical metadata for external primary sources cited by authored content here.

- Use stable lowercase IDs and authoritative URLs.
- Record provider, attribution, `lastVerifiedAt`, and upstream version/commit/maturity when available.
- Add license metadata only when verified; a public URL does not grant redistribution rights.
- Knowledge frontmatter, exercises, and source-backed paths reference catalog IDs through `sourceRefs`.
- `kind: "source"` path nodes open a published local companion when one exists; otherwise they open the catalog URL.
- Source-linked companions must teach and summarize without copying large portions of upstream work.
- Refresh the verification date only after checking the URL, version, maturity, attribution, and scope.

Run `npm run content:check` after any source change. Never hand-edit the generated content index.

- `rtk-query.json` anchors the RTK curriculum to official docs and pinned releases/source files. Reverify the npm version, release notes, and both case-study/current source paths when refreshing the dated baseline.
- `product-engineering-interview.json` contains only general MDN, Google Cloud, Google SRE, and OpenTelemetry references for the company-neutral interview pack. Keep employer identities and identifying URLs out of source metadata. Change verification dates only after checking the actual technical sources.

Interview questions can declare `sourceRefs`, validated at build time and required when a source-required path references the interview. Keep private brief provenance anonymous; cite public technical documentation for the authored explanations.

`react-async-state.json` records React's state-snapshot, update-queue, setter, and effect-cleanup references for the supplementary delayed-callback lesson and checkpoint. Code examples are original and tested from their canonical Markdown fences.
