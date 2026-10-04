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
sourceRefs: [duolingo-server-driven-ui, google-aip-180-compatibility]
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

Write a receipt with the client/capability set, response and cached revisions, data contract, selected plan, visible fallback, operation authorization and evidence from each supported platform. Pair this with the [Client Compatibility Checkpoint](/practice/system-design/client-compatibility-checkpoint). Passing the toy cannot establish rollout safety or all ten operational API topics; rate policy, webhook verification and long-running work need their own contracts.
