---
title: TypeScript Boundary Design In Large Frontends
slug: programming/typescript-boundaries
summary: How to use TypeScript at API, persistence, and component boundaries without turning every implementation detail into a shared type.
track: Programming
topic: TypeScript
difficulty: senior
tags:
  - typescript
  - frontend-architecture
  - api-contracts
  - maintainability
prerequisites:
  - TypeScript generics
  - React component architecture
diagramRefs: []
status: published
---

## Boundary Principle

Types are most valuable where data crosses trust boundaries. They are less valuable when they freeze incidental implementation choices inside one module. In large frontends, the highest-leverage boundaries are network responses, persisted state, route parameters, analytics events, and shared component props.

## Contract Types

Contract types should be boring, explicit, and stable. Prefer parseable schemas for untrusted input, especially API responses and local storage. A compile-time type is not validation when the value came from the network.

Keep transport types separate from view models. The server may return nullable fields, legacy names, or denormalized shapes. The UI should usually consume a normalized model that encodes what the screen actually needs.

Use `unknown` at untrusted boundaries, parse once, and return a validated type. Avoid type assertions that merely silence the compiler: `payload as User` changes no runtime value. When a protocol has variants, use a discriminated union and an exhaustive `never` check so a new server case creates a compile-time review point.

Version network and persisted contracts deliberately. Additive fields are usually safer than changing meaning in place; removals need a compatibility window. Local-storage and queued-event schemas need migrations or safe fallback behavior because old data can outlive the deployment that wrote it.

## Avoid Type Gravity

Shared types create gravity. Once a type is imported everywhere, changing it becomes expensive. That cost is useful for public contracts and harmful for local state. Do not export a component's internal reducer state unless another module genuinely owns part of that state.

## Practical Pattern

1. Validate untrusted input with a schema.
2. Convert it into a local domain model.
3. Keep rendering props narrow and screen-specific.
4. Export only the contract another module is allowed to depend on.

```ts
import { z } from "zod";

const ApiUser = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1),
});

type User = z.infer<typeof ApiUser>;

export function parseUser(value: unknown): User {
  return ApiUser.parse(value);
}
```

Parsing at one adapter gives the rest of the feature a trustworthy type. For high-volume or compatibility-sensitive paths, decide whether invalid input should reject the request, quarantine an event, use a documented default, or trigger an older-version decoder.

## Review Questions

- Can this type change without forcing unrelated screens to update?
- Does this type describe source data, validated data, or rendered data?
- Is a runtime schema needed because the source is untrusted?
- Is a generic abstraction hiding important domain names?
- Who owns compatibility when this contract changes?
- Can an assertion or optional field collapse "missing," "invalid," and "not loaded" into the same state?

## Reference Anchors

- [TypeScript narrowing and discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript `unknown`](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [Zod documentation](https://zod.dev/)
