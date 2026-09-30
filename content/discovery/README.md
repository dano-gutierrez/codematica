# Discovery Curation

`home.json` defines the order of curated rows on web and native home screens.

- Every reference must resolve to published local content in the generated index.
- Keep rows short and varied; the full catalogs belong on their section routes.
- Section colors and presentation stay in application design tokens, not this content file.
- Run `npm run content:index` after changing curation and `npm run content:check` before shipping.
