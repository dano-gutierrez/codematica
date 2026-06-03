# Codematica

Codematica is a mobile-first, gamified software engineering knowledge base. V1 browses, renders, and searches repo-authored Markdown files, including embedded and external Mermaid diagrams plus local interactive system-design case-study flows.

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- plain Markdown content under `content/knowledge/`
- Mermaid diagram files under `content/diagrams/`
- React Flow case-study walkthroughs under `content/case-studies/`
- generated local search index at `src/generated/content-index.json`
- optional Supabase sync scaffold

## Getting Started

```bash
npm install
npm run content:index
npm run dev
```

Open `http://127.0.0.1:3100`.

## Useful Commands

```bash
npm run content:index
npm run content:check
npm run typecheck
npm run lint
npm test
npm run e2e:smoke
```

## Content

Markdown is canonical. Add articles to `content/knowledge/` with the frontmatter contract defined in `src/lib/content/schema.ts`. Add external Mermaid diagrams to `content/diagrams/`, then reference them from article frontmatter with `diagramRefs`. Add optional read-only case-study walkthrough JSON to `content/case-studies/`, then reference it from article frontmatter with `caseStudyFlowRef`.

Supabase is optional for V1. To sync indexed content later, configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, apply the migration in `supabase/migrations/`, and run:

```bash
npm run content:sync:supabase
```
