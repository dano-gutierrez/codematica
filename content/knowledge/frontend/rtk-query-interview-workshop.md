---
title: RTK Query Interview Workshop and Production Scenarios
slug: frontend/rtk-query-interview-workshop
summary: Rehearse a 45-minute RTK Query interview with precise questions, model answers, flawed-code review, practical design scenarios, and a scoring rubric.
track: Front-End Development
topic: RTK Query
difficulty: principal
tags: [redux, rtk-query, interview, debugging, system-design, code-review]
prerequisites: [RTK Query path lessons]
sourceRefs: [rtk-cache, rtk-invalidation, rtk-manual-updates, rtk-persistence, rtk-infinite, rtk-create-api]
status: published
---
## A 45-Minute Mock Interview

Use 8 minutes for precise mechanics, 10 for code review, 12 for the incident, 10 for a system-design variant, and 5 to summarize tradeoffs and tests. This is a rehearsal format, not a claim about any company's hiring process. Say your assumptions before designing. Write or speak an answer before reading the model response.

## Round One: Specific Questions

| Interview question | Model answer and likely follow-up |
| --- | --- |
| What identifies a query entry? | Endpoint plus serialized arguments within the API/store. Follow-up: headers alone do not automatically partition it by account. |
| Do two equal object arguments need the same reference? | Plain serializable values normally share the default key; object identity alone is not the cache contract. Follow-up: avoid non-serializable arguments and version-sensitive behavior. |
| Does `keepUnusedDataFor` control stale time? | It controls retention after the final subscriber leaves. Follow-up: choose mount/focus/reconnect/polling/invalidation policy separately. |
| What is the difference between `data` and `currentData`? | Latest available hook data can belong to an earlier argument; currentData belongs to the current argument. Follow-up: identity transitions must not display previous protected data. |
| Does invalidating a tag immediately edit an entity? | No; it schedules matching subscribed entries for refetch or removes unused matching entries. Follow-up: RTK 2.x delayed invalidation may wait for pending work. |
| Are entities normalized across endpoints? | No. A list and a detail can hold independent copies. Follow-up: tags or deliberate updates must coordinate them. |
| When is `updateQueryData` a no-op? | When the exact endpoint/argument entry is absent. Follow-up: use upsert deliberately for creation, not accidental argument mismatch. |
| Why use `.unwrap()` on a mutation trigger? | To get result data or a thrown failure for ordinary try/catch control flow. Follow-up: a handled error otherwise lives in the returned result object. |
| Does `fixedCacheKey` prevent duplicate writes? | No; it shares mutation result state. Follow-up: idempotency requires a server operation contract. |
| `onQueryStarted` or `onCacheEntryAdded`? | Request work versus cache-entry lifecycle work. Follow-up: socket cleanup follows entry removal, not necessarily the first component unmount. |
| Does unmount always abort HTTP? | No; other subscribers and retention matter. Follow-up: modern removal-triggered abort still cannot undo a server commit. |
| What did newer RTK add? | Infinite queries in 2.6, schema validation in 2.7, refetchCachedPages in 2.11; examples here use 2.12.0. Follow-up: explain one concrete product tradeoff. |

Check mechanisms against [cache behavior](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior), [invalidation](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching), and [manual updates](https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates). The answers summarize earlier lessons; follow their source panels for the versioned details.

## Round Two: Review This Deliberately Bad Code

Assume an author list API changes the authorization header when the tenant changes. This fragment intentionally omits normal typing and application context so you can focus on behavior:

```tsx
// Deliberately bad endpoint fragment:
getAuthors: build.query({
  query: ({ tenantId, search }) => ({ url: '/authors', params: { search } }),
  serializeQueryArgs: ({ endpointName }) => endpointName,
  keepUnusedDataFor: 15,
});

// Deliberately bad component fragment:
const query = useGetAuthorsQuery({ tenantId, search });
useEffect(() => { if (query.data) setRows(query.data); }, [query.data]);
if (query.isFetching) return <Spinner />;
async function save() {
  await renameAuthor({ id, name });
  toast('Saved');
}
// Deliberately broad persist fragment:
const persistOptions = { whitelist: ['drafts', 'authorsApi'] };
```

### Review Findings

The custom serializer collapses tenants and search strings into one entry. Copying data creates another owner that can survive account changes. Full-screen loading hides existing results on every refresh. Fifteen seconds is unused retention, not a freshness guarantee. The save handler may announce success for a handled error. Persisting a whole API slice requires a migration and rehydration policy, especially around pending state.

Repair cache identity first; then read current scoped data, show background/error states separately, unwrap or inspect the mutation result, declare collection/detail invalidation, and define what belongs in durable storage. Add one behavioral test per observed failure. Do not promise that changing one flag resolves all six issues.

**Follow-up:** Which issue is highest priority? Cross-account display is a confidentiality risk. Fix and test scope boundaries first, while recognizing that server-side authorization remains mandatory. Do not present the cache key as a security boundary by itself.

## Round Three: the Forever-Loading Incident

Prompt: “A user's followed-author screen remains a shimmer after restarting. Other endpoints work. `refetch()` does not start a request. The app persists Redux.”

Start with evidence: observe whether a request exists, inspect that key's stored lifecycle, identify RTK version and restore wiring, and reproduce with synthetic persisted pending data. Explain the protective pending guard and the possibility of bypassing RTK's dedicated rehydration filters. Propose a tested targeted migration/adapter for existing state and a safer persistence policy going forward. [Persistence case study](/docs/frontend/rtk-query-persistence-and-recovery).

Weak answer: “Upgrade and clear the user's storage.” Strong answer: “Preserve drafts, prove the legacy restore path can start and finish a request, and separate code/test success from deployed recovery.” Follow-up: a pending mutation might have committed remotely, so cleanup must not imply automatic replay.

## Round Four: Choose a Real Product Scenario

### Support Dashboard with Many Filters

Design tenant/account arguments, search/sort/page identity, scoped collection tags, and detail tags. A delete outside the visible page can change totals and membership. Explain what happens on a successful write, a validation failure, and a network timeout after server commit. Test both visible and off-page mutations.

### Mobile Reading App with Offline Support

Decide which content is intentionally available offline, how snapshots are versioned and tied to identity, and how old results are labeled. Specify reconnect listeners, bounded retry, a real persisted-state migration, and a logout policy that preserves unrelated drafts. Do not use RTK mutation state as a durable job queue.

### Infinite Activity Feed

Use query arguments for tenant/filter and page parameters for cursor position. Discuss max retained pages, next-page errors, cursor stability, and duplicate/missing records. Explain that `refetchCachedPages: false` collapses to the first cached page; plan its effect on scroll position. Validate upstream payloads and stream events. [Infinite queries](https://redux-toolkit.js.org/rtk-query/usage/infinite-queries), [schema validation](https://redux-toolkit.js.org/rtk-query/api/createApi#schema-validation).

### Collaborative Profile Editing

Sketch edits A→B→C with the earlier operation failing late. State why inverse patches or an older success response can overwrite newer intent. Propose serialized writes or server revisions plus conflict handling and reconciliation. Test the ordering adversarially rather than only checking a happy path.

## Practical Exercise: Build a Reviewable Fix

In a scratch project, implement a fake author API and a real RTK store. Start with a failing test for two accounts accidentally sharing results, or for a raw restored pending entry blocking initiation. Implement the smallest correction. Then add the UI journey: display, mutate, fail/refetch, switch account, and restart using synthetic storage. The supplied lesson snippets are reference code; these tasks are not executable or auto-graded inside the reader.

Deliver a before/after behavior description, explicit cache/persistence policy, source/version references, and test evidence. State what the solution cannot yet prove: real native restart behavior, backend idempotency, or an old persisted format that has not been replayed.

## Self-Assessment Rubric

Score each dimension 0–2: 0 means incorrect or missing, 1 means mechanism named, 2 means mechanism plus boundary/example/test. This is a study rubric, not hiring calibration.

| Dimension | Full-credit evidence |
| --- | --- |
| Mechanics | Correct keys, subscriptions, result flags, retention/freshness separation |
| Mutation correctness | Tag scope, ambiguous failures, overlapping edits, server reconciliation |
| Lifecycle and recovery | Real restoration path, transient work versus durable data, identity transition |
| Modern APIs | Versioned infinite/schema behavior with a practical tradeoff |
| Engineering judgment | Small fix, realistic tests, observable result, explicit unknowns |

Review any dimension scored zero before the next rehearsal. Complete the checkpoint to check concrete decisions, then use the review feed to practice concise explanations without rereading the full path.
