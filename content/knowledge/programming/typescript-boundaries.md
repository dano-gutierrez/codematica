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

## Avoid Type Gravity

Shared types create gravity. Once a type is imported everywhere, changing it becomes expensive. That cost is useful for public contracts and harmful for local state. Do not export a component's internal reducer state unless another module genuinely owns part of that state.

## Practical Pattern

1. Validate untrusted input with a schema.
2. Convert it into a local domain model.
3. Keep rendering props narrow and screen-specific.
4. Export only the contract another module is allowed to depend on.

## Review Questions

- Can this type change without forcing unrelated screens to update?
- Does this type describe source data, validated data, or rendered data?
- Is a runtime schema needed because the source is untrusted?
- Is a generic abstraction hiding important domain names?
