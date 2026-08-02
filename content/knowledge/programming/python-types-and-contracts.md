---
title: Python Types And Contracts For TypeScript Engineers
slug: programming/python-types-and-contracts
summary: How to use Python's gradual typing, Any, protocols, dataclasses, and runtime validation without importing TypeScript assumptions.
track: Programming
topic: Python
difficulty: senior
tags:
  - python
  - typing
  - contracts
  - language-refresh
prerequisites:
  - TypeScript boundary design
  - Runtime validation
diagramRefs: []
status: published
---

## Type System Reality

Python is dynamically typed at runtime and gradually typed for static tooling. A TypeScript engineer can use annotations productively, but the mental model must shift: Python type hints do not make runtime values safe. They help type checkers, editors, linters, and readers.

The official typing docs state the runtime does not enforce function and variable annotations. The practical consequence is simple: if data is untrusted, parse it. Do not treat `def create_user(payload: UserPayload)` as proof that `payload` actually has the right shape.

## Any Is A Boundary Leak

In TypeScript, `any` is a contagious escape hatch. Python's `Any` plays a similar role for static tools. A value typed as `Any` can flow into precise types without static pushback, and unannotated parameters often become implicit `Any`.

Senior Python code does not ban `Any`; it isolates it. Use `Any` at intentionally dynamic integration points, then narrow quickly. Prefer `object` when the value is unknown but operations should remain type-safe. This mirrors the TypeScript distinction between `any` and `unknown`.

## Runtime Validation Still Matters

Type annotations describe expected shapes. Runtime validation enforces them. For inputs from HTTP, queues, local storage, environment variables, CLI flags, or third-party packages, a Python service needs parseable boundary checks just like a TypeScript frontend needs Zod or a similar schema.

The reusable pattern is:

1. Receive unknown data.
2. Validate and normalize it.
3. Convert to a domain object.
4. Keep domain code away from raw transport data.

This pattern is language-neutral. The Python-specific part is resisting the temptation to assume annotations performed step two.

## Dataclasses Are Not Schemas

Dataclasses reduce boilerplate for plain data carriers. They do not automatically validate remote input, coerce nested structures, or enforce business invariants. A dataclass constructor can still receive the wrong runtime value unless the code checks.

Use dataclasses when the object is already trusted enough to enter the domain model. Use explicit parsing before that. If a dataclass grows behavior, review whether it is still a record or now a domain object with invariants.

## Protocols And Duck Typing

Python has nominal types and structural typing support through protocols. This can feel close to TypeScript interfaces, but runtime duck typing has always been part of Python. The senior choice is to type behavior at the narrowest useful interface.

If a function only needs something iterable, annotate the iterable behavior instead of requiring a concrete list. If it needs an object that can persist a message, annotate that protocol. This keeps tests flexible and avoids forcing production code into inheritance just to satisfy a checker.

## Generics And Modern Syntax

Python 3.12 introduced type-parameter syntax that feels more direct to TypeScript engineers. Use it only when the project's declared minimum Python version supports it and when it makes a real contract clearer. Do not chase generic abstractions just because they are available. A specific domain name is usually better than a reusable type variable that hides the product concept.

```python
def first[T](items: list[T]) -> T:
    return items[0]
```

That kind of helper is reasonable. A large generic repository abstraction that erases important domain behaviors is usually not.

For projects supporting Python 3.11 or earlier, use `TypeVar`-based syntax instead of copying a Python 3.12 example into production.

## Senior Pain Points

- Annotation coverage that looks impressive but leaves `Any` flowing through important paths.
- Dataclasses used as input validation.
- Transport types reused directly in business logic.
- Protocols that are too wide and make tests overfit production classes.
- Generic helpers that hide useful domain names.

## Review Standard

Ask where the type contract is checked. If the answer is "the annotation says so," the code is not safe at a runtime boundary. Good Python type design uses annotations for communication and static feedback, then uses explicit validation where trust changes.

## Reference Anchors

- [Python typing docs](https://docs.python.org/3/library/typing.html)
- [Python type system specification](https://typing.python.org/en/latest/spec/concepts.html)
- [Dataclasses](https://docs.python.org/3/library/dataclasses.html)
