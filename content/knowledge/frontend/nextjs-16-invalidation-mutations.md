---
title: Invalidation And Mutations In Next.js 16
slug: frontend/nextjs-16-invalidation-mutations
summary: A principal-level guide to Server Actions, updateTag, revalidateTag, read-your-own-writes, webhooks, and mutation-driven cache correctness.
track: Front-End Development
topic: Next.js Invalidation
difficulty: principal
tags:
  - nextjs
  - server-actions
  - updatetag
  - revalidatetag
  - mutations
prerequisites:
  - Server Actions
  - Cache tags
  - Mutation workflows
diagramRefs: []
status: published
---
## Invalidation Is Part Of The Mutation

A mutation is not complete when the database write succeeds. In a cached app, the mutation is complete when the user-visible read path has the correct freshness semantics. That might mean immediate expiration for the acting user, stale-while-revalidate for public viewers, or a conservative fail-closed read for sensitive state.

## updateTag For Read-Your-Own-Writes

`updateTag` belongs in Server Actions. Use it when a user performs a mutation and the next read should wait for fresh data instead of seeing stale cached content. It is the right mental model for edit screens, profile updates, dashboard mutations, and workflows where the actor expects their change to be visible immediately.

```ts
'use server';

import { updateTag } from 'next/cache';

export async function renameProject(projectId: string, name: string) {
  await db.project.update({ where: { id: projectId }, data: { name } });
  updateTag('project:' + projectId);
}
```

## revalidateTag For Stale-While-Revalidate

`revalidateTag` can be used from contexts such as Route Handlers and is appropriate for webhooks, CMS publishes, background systems, and stale-while-revalidate behavior. With the `"max"` profile, the next visitor can receive stale content while revalidation happens in the background.

Use the two-argument form, such as `revalidateTag(tag, "max")`, for this behavior. The legacy single-argument immediate-expiration form is deprecated. `revalidatePath` is a separate tool for invalidating data used on a route path; tags are usually the better domain-level contract when the same entity appears on several routes.

That is good for public content and poor for read-your-own-writes. If a user just edited a record, serving the old version and refreshing later feels broken.

## Tag Design

Tags are an index into your cache. Design them like production identifiers: stable enough that reads and writes agree, narrow enough to avoid invalidation storms, broad enough to cover related list and detail views, and documented near the cached read and mutation.

## Failure Modes

The hardest bugs are silent. The database is correct, the mutation returned success, and only one cached route is stale. Build tests or review checklists that trace the write to each affected read. Include webhook retries, idempotency, and what happens when invalidation fails after the write succeeds.

Do not claim atomicity that the framework does not provide. A database commit and a later cache invalidation are two operations. For high-value writes, use an outbox or durable retry record so a crash between them can be repaired; keep expiration as a backstop rather than the primary consistency mechanism.

## One-Minute Brief

In Next.js 16, mutation design includes cache design. Use `updateTag` in Server Actions for read-your-own-writes. Use `revalidateTag` from non-action contexts or when stale-while-revalidate is the product behavior.

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
