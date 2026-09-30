---
title: RTK Query Cache Identity and Invalidation
slug: frontend/rtk-query-cache-and-invalidation
summary: Design cache keys and tags for tenant-safe author lists, distinguish retention from freshness, and debug stale data with concrete invalidation scenarios.
track: Front-End Development
topic: RTK Query
difficulty: senior
tags: [redux, rtk-query, cache, invalidation, interview]
prerequisites: [RTK Query fundamentals]
sourceRefs: [rtk-cache, rtk-invalidation, rtk-create-api, rtk-pagination]
status: published
---
## Three Questions Before Choosing a Flag

1. **Identity:** which endpoint arguments change the returned representation?
2. **Retention:** how long should unused data remain in memory?
3. **Freshness:** which events require a new read?

Consider a support dashboard that switches between tenants. `prepareHeaders` adds an authorization header, but that header does not automatically become part of the default cache key. Put a non-secret tenant/account discriminator in arguments when it affects results, and clear protected cached data when the authenticated identity changes. The server must still authorize every request. Tokens themselves do not belong in cache keys.

**Bad:** serialize every list request to the endpoint name to “improve cache hits.” Search terms and tenants then collide. **Better:** use normal serializable arguments such as `{ tenantId, search, sort, page }`; customize serialization only with an explicit explanation of equivalent responses. [createApi serialization](https://redux-toolkit.js.org/rtk-query/api/createApi#serializequeryargs).

## Retention Is Not Freshness

| Control | Meaning | Common mistake |
| --- | --- | --- |
| `keepUnusedDataFor: 60` | Seconds to retain an entry after the final subscriber leaves | Assuming it refreshes every minute |
| `refetchOnMountOrArgChange: 30` | At subscription time, revalidate if the last successful result is old enough | Treating it as a running timer |
| `refetchOnFocus` / `refetchOnReconnect` | Revalidate subscribed queries on those events with listener wiring | Expecting a background app to receive browser events automatically |
| `pollingInterval: 30_000` | Poll in milliseconds while subscribed | Confusing its units with the seconds-based options |
| `refetch()` | Explicit request for a current query | Using it to repair malformed persisted state |

If two components subscribe at t=0, one leaves at t=10, and the last leaves at t=40, a 60-second retention window expires around t=100 unless something subscribes again. A component that stays mounted all day can keep an old result all day without a freshness policy. [Cache lifetime](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior).

## Tags Describe Dependencies

Standalone `taggedApi.ts`. Example server routes return full authors and an unpaginated tenant list. Tenant identifiers are encoded in URLs and tag IDs; the query arguments still define cache identity.

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

type Author = { id: string; name: string };
type Scope = { tenantId: string };
const listId = (tenantId: string) => JSON.stringify([tenantId, 'LIST']);
const itemId = (tenantId: string, id: string) => JSON.stringify([tenantId, id]);
const root = (tenantId: string) => `tenants/${encodeURIComponent(tenantId)}/authors`;

export const taggedApi = createApi({
  reducerPath: 'taggedApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Author'],
  endpoints: (build) => ({
    getAuthors: build.query<Author[], Scope>({
      query: ({ tenantId }) => root(tenantId),
      providesTags: (result, _error, { tenantId }) => [
        { type: 'Author', id: listId(tenantId) },
        ...(result ?? []).map(({ id }) => ({
          type: 'Author' as const, id: itemId(tenantId, id),
        })),
      ],
    }),
    getAuthor: build.query<Author, Scope & { id: string }>({
      query: ({ tenantId, id }) => `${root(tenantId)}/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, { tenantId, id }) => [
        { type: 'Author', id: itemId(tenantId, id) },
      ],
    }),
    renameAuthor: build.mutation<Author, Scope & { id: string; name: string }>({
      query: ({ tenantId, id, name }) => ({
        url: `${root(tenantId)}/${encodeURIComponent(id)}`,
        method: 'PATCH', body: { name },
      }),
      invalidatesTags: (_result, error, { tenantId, id }) => error ? [] : [
        { type: 'Author', id: itemId(tenantId, id) },
        { type: 'Author', id: listId(tenantId) },
      ],
    }),
  }),
});
```

The list tag exists even for an empty result. A successful rename invalidates the author's detail and the collection, whose order might depend on name. The success-only error policy is illustrative; ambiguous network failures may require reconciliation because a write could have reached the server. Tags match within one API slice. Matching **subscribed** entries refetch; matching **unsubscribed** entries are removed. Tags do not directly edit results or normalize entities. [Automated refetching](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching).

## The Page You Cannot See Can Still Matter

A paginated table shows page three. Deleting a record on page one changes total count and which rows belong on page three. Page three never provided the deleted record's entity tag. Use a scoped collection/`PARTIAL-LIST` tag for changes affecting list membership, counts, or ordering, in addition to detail tags. Use distinct scopes for independent filtered collections when useful. [Pagination invalidation](https://redux-toolkit.js.org/rtk-query/usage/pagination).

**Bad:** invalidate every API tag after every keystroke. This adds traffic while hiding incorrect dependencies. **Better:** identify exactly which server projections may change, start with correct collection invalidation, and narrow it only after measuring behavior.

## Delayed Invalidation in RTK 2.x

The default `invalidationBehavior: 'delayed'` waits for pending queries and mutations in that API to settle, then processes invalidations together. This avoids some races but can delay refresh indefinitely if requests remain continuously pending. A completed HTTP query plus a socket opened in `onCacheEntryAdded` is different from a `queryFn` that never resolves. Reproduce the issue before switching to `'immediately'`, which has different race risks. [API invalidation policy](https://redux-toolkit.js.org/rtk-query/api/createApi#invalidationbehavior).

## Interview Drill: “My Mutation Worked, but the List Is Stale”

Explain your diagnosis: “I will inspect the endpoint and arguments, the tags the list actually provided, whether the mutation returned a handled error, whether these endpoints share an API, and whether delayed invalidation is waiting. Then I will check whether the new HTTP response is itself stale from another cache.”

Follow-up: if invalidation causes a request but the view stays stale, inspect selectors and copied state. If there is no request, inspect subscription state and tag matching. If the request returns old data, inspect server consistency, HTTP caching, and replica lag. Fix the layer responsible for the stale data.
