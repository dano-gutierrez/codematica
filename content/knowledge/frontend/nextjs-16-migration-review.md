---
title: Next.js 16 Migration Review For Senior Teams
slug: frontend/nextjs-16-migration-review
summary: A hard migration checklist for Next.js 16 covering codemods, Cache Components, proxy.ts, async request APIs, image changes, and rollout risk.
track: Front-End Development
topic: Next.js Migration
difficulty: senior
tags:
  - nextjs
  - migration
  - upgrade
  - proxy
  - breaking-changes
prerequisites:
  - Next.js 15 App Router experience
  - CI and rollout ownership
  - Production incident review
diagramRefs: []
status: published
---
## Migration Is A Risk Review

A Next.js 16 migration is not just a dependency bump. It changes defaults and surfaces in areas that affect correctness: caching APIs, async request APIs, routing and prefetch behavior, image defaults, middleware naming, bundler defaults, and removed or deprecated configuration. Treat the upgrade as a product risk review.

The official codemod can do mechanical work. It cannot decide whether stale data is acceptable, whether a custom webpack assumption works under Turbopack, or whether a legacy `dynamic` config was masking a design bug.

## Recommended Order

1. Record current Next.js, React, Node, package manager, and deployment runtime versions.
2. Run the official upgrade codemod in a dedicated branch.
3. Fix TypeScript and lint errors without changing product behavior.
4. Audit route segment configs and decide whether Cache Components changes their meaning.
5. Audit request-time APIs, params, search params, metadata, image routes, and sitemap code for async changes.
6. Validate middleware-to-proxy migration and any edge assumptions.
7. Run content, unit, integration, and browser journeys that cover cached, dynamic, and mutation-heavy pages.
8. Roll out with monitoring for stale data, navigation failures, server errors, image regressions, and build performance changes.

## proxy.ts And Network Boundaries

Next.js 16 replaces the middleware naming direction with `proxy.ts` to make the network boundary clearer. The name matters because teams often put too much application logic into middleware. Proxy code should stay small, predictable, and safe for the runtime it runs in.

The `proxy` convention runs on the Node.js runtime and cannot be configured for Edge. Teams that still require Edge middleware must keep the deprecated `middleware` convention while planning a supported migration. Treat a filename rename as a runtime review, not only a codemod result.

## Cache Components Adoption

Do not turn on Cache Components and then recreate the previous model with page-wide flags. Remove obsolete `force-dynamic` usage when it only forced request-time behavior. Replace old `revalidate` and `fetchCache` decisions with local cached scopes where the output can be safely reused.

Cache Components requires the Node.js runtime. Validate that constraint before enabling it on routes that previously declared `runtime = "edge"`.

## Breaking-Change Checklist

- Node.js `20.9+` and TypeScript `5.1+` are the minimum supported toolchain versions.
- Synchronous compatibility for `cookies`, `headers`, `draftMode`, route `params`, and page `searchParams` is removed.
- Turbopack is the default for both `next dev` and `next build`; a detected custom webpack config fails the default build until it is migrated or the build explicitly uses `--webpack`.
- Every parallel-route slot needs an explicit `default.js` or `default.tsx` fallback.
- Review `next/image` changes, especially local query-string allowlists, the four-hour default minimum cache TTL, allowed quality values, local-IP blocking, and redirect limits.

## Release Criteria

A migration is ready when the team can explain which route configs were removed, which cached scopes were added, which async request APIs changed shape, which routes remain intentionally dynamic, and which browser journeys prove navigation, forms, auth, images, and reading flows still work.

## One-Minute Brief

A Next.js 16 upgrade is a boundary and caching audit. Let codemods handle syntax, but make humans own cache semantics, request-time APIs, proxy behavior, routing changes, and rollout monitoring.

## Official Source Anchors
This lesson is anchored to official Next.js documentation and release material. The repository manifest and lockfile define the version under test.
- [Next.js 16 release notes](https://nextjs.org/blog/next-16)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Caching with Cache Components](https://nextjs.org/docs/app/getting-started/caching)
- [Migrating to Cache Components](https://nextjs.org/docs/app/guides/migrating-to-cache-components)
- [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [fetch API reference](https://nextjs.org/docs/app/api-reference/functions/fetch)
- [updateTag API reference](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [revalidateTag API reference](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
