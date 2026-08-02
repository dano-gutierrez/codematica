---
title: What force-dynamic Means In Next.js 16
slug: frontend/nextjs-16-force-dynamic
summary: A senior explanation of export const dynamic equals force-dynamic, its previous-model cache behavior, and why Cache Components changes the recommendation.
track: Front-End Development
topic: Next.js Route Segment Config
difficulty: senior
tags:
  - nextjs
  - force-dynamic
  - route-segment-config
  - cache-components
  - ssr
prerequisites:
  - Next.js App Router routes
  - Server-side rendering
  - fetch caching basics
diagramRefs: []
status: published
---
## The Short Answer

In a Next.js App Router page or layout, `export const dynamic = 'force-dynamic';` was a route segment config from the previous caching model. It told Next.js to render that route for each request and to force the route's server `fetch` calls away from persistent caching. In previous-model terms, it was the App Router equivalent of request-time SSR plus segment-wide no-store fetch behavior.

For teams using Next.js 16 with Cache Components, the official migration guidance is different: remove it. With Cache Components, pages are dynamic by default and caching is opt-in through `"use cache"`, `cacheLife`, and related APIs.

```ts
export const dynamic = 'force-dynamic';
```

## What It Did In The Previous Model

The previous model exposed route-level switches such as `dynamic`, `revalidate`, and `fetchCache`. `dynamic = 'force-dynamic'` forced dynamic rendering for the route segment. It also made the route behave as though every server `fetch` in that segment opted out of caching, and as though the segment's fetch cache policy were force-no-store.

That mattered because older App Router caching could cache `fetch` results depending on where the request was discovered and which route settings existed. A developer surprised by stale data often reached for `force-dynamic` to make the whole segment request-time. It worked, but it was broad.

## Why It Became A Blunt Tool

`force-dynamic` can be appropriate when an entire route is truly per-request and every server fetch should bypass persistent cache. It is also easy to overuse. It can throw away useful caching for stable shell content, product copy, navigation data, or expensive shared queries.

A route-level dynamic switch can hide the more precise decision: which data must be fresh, which data can be cached by tag, and which UI can stream independently?

## Next.js 16 With Cache Components

Cache Components changes the default posture. Dynamic code runs at request time unless you explicitly cache a page, component, or function. That means `force-dynamic` is no longer the normal way to ask for fresh rendering. The modern review should look for accidental caching, missing Suspense boundaries, or an incorrectly cached function, not for a missing segment-level dynamic flag.

```ts
import { cacheLife, cacheTag } from 'next/cache';

async function getSharedCatalog() {
  'use cache';
  cacheLife('hours');
  cacheTag('catalog');
  return db.catalog.findMany();
}
```

## Migration Review

When you see `dynamic = 'force-dynamic'` in a Next.js 16 app, do not delete it blindly. First identify why it was added. Common reasons include stale dashboard data, authentication-dependent rendering, search params, cookies, draft mode, or confusion around `fetch` caching. Then replace the old route-wide signal with the smallest correct policy.

## One-Minute Brief

`dynamic = 'force-dynamic'` used to mean: render this route on every request and do not persistently cache its server `fetch` calls. In Next.js 16 with Cache Components, request-time work is already the default. The better question is what should be explicitly cached.

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
