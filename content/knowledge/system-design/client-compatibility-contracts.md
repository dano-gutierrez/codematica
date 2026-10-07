---
title: Client Compatibility — Separate Layout, Data And Meaning
slug: system-design/client-compatibility-contracts
summary: Test supported layouts, cached fallback, cold starts and API meaning without assuming every old client can render every new response.
track: System Design
topic: Client Contracts
difficulty: practitioner
tags: [api, compatibility, server-driven-ui, versioning]
prerequisites: [system-design/cache-invalidation]
diagramRefs: []
sourceRefs: [duolingo-server-driven-ui, google-aip-180-compatibility, rfc-http-preconditions, rfc-6585-status-codes, google-aip-160-filtering, google-aip-158-pagination, google-aip-157-partial-responses]
status: published
---

## Separate the reading from the experiment

[Duolingo's engineering report](https://blog.duolingo.com/server-driven-ui/) describes separating UI configuration from user data. An older client can receive fresh data while using a compatible cached configuration. New components still require client support. Its experiment count and release improvements are author-reported outcomes, not measurements from this lesson.

The following fixture is original. It checks a small selection contract, not Duolingo's implementation. It performs no network, rendering, cache persistence or account operation. A supported layout is only one condition for a useful screen; fresh data must satisfy the client's schema and business meaning too.

## Choose a layout with an explicit data contract

For this exercise, layout versions, data versions and component names are separate capabilities. Prefer a compatible fresh layout, otherwise a compatible cached layout. Reject unsupported data before choosing either. Without a compatible layout, return an explicit unavailable state. Malformed version values raise an input error; they do not become an authoritative empty result.

Predict these cases before running the original standard-library Python fixture:

1. Fresh layout and data are supported.
2. Fresh layout requires a new carousel; a compatible cached text layout exists.
3. A new component arrives without a higher layout version.
4. The old client has no cached layout after reinstall.
5. The data contract changes while the cached layout remains old.
6. A layout claims a zero, negative or boolean version.

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class Layout:
    version: int
    data_version: int
    components: tuple[str, ...]


def positive_version(value):
    return type(value) is int and value > 0


def select_layout(max_version, components, data_versions, response_data_version,
                  *, fresh=None, cached=None):
    versions = (max_version, response_data_version, *data_versions)
    if not all(positive_version(value) for value in versions):
        raise ValueError("versions must be positive integers, not booleans")
    for layout in (fresh, cached):
        if layout is not None and (
            not isinstance(layout, Layout)
            or not positive_version(layout.version)
            or not positive_version(layout.data_version)
        ):
            raise ValueError("invalid layout versions")
    if response_data_version not in data_versions:
        return "unsupported-data", None
    for mode, layout in (("fresh", fresh), ("cached", cached)):
        if (layout is not None
                and layout.version <= max_version
                and layout.data_version == response_data_version
                and set(layout.components) <= components):
            return mode, layout
    return "unavailable", None


old = Layout(1, 1, ("text", "button"))
new = Layout(2, 1, ("text", "carousel"))
caps = (1, {"text", "button"}, {1}, 1)
assert select_layout(*caps, fresh=old, cached=new) == ("fresh", old)
assert select_layout(*caps, fresh=new, cached=old) == ("cached", old)
assert select_layout(*caps, fresh=Layout(2, 1, ("text",)), cached=old) == ("cached", old)
assert select_layout(*caps, fresh=Layout(1, 1, ("carousel",)), cached=old) == ("cached", old)
assert select_layout(*caps, fresh=new) == ("unavailable", None)
assert select_layout(*caps) == ("unavailable", None)
assert select_layout(*caps, cached=Layout(1, 2, ("text",))) == ("unavailable", None)
assert select_layout(1, {"text"}, {1}, 2, cached=old) == ("unsupported-data", None)
assert select_layout(2, {"text", "button", "carousel"}, {1}, 1, fresh=new, cached=old) == ("fresh", new)

for bad in (0, -1, True, 1.5, "1", None):
    for arguments, layouts in (
        ((bad, caps[1], caps[2], 1), {}),
        ((1, caps[1], {bad}, 1), {}),
        ((1, caps[1], caps[2], bad), {}),
        (caps, {"fresh": Layout(bad, 1, ("text",))}),
        (caps, {"cached": Layout(1, bad, ("text",))}),
    ):
        try:
            select_layout(*arguments, **layouts)
        except ValueError:
            pass
        else:
            raise AssertionError("invalid version accepted")
for bad_layout in (1, {}, "unknown"):
    for field in ("fresh", "cached"):
        try:
            select_layout(*caps, **{field: bad_layout})
        except ValueError:
            pass
        else:
            raise AssertionError("invalid layout accepted")
print("fresh, cached, cold-start, unsupported component/data and invalid versions: passed")
```

The inputs here are authored capability fixtures, not arbitrary wire payloads. A real parser also validates field types, component structures, required bindings, action targets and size limits before selection. Two schemas can share a numeric version only if the publisher preserves that contract; the number cannot repair an incompatible field change. Cached configuration must have a defined provenance and lifecycle. Decide what happens when it is missing, corrupt, expired or retired. A bundled fallback or upgrade screen is a product decision, not evidence that every old client works indefinitely.

This fixture returns a plan, not a successful render. Test actual iOS, Android and web parsers and the cold-cache path separately. Keep user data scoped to its account and expiry policy; see [RTK persistence and recovery](/docs/frontend/rtk-query-persistence-and-recovery). Visibility of a button cannot authorize its server operation; use the existing [API boundary lesson](/docs/system-design/cors-csrf-and-authorization).

## Check API meaning as well as shape

[Google AIP-180](https://google.aip.dev/180) distinguishes source, wire and semantic compatibility. It treats field renaming as removal plus addition and warns that adding pagination can change what old callers understand as a complete result. Its guidance assumes particular transport and consumer conditions; it is not an exhaustive compatibility proof.

Work an original review: an API used to return all 100 items; it now returns 10 plus a cursor. The JSON still parses, but a caller that never follows the cursor may silently omit 90 items. State the supported old-client behavior, the migration plan and how to detect incomplete consumption before changing the default. For a field rename, preserve the old contract during migration and specify precedence if both names can be supplied. Changing a price field from integer cents to a formatted string needs more than a new layout: test the parser and interpretation separately.

Write a receipt with the client/capability set, response and cached revisions, data contract, selected plan, visible fallback, operation authorization and evidence from each supported platform.

## Review conditional writes before trusting a tag

[RFC 9110 §13.1.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1) specifies strong comparison for `If-Match`; a weak tag is insufficient. Normal request checks precede preconditions (§13.2.1). A false condition prevents the requested mutation. The RFC permits success if the change already happened, with cautions for non-idempotent effects. [RFC 6585 §3](https://www.rfc-editor.org/rfc/rfc6585.html#section-3) defines optional `428` for servers requiring conditional requests; it is not a universal server guarantee.

Review a fictional editable work order. This application's policy requires a strong tag and returns `412` for a stale tag, without using the already-applied success exception. Both clients initially read representation tag `"r7"`. All writers participate in the same version guard; the comparison and mutation must share one protected transition.

| Proposed transition | Required evidence or result under this policy |
| --- | --- |
| A writes with `If-Match: "r7"` | Authorized write commits, representation changes, new strong tag is `"r8"`. |
| B writes different content with `If-Match: "r7"` | Return `412`; retain A's value. B rereads and decides whether to merge. |
| B checks `"r8"`, then another writer commits before B saves | A separate check is insufficient; the storage guard must reject B's stale transition. |
| B sends `W/"r8"` | Weak comparison cannot satisfy this strong-tag policy. |
| B omits the condition | This application returns `428`; another API may have a different documented policy. |
| A caller has a matching tag but no permission | The tag grants no authority; reject through the ordinary authorization boundary. |

An ETag identifies a selected representation, not automatically a universal database row version. Define how each view's tag binds to a guarded stored revision. Identify bypass writers, deletion/recreation, and alternate endpoints that could invalidate that mapping. Require an actual competing-transaction test before claiming lost-update prevention. The table is a review trace, not a running server. Lost-response retries and side effects also need the separate [durable operation receipt](/docs/software-engineering/product-interview-durable-generation-architecture).

## Bound filtering, sorting and continuation

[Google AIP-160](https://google.aip.dev/160) requires schema/type validation and permits documented filter-complexity limits. [AIP-158](https://google.aip.dev/158) separates page-size limits from continuation, allows an empty page before the end, and requires the other query arguments to remain consistent across pages. Its page tokens do not authorize access. These are Google API contracts, not a claim that this exercise implements their full grammar.

Design a deliberately limited work-order query. Allow typed status equality and a creation-time lower bound, at most three predicates, and two sort directions over `(created_at, id)`. Map those field/operator choices to trusted query structure; bind values separately. Document this subset and reject unsupported fields or sorts explicitly. Silently dropping a filter changes the caller's question. Authorization independently supplies the tenant scope; a caller cannot change it through a filter or cursor.

| Review case | What the proposed contract must expose |
| --- | --- |
| Unknown field or malformed timestamp | Input error, not an apparently successful empty collection. |
| Requested page size 500; documented maximum 50 | Return at most 50; a negative size is invalid. |
| Zero rows and a nonempty continuation token | Another page remains possible; only the terminal token state establishes completion. |
| Continue with a different status filter or sort | Reject mismatched query context; changing page size alone is allowed. |
| Two orders share a creation time | Use the unique ID tie-breaker in both ordering and the continuation anchor. |
| Another writer inserts or changes a sort key between pages | Document live traversal versus snapshot semantics; stable sorting alone cannot promise exactly-once enumeration. |

Propose an index for the allowed tenant/filter/order combinations, then inspect representative query plans and measured latency with small, large and skewed tenants. Include write cost and deep traversal; a page cap does not bound rows scanned or sort memory. An opaque token protects the public implementation contract, but still needs query binding, integrity checks, expiry behavior and fresh authorization. None of those measurements or server mechanisms runs in this reading exercise. Relate the evidence to [index fundamentals](/docs/databases/index-fundamentals) and the [capacity worksheet](/docs/system-design/scaling-decision-worksheet).

## Name the resource view and preserve its meaning

[Google AIP-157](https://google.aip.dev/157) describes optional partial responses through field masks or named views. Defaults are part of the contract; removing a field from a view is breaking. Its modern Google guidance places read masks in a system parameter, not a new request-message field. Do not apply that transport convention to every API without checking its own specification.

For the fictional work order, define `BASIC` as `id`, `status` and `created_at`, and `FULL` as those fields plus `description`. The same field has the same type and meaning in each endpoint/view; absence in BASIC is not deletion. Specify omitted/unspecified view behavior separately for list and detail callers. Partial responses cannot reveal fields the caller is unauthorized to read.

Review a client that saves a BASIC response back as a full replacement: it may erase a description it never received. Require an explicit write contract distinguishing omitted, null and deliberately cleared fields; a projection is not automatically a valid update payload. Test old-client defaults, unknown views, authorization, shared-field types and view-specific ETags. Different legitimate projections need not contain identical fields, but silent endpoint-specific renaming or unit changes need a migration contract.

Pair these reviews with the eight-question [Client Compatibility Checkpoint](/practice/system-design/client-compatibility-checkpoint). The original layout selector remains unchanged. Real query performance, conditional-write atomicity and platform rendering need their own runtime evidence. Continue to [traffic policy](/docs/system-design/traffic-rate-contracts), [webhook verification](/docs/system-design/webhook-authenticity-and-replay) and [durable work](/docs/software-engineering/product-interview-durable-generation-architecture) for their separate contracts.
