---
title: Modern RTK Query — Infinite Queries, Schemas, and Version Traps
slug: frontend/rtk-query-modern-apis
summary: Learn RTK 2.6–2.12 infinite queries, runtime schema validation, page refetch policies, cancellation changes, and migration checks beyond the dependency bump.
track: Front-End Development
topic: RTK Query
difficulty: senior
tags: [redux, rtk-query, infinite-query, schema-validation, migration, interview]
prerequisites: [Query arguments, Cache invalidation, TypeScript]
sourceRefs: [rtk-release-26, rtk-release-27, rtk-release-29, rtk-release-211, rtk-release-2112, rtk-release-212, rtk-infinite, rtk-create-api, rtk-migration]
status: published
---
## Date the Answer Before Giving It

The npm registry and official releases report **2.12.0** as the current published `@reduxjs/toolkit` version on **2026-09-09**. This is a dated baseline, not an evergreen “latest” claim. The incident lesson examines an application on **2.2.8**. RTK Query is included in the RTK package.

| Release | Capability or change | Interview consequence |
| --- | --- | --- |
| 2.0 | Delayed invalidation became the default; modern Redux/TS APIs | Know which pending work can delay a refresh |
| 2.6.0 | `build.infiniteQuery` | Old merge recipes are no longer the only option for scrolling feeds |
| 2.7.0 | Standard Schema validation | Types alone are no longer the endpoint's only declared contract |
| 2.9.0 | Subscription/polling improvements; abort pending work on cache-entry removal | Unmount and cache removal are distinct events |
| 2.11.0 | `refetchCachedPages` | Choose between refetching retained pages and resetting to one page |
| 2.11.2 | Abort fallback where `DOMException` is unavailable; infinite-hook type fix | React Native compatibility deserves runtime tests |
| 2.12.0 | Exported hook option types; infinite `isSuccess` and batching fixes | Recheck loading UI when switching infinite query arguments |

Sources: [2.0 migration](https://redux-toolkit.js.org/usage/migrating-rtk-2), [2.6](https://github.com/reduxjs/redux-toolkit/releases/tag/v2.6.0), [2.7](https://github.com/reduxjs/redux-toolkit/releases/tag/v2.7.0), [2.9](https://github.com/reduxjs/redux-toolkit/releases/tag/v2.9.0), [2.11](https://github.com/reduxjs/redux-toolkit/releases/tag/v2.11.0), [2.11.2](https://github.com/reduxjs/redux-toolkit/releases/tag/v2.11.2), [2.12](https://github.com/reduxjs/redux-toolkit/releases/tag/v2.12.0).

## Infinite Query: Collection Identity Versus Page Position

An infinite endpoint separates the **query argument** identifying the collection from the **page parameter** locating the next page. Its cached result contains `pages` and `pageParams`. A cursor should not accidentally become a different collection key; a tenant or filter must not disappear from that key.

Standalone `feedApi.ts`. Fictional API contract: a forward cursor feed accepts `cursor` and returns `{ items, nextCursor }`, with `null` at the end. `maxPages` is deliberately omitted so the first example has straightforward forward-only semantics.

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

type FeedArg = { tenantId: string; topic: string };
type Page = { items: { id: string; title: string }[]; nextCursor: string | null };

export const feedApi = createApi({
  reducerPath: 'feedApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  endpoints: (build) => ({
    getFeed: build.infiniteQuery<Page, FeedArg, string | null>({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        url: `tenants/${encodeURIComponent(queryArg.tenantId)}/feed`,
        params: { topic: queryArg.topic, cursor: pageParam ?? undefined },
      }),
    }),
  }),
});
export const { useGetFeedInfiniteQuery } = feedApi;
```

Use `data?.pages.flatMap(page => page.items)` to render retained items. Use `hasNextPage`, `isFetchingNextPage`, and `isFetchNextPageError` for pagination controls. Next-page errors should leave existing pages visible and offer retry. For a load-more handler, check `hasNextPage && !isFetching` to avoid competing work in the same entry; RTK also guards overlapping requests. [Infinite query behavior](https://redux-toolkit.js.org/rtk-query/usage/infinite-queries).

**Bad:** request page after page in a plain query, collapse all arguments with serialization, and mutate one unbounded array without a reset/filter policy. **Better:** use infinite queries for growing collections, or ordinary queries with `{ page, filters }` for independent numbered pages. For infinite queries, consider `maxPages` to bound memory; provide the required previous-page callback when enabling it and understand how discarded pages can be reached again.

### Refresh Is a Product Decision

By default, refetching an infinite cache entry sequentially refetches its retained pages. This can correct cursor relationships but may cost many reads. Starting with **2.11.0**, `refetchCachedPages: false` refetches only the **first cached page** and shrinks the entry to one page. It does not refresh page one while preserving every later page unchanged. With a bounded window, “first cached” may not mean the original beginning of the feed.

```ts
// Inside a component using the infinite hook:
const feed = useGetFeedInfiniteQuery({ tenantId: 'demo', topic: 'typescript' });
// An explicit refresh action that intentionally collapses retained pages:
const refreshWindow = () => feed.refetch({ refetchCachedPages: false });
```

Preserve scroll position or announce/reset it deliberately when collapsing data. Stable server cursors and deterministic ordering matter; deduplicating repeated IDs in the UI cannot recover omitted records. [2.11 refetch policy](https://github.com/reduxjs/redux-toolkit/releases/tag/v2.11.0).

## Validate the Wire Contract

Standalone `validatedApi.ts`, requiring a **Standard Schema-compatible Zod version**, such as Zod 4, in the scratch project. The fictional server returns an ISO string in `updatedAt`. RTK **2.7+** supports schema validation; examples target **2.12.0**.

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';

const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  updatedAt: z.string().datetime(),
});

export const validatedApi = createApi({
  reducerPath: 'validatedApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  catchSchemaFailure: () => ({
    status: 'CUSTOM_ERROR' as const, error: 'Unexpected author response shape',
  }),
  endpoints: (build) => ({
    getAuthor: build.query<z.infer<typeof authorSchema>, string>({
      query: (id) => `authors/${encodeURIComponent(id)}`,
      responseSchema: authorSchema,
    }),
  }),
});
```

`responseSchema` validates the final result; use `rawResponseSchema` for the wire shape before `transformResponse`. Schema failure is fatal by default and can bypass normal error handling such as tag invalidation. `catchSchemaFailure` converts it into your base query's handled error shape. `onSchemaFailure` is a notification hook, not the conversion. Keep a date as a serializable string in Redux and derive a `Date` for display. [Schema API](https://redux-toolkit.js.org/rtk-query/api/createApi#schema-validation).

**Bad:** cast `unknown as Author` and describe it as runtime validation. **Better:** reject malformed responses and test the visible failure path. `skipSchemaValidation` removes a runtime check; use it only after measuring cost and agreeing where validation actually occurs.

## Migration Questions That Go Beyond Compilation

Can a pre-upgrade persisted cache be safely restored? Does a next-page error keep existing results visible? Does changing tenant/filter clear the previous argument's display? Does a custom base query honor `api.signal`? Does native startup have the required platform APIs? RTK 2.9+ abort-on-removal does not mean every component unmount cancels shared work immediately.

Record installed RTK, React Redux, TypeScript, and any persistence/schema/codegen packages. Use a clean dependency install, inspect release notes across skipped versions, test old storage through the real restore path, and record rollback implications. Current improvements do not make application-specific persistence, identity, or retry contracts automatic.
