---
title: RTK Query Production Architecture and Testing
slug: frontend/rtk-query-production-architecture
summary: Design API boundaries, selectors, streaming lifecycles, native listeners, Next.js ownership, logout cleanup, and behavioral tests for production RTK Query.
track: Front-End Development
topic: RTK Query
difficulty: senior
tags: [redux, rtk-query, architecture, testing, react-native, nextjs, interview]
prerequisites: [RTK Query cache and mutation behavior]
sourceRefs: [rtk-code-splitting, rtk-streaming, rtk-hooks, rtk-nextjs, rtk-listeners, redux-testing, rtk-prefetch]
status: published
---
## Draw the API Boundary Before Splitting Files

Usually start with one API slice per base URL/coherent backend domain. It gives related endpoints a shared invalidation namespace and avoids multiplying middleware. This is a default, not a law that unrelated backends must share authentication, timeouts, or lifecycle policy. Each API slice needs its own unique reducer path and middleware registration. [API organization](https://redux-toolkit.js.org/rtk-query/api/createApi).

**Bad:** one `createApi` per screen, all declaring `Author` tags, assuming those tags cross API boundaries. **Better:** share a base API and use endpoint injection to split feature files. Import the injected API's hooks so TypeScript sees the added endpoint types. [Code splitting](https://redux-toolkit.js.org/rtk-query/usage/code-splitting).

```ts
// baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Author'],
  endpoints: () => ({}),
});
```

```ts
// authorApi.ts
import { baseApi } from './baseApi';
export const authorApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAuthor: build.query<{ id: string; name: string }, string>({
      query: (id) => `authors/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Author', id }],
    }),
  }),
  overrideExisting: false,
});
export const { useGetAuthorQuery } = authorApi;
```

Register `baseApi` once. Do not register its middleware again for every injected module. Generated OpenAPI clients can reduce endpoint typing work, but review response schemas, tags, errors, authorization, and generated changes before assuming domain correctness.

## Select Less, Allocate Deliberately

For a large list, `selectFromResult` can subscribe a component to a smaller result. Its returned fields are compared shallowly. Returning a newly allocated `filter()` array every time defeats stable selection; returning an outer object whose selected values stay stable is expected. Use memoization for derived collections and a stable empty array outside the component. [Hook selection](https://redux-toolkit.js.org/rtk-query/api/created-api/hooks#selectfromresult).

Fragment using the foundational `useSearchAuthorsQuery` hook:

```tsx
const { author } = useSearchAuthorsQuery({ search: '' }, {
  selectFromResult: ({ data }) => ({
    author: data?.find((entry) => entry.id === authorId),
  }),
});
```

Search-as-you-type also needs an input policy: debounce the submitted search argument, use `skipToken` before an appropriate threshold, and show which term the results represent. `useLazyQuery` is useful for imperative triggers; `trigger(arg, true)` can prefer a cached value. Avoid adding a second effect-driven fetching layer around a query hook.

Prefetch on likely navigation when useful, but prefetching is not a long-lived subscription or a freshness guarantee. Mounting the destination query establishes its own subscription. [Prefetching](https://redux-toolkit.js.org/rtk-query/usage/prefetching).

## Match Side Effects to Their Lifetime

Use `onQueryStarted` for a request lifecycle, such as optimistic mutation work. Use `onCacheEntryAdded` for the lifetime of a subscribed/cached resource, such as a live author-activity channel. It does not mean “one socket per React render.” Cache removal may happen after a retention delay.

Endpoint lifecycle fragment; `openChannel`, `parseEvent`, and revision checks are application-specific adapters. The HTTP query must settle independently of the stream:

```ts
async onCacheEntryAdded(arg, { cacheDataLoaded, cacheEntryRemoved, updateCachedData }) {
  let close: (() => void) | undefined;
  try {
    await cacheDataLoaded;
    close = openChannel(arg, (raw) => {
      const event = parseEvent(raw); // Validate and scope the event before use.
      if (!event) return;
      updateCachedData((draft) => {
        if (event.revision > draft.revision) {
          draft.count = event.count;
          draft.revision = event.revision;
        }
      });
    });
    await cacheEntryRemoved;
  } catch {
    // Initial data may never become available before removal.
  } finally {
    close?.();
  }
}
```

This is a lifecycle skeleton, not a complete reliable transport. A real stream needs a snapshot-plus-cursor handshake or replay so events between the HTTP snapshot and connection are not lost, reconnect/backoff, authorization refresh, gap detection, and resync. Catch expected transport failures with a visible recovery policy. Out-of-order messages must not overwrite newer revisions. [Streaming updates](https://redux-toolkit.js.org/rtk-query/usage/streaming-updates).

## Browser, Native, and Server Have Different Lifecycles

In the browser, `setupListeners` enables focus/reconnect integration. React Native must connect platform lifecycle/connectivity signals through an appropriate custom listener handler; browser window events are not a native networking strategy. Clean up subscriptions and listeners when their owning scope ends. [Listener setup](https://redux-toolkit.js.org/rtk-query/api/setupListeners).

In Next.js App Router, avoid a server-global Redux store shared across requests. Create request-safe store/provider boundaries; React Server Components should not read/write the Redux client store. Official guidance recommends RTK Query for client-side fetching and server `fetch` for server-component reads. Framework caching is separate from the browser RTK cache, so explain how a write refreshes each affected owner. [Next.js guidance](https://redux-toolkit.js.org/usage/nextjs).

On logout/account change, stop protected subscriptions, transition the UI/session boundary, reset each relevant API with `api.util.resetApiState()`, and handle its persisted cache through the defined storage policy. Prevent an in-flight refresh response from resurrecting the previous identity. Do not erase anonymous drafts merely because a cache needs resetting. Query arguments help isolate data but never replace server authorization.

## Test Outcomes, Not Hook Plumbing

Use a real configured store and controlled transport such as MSW or a deterministic fake base query. Mocking `useGetAuthorQuery` to return the desired UI bypasses the behavior you are trying to prove. [Redux testing guidance](https://redux.js.org/usage/writing-tests).

| Layer | Scenario and useful assertion |
| --- | --- |
| Unit | Schema rejects malformed payload; error adapter maps timeout; persistence adapter preserves drafts |
| Store integration | Two subscribers, same argument: one request; different tenant: separate data |
| Store integration | Mutation changes server fixture; subscribed detail/list update through real tags |
| Store integration | Overlapping edit failure cannot restore an older server revision |
| Store integration | Old persisted state goes through actual restore configuration, then starts a fresh request |
| Browser/device | Cold load, refresh failure, retry, filter switch, pagination failure, logout/login |
| Lifecycle | Last unsubscribe, retention expiry, removal, abort, socket cleanup using controlled time |

Create a fresh store per test; clean up subscriptions and reset handlers/timers. Observe request counts and final states without coupling assertions to undocumented action order. A UI passing after a mocked hook says nothing about a blocked query thunk.

## Production Review Prompt

“Our feed duplicates rows, makes too many calls, and sometimes shows another account's avatar. What do you inspect?” Start with server cursor/identity contracts, serialized arguments, actual API instances, subscription counts, stale selectors, and account transition order. Measure before optimizing. Add redacted endpoint/status/timing telemetry and a bounded stale/offline UI; avoid logging tokens and full query arguments containing private search text.
