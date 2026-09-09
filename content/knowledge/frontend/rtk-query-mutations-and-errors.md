---
title: RTK Query Mutations, Optimism, and Error Recovery
slug: frontend/rtk-query-mutations-and-errors
summary: Handle mutation results, optimistic patch races, pessimistic reconciliation, authentication refresh, retry safety, and ambiguous network failures.
track: Front-End Development
topic: RTK Query
difficulty: senior
tags: [redux, rtk-query, mutation, optimistic-updates, errors, interview]
prerequisites: [Cache tags, Promise rejection handling]
sourceRefs: [rtk-mutations, rtk-manual-updates, rtk-custom-queries, rtk-fetch-base-query]
status: published
---
## A Mutation Is an Attempt, Not a Durable Job

Mutation hooks return a trigger and state. Separate hook instances do not share mutation results by default; `fixedCacheKey` can share a result between instances, but it is neither a query key nor a server idempotency key. [Mutation behavior](https://redux-toolkit.js.org/rtk-query/usage/mutations).

**Bad:** `await renameAuthor(args); showSuccess();` assumes a handled RTK error rejects that promise. **Better:** unwrap if control flow needs exceptions. This handler assumes the generated mutation trigger and UI notification functions are in scope:

```ts
try {
  const saved = await renameAuthor({ tenantId, id, name }).unwrap();
  showSuccess(`Saved ${saved.name}`);
} catch (error: unknown) {
  showSaveError(error); // Narrow the error; do not assume error.message exists.
}
```

Without unwrap, inspect the returned `{ data }` or `{ error }` result explicitly. Disable repeat submissions when appropriate, but do not mistake a disabled button for protection against retries or multiple devices.

## Optimistic, Pessimistic, or Invalidate?

| Scenario | Reasonable default | Why |
| --- | --- | --- |
| Rename a reading-list label | Optimistic detail update and later reconciliation | Reversible, visible, low stakes |
| Publish a paid entitlement | Confirm server result before showing authoritative success | Server authorization and write outcome matter |
| Update a heavily filtered admin table | Invalidate affected collections | Local membership/order rules can be complicated |
| Save several overlapping edits | Serialize per entity, or use revisions and reconcile | Naive inverse patches can undo newer work |

These are product choices. RTK Query supplies mechanisms; it cannot infer your transaction rules.

## A Bounded Optimistic Example

Standalone `optimisticApi.ts`. The fictional server returns the canonical author after PATCH. The UI must allow only one rename at a time **per author across this store** for simple rollback to be safe. This example has only a detail endpoint; a real app must separately invalidate or patch every affected list.

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

type Author = { id: string; name: string };
export const optimisticApi = createApi({
  reducerPath: 'optimisticApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Author'],
  endpoints: (build) => ({
    getAuthor: build.query<Author, string>({
      query: (id) => `authors/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Author', id }],
    }),
    renameAuthor: build.mutation<Author, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `authors/${encodeURIComponent(id)}`, method: 'PATCH', body: { name },
      }),
      async onQueryStarted({ id, name }, { dispatch, queryFulfilled }) {
        const patch = dispatch(optimisticApi.util.updateQueryData(
          'getAuthor', id, (draft) => { draft.name = name; },
        ));
        try {
          const { data: saved } = await queryFulfilled;
          dispatch(optimisticApi.util.updateQueryData(
            'getAuthor', id, (draft) => { Object.assign(draft, saved); },
          ));
        } catch {
          patch.undo();
          // A failed response may hide a committed write: reconcile as well.
          dispatch(optimisticApi.util.invalidateTags([{ type: 'Author', id }]));
        }
      },
    }),
  }),
});
```

`updateQueryData` patches an **existing** endpoint/argument entry. If there is no entry, its recipe does not create one. Use `upsertQueryData` when deliberate creation/replacement is needed. For pessimism, wait for `queryFulfilled` before applying the confirmed response. [Manual cache updates](https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates).

### The Rollback Race Interviewers Ask About

Initial name is A. Edit one patches B; edit two patches C. Edit one fails late and undoes its patch, restoring A over C. Even replacing data with an earlier successful response can clobber a newer edit. For overlapping writes, invalidate and read authoritative state after outstanding work settles, serialize per entity, or use server revisions with a conflict policy. “Immer handles it” is not a concurrency design.

## Errors Need a Transport Contract

`fetchBaseQuery` exposes numeric HTTP statuses and string statuses such as `FETCH_ERROR`, `PARSING_ERROR`, `TIMEOUT_ERROR`, and `CUSTOM_ERROR`. A custom `baseQuery`/`queryFn` should return `{ data }` or `{ error }` and catch expected exceptions itself. Do not turn failures into empty success arrays; the UI would show “no authors” instead of “could not load.” [fetchBaseQuery error types](https://redux-toolkit.js.org/rtk-query/api/fetchBaseQuery).

Standalone error formatter fragment:

```ts
export function describeError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    if (error.status === 401) return 'Please sign in again.';
    if (error.status === 403) return 'You do not have access.';
    if (error.status === 'TIMEOUT_ERROR') return 'The request timed out.';
    return 'Could not complete the request. Try again.';
  }
  return 'An unexpected error occurred.';
}
```

Keep useful request IDs and endpoint names in telemetry without logging tokens or private response bodies. Narrow a caught error before reading fields; a TypeScript assertion does not make a server payload safe.

## Refresh Tokens Without a Stampede

For simultaneous 401s, a reauthentication wrapper can coordinate one refresh with a mutex/shared promise, update credentials, and retry waiting requests once. Use the raw base query for the refresh route so it cannot recursively refresh itself. Release the lock in `finally`; check that the session is still the same before applying refreshed credentials. Stop on refresh failure and clear protected state. A 403 usually represents a permission problem, not a reason to keep refreshing. [Custom base queries and reauthorization](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries).

**Bad:** wrap all mutations in automatic unlimited retries. A purchase may have committed before the network disconnected. **Better:** bound retries for transient reads; use server idempotency keys and a status/reconciliation endpoint for operations that must not repeat. An aborted request means the client stopped waiting; it does not prove the server rolled back.

## Interview Follow-ups

Explain how you would test a delayed first failure after a successful second edit, an absent detail cache entry, and a server-normalized name. Then describe a network timeout after the server commits. The strongest answer separates what the client observed from what the server may have done.
