# Primary Sources

This folder stores canonical metadata for external primary sources referenced by authored content.

- Use stable lowercase IDs and authoritative URLs.
- Record provider, attribution, `lastVerifiedAt`, and upstream version/commit/maturity when available.
- Add license metadata only when verified; a public URL does not grant redistribution rights.
- Knowledge frontmatter, exercises, and source-backed paths reference catalog IDs through `sourceRefs`.
- `kind: "source"` path nodes open a published local companion when one exists; otherwise they open the catalog URL.
- A source-linked companion summarizes and teaches; it must not copy large portions of the upstream work.
- Refresh the verification date only after checking the URL, version, maturity, attribution, and scope.

Run `npm run content:check` after any source change. Never hand-edit the generated content index.

