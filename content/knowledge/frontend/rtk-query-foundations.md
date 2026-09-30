---
title: RTK Query Foundations for Interviews
slug: frontend/rtk-query-foundations
summary: Explain Redux Toolkit versus RTK Query, build a typed API, and reason about subscriptions, loading states, cache identity, and request ownership.
track: Front-End Development
topic: RTK Query
difficulty: practitioner
tags: [redux, rtk-query, react, typescript, interview, server-state]
prerequisites: [React hooks, TypeScript generics, HTTP requests]
sourceRefs: [rtk-overview, rtk-queries, rtk-hooks, rtk-cache]
status: published
---
## Your Interview Goal

Explain who owns a request, what identifies its cached result, and how the UI behaves when data becomes stale. Then defend the design under account switches, overlapping writes, and process restarts. Hook names alone do not explain those decisions.

This seven-part path covers a small API, a production incident, and a mock interview. Allow roughly three hours for reading, running examples in a scratch project, and answering the checkpoints; that is a study suggestion, not a completion requirement. Know React hooks, TypeScript, promises, and HTTP first. Use the final workshop for a timed rehearsal and the path's flashcards for quick review.

Examples target **Redux Toolkit 2.12.0**, verified on **2026-09-09**. RTK Query ships inside `@reduxjs/toolkit`; it has no separately selected runtime version. The later persistence case compares 2.2.8 explicitly. [Current release](https://github.com/reduxjs/redux-toolkit/releases/tag/v2.12.0).

## Redux Toolkit Is Bigger Than RTK Query

`configureStore` wires Redux; `createSlice` describes reducers and actions; Immer lets reducer recipes use mutation syntax against drafts. Keep local interaction state such as an open menu in React, and shared client state such as a multi-step draft in a slice when useful. RTK Query adds endpoint definitions, request lifecycles, caching, subscriptions, and generated hooks for server data. [RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview).

In a reading app, the server owns an author's profile and the followed-author list. A search input's unfinished text belongs to the UI. An offline draft may need durable local storage. Putting all three into an API cache confuses different ownership and recovery rules.

**Interview answer:** “I use RTK Query for reusable server reads and writes. I use ordinary state for client workflows. A thunk still makes sense for orchestration that does not benefit from an endpoint cache.”

## A Small API You Can Explain

Standalone `libraryApi.ts` example. The fictional server contract is `GET /api/authors/:id` returning an author and `GET /api/authors?search=...` returning an array. Use these routes for practice.

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type Author = { id: string; name: string; bio: string };

export const libraryApi = createApi({
  reducerPath: 'libraryApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/', timeout: 10_000 }),
  endpoints: (build) => ({
    getAuthor: build.query<Author, string>({
      query: (id) => `authors/${encodeURIComponent(id)}`,
    }),
    searchAuthors: build.query<Author[], { search: string }>({
      query: ({ search }) => ({ url: 'authors', params: { search } }),
    }),
  }),
});

export const { useGetAuthorQuery, useSearchAuthorsQuery } = libraryApi;
```

`build.query<Result, Arg>` uses one argument; bundle filters into a typed object. Importing from `query/react` generates React hooks. The framework-independent `query` entrypoint is useful outside React. `fetchBaseQuery` is a fetch wrapper with structured results, not Axios. A TypeScript result annotation does not validate JSON at runtime; the modern APIs lesson adds a schema.

Wire both reducer and middleware, then put the application under React Redux's `Provider` with this store. Omitting middleware breaks request/subscription behavior even if a reducer exists. [Queries](https://redux-toolkit.js.org/rtk-query/usage/queries).

```ts
// store.ts — a client SPA store, not a server-wide Next.js singleton.
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { libraryApi } from './libraryApi';

export const store = configureStore({
  reducer: { [libraryApi.reducerPath]: libraryApi.reducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(libraryApi.middleware),
});
setupListeners(store.dispatch);
```

## Render Data and Network Activity Separately

Standalone `AuthorPanel.tsx`, using the API above:

```tsx
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetAuthorQuery } from './libraryApi';

export function AuthorPanel({ id }: { id?: string }) {
  const { currentData, isFetching, isError, refetch } =
    useGetAuthorQuery(id ?? skipToken);

  if (!id) return <p>Choose an author.</p>;
  if (!currentData && isError) {
    return <button onClick={() => void refetch()}>Retry author</button>;
  }
  if (!currentData) return <p role="status">Loading author…</p>;
  return (
    <section aria-busy={isFetching}>
      <h2>{currentData.name}</h2>
      <p>{currentData.bio}</p>
      {isFetching && <p role="status">Updating…</p>}
      {isError && <p>Refresh failed; showing the last result.</p>}
    </section>
  );
}
```

`isLoading` describes the first load without data; `isFetching` also covers background requests. `data` can retain the latest result for a previous argument; `currentData` belongs to the current argument. That distinction matters when switching between people or tenants. `skipToken` expresses an unavailable argument without a fake ID or conditional hook call. Query state can have useful data and an error from a failed refresh simultaneously. [Hook return values](https://redux-toolkit.js.org/rtk-query/api/created-api/hooks).

**Bad:** `if (isFetching) return <FullScreenSpinner />`. Every background refresh removes useful content. **Better:** preserve the current result, show modest activity feedback, and provide a failure state. These choices depend on the product: stale reading recommendations may be acceptable; stale permissions must not authorize a write.

## Predict the Cache Before Running the Code

Within one API/store, two mounted `useGetAuthorQuery('a1')` calls share the entry and an in-flight request. A list endpoint containing author `a1` and the detail endpoint are separate cached documents. RTK Query does not create a global normalized entity graph. A new plain object with the same serializable field values normally produces the same default key; `useMemo` is not required merely to deduplicate it. [Cache behavior](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior).

**Bad:** copy every query result into `authorsSlice` in an effect. Invalidation then updates the cache while the UI reads the separate copy. **Better:** select data from the API cache; normalize a particular response with `createEntityAdapter` only when lookup patterns justify it. A deliberately editable draft can be a separate copy with an explicit reset/save contract.

## Interview Follow-ups

| Question | A strong answer includes |
| --- | --- |
| Why did two components issue one request? | Same endpoint and serialized arguments in the same API/store; shared subscriptions. |
| Does RTK Query replace Redux? | It is built on Redux and handles a particular server-state workflow. |
| Why does changing an ID briefly show the wrong person? | Inspect `data` versus `currentData` and any copied local state. |
| Query or mutation for a POST search? | Choose by semantics: an idempotent read can be a query even when transport uses POST. |
| Is `.unwrap()` required for every query hook? | No. Query hooks expose state; unwrap is useful when an imperative result needs promise-style success/failure handling. |

Before continuing, sketch the flow from hook to endpoint, cache key, middleware, HTTP response, reducer, and rerender. Explain which part survives a component unmount and which part cannot survive process death.
