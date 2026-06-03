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

```python
from typing import Any

def parse_payload(payload: dict[str, Any]) -> UserCommand:
    user_id = payload.get("user_id")
    if not isinstance(user_id, str):
        raise ValueError("user_id must be a string")
    return UserCommand(user_id=user_id)
```

The point is not that `dict[str, Any]` is beautiful. The point is that the unknown shape is contained at the boundary, then replaced with a precise domain object.

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

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Money:
    cents: int
    currency: str

    def __post_init__(self) -> None:
        if self.cents < 0:
            raise ValueError("Money cannot be negative")
```

`frozen=True` helps with accidental mutation, but it is not full deep immutability and it is not input parsing. It makes the domain object harder to misuse after construction.

## Protocols And Duck Typing

Python has nominal types and structural typing support through protocols. This can feel close to TypeScript interfaces, but runtime duck typing has always been part of Python. The senior choice is to type behavior at the narrowest useful interface.

If a function only needs something iterable, annotate the iterable behavior instead of requiring a concrete list. If it needs an object that can persist a message, annotate that protocol. This keeps tests flexible and avoids forcing production code into inheritance just to satisfy a checker.

```python
from typing import Protocol

class EventPublisher(Protocol):
    def publish(self, topic: str, payload: bytes) -> None:
        ...

def notify_signup(publisher: EventPublisher, user_id: str) -> None:
    publisher.publish("user.signup", user_id.encode("utf-8"))
```

This is close to a TypeScript interface in spirit, but Python still executes runtime code normally. The protocol helps tools and readers; it does not wrap the object in a runtime adapter.

## TypedDict For Transport Shapes

`TypedDict` is useful when a mapping shape is meaningful, especially near JSON-like transport data. It should not become a permanent substitute for domain objects with behavior. Use it to document and check dictionaries while a payload is still payload-shaped.

```python
from typing import TypedDict

class RawUserPayload(TypedDict):
    id: str
    email: str
    active: bool

def to_command(payload: RawUserPayload) -> ActivateUser:
    return ActivateUser(user_id=payload["id"], email=payload["email"])
```

For optional keys, mixed requiredness, or evolving API responses, be explicit. A vague `dict[str, object]` forces every caller to rediscover the contract.

## Narrowing, Casts, And Review Discipline

Type checkers can narrow after `isinstance`, `if value is None`, and custom guard-like functions. `cast()` is different: it tells the checker to believe you, and it does not change the runtime value.

```python
from typing import cast

cached = cache.get(user_id)
if cached is None:
    return None

user = cast(User, cached)
return user.email
```

Review every cast as a claim that should be backed by an invariant. If the invariant is local, prefer a real runtime check. If the invariant is global, explain it near the cast or hide it behind a small helper with tests.

## Generics And Modern Syntax

Modern Python supports generic syntax that feels more direct to TypeScript engineers. Use it where it makes a real contract clearer. Do not chase generic abstractions just because they are available. A specific domain name is usually better than a reusable type variable that hides the product concept.

```python
def first[T](items: list[T]) -> T:
    return items[0]
```

That kind of helper is reasonable. A large generic repository abstraction that erases important domain behaviors is usually not.

## Senior Pain Points

- Annotation coverage that looks impressive but leaves `Any` flowing through important paths.
- Dataclasses used as input validation.
- Transport types reused directly in business logic.
- Protocols that are too wide and make tests overfit production classes.
- Generic helpers that hide useful domain names.
- Casts that silence the checker without documenting the runtime invariant.
- `TypedDict` payload shapes leaking into domain service APIs.
- `Any` introduced at a dynamic boundary and never narrowed.

## Review Standard

Ask where the type contract is checked. If the answer is "the annotation says so," the code is not safe at a runtime boundary. Good Python type design uses annotations for communication and static feedback, then uses explicit validation where trust changes.

## Reference Anchors

- [Python typing docs](https://docs.python.org/3/library/typing.html)
- [Python type system specification](https://typing.python.org/en/latest/spec/concepts.html)
- [Dataclasses](https://docs.python.org/3/library/dataclasses.html)
