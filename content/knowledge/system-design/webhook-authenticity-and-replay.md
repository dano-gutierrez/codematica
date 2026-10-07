---
title: Webhook Authenticity — Separate A Valid Delivery From A New Effect
slug: system-design/webhook-authenticity-and-replay
summary: Test raw-byte signatures, signed time, scoped retry receipts and secret rotation in a local fixture; preserve durable acceptance and reconciliation as separate obligations.
track: System Design
topic: Delivery Contracts
difficulty: practitioner
tags: [webhooks, signatures, replay, idempotency]
prerequisites: [system-design/cors-csrf-and-authorization, software-engineering/product-interview-durable-generation-architecture]
diagramRefs: []
sourceRefs: [stripe-webhook-contracts, python-hmac-verification]
status: published
---

## Establish the provider contract

[Stripe's webhook guide](https://docs.stripe.com/webhooks) recommends its official verification libraries and preserving the raw request body. Signed timestamps mitigate old replay; retries can have fresh signatures. Duplicate deliveries and unordered events remain possible. Endpoint secrets, event versions and retry behavior belong to the specific provider contract. This lesson's custom envelope is original and **not compatible with Stripe headers or an SDK replacement**.

For an integration, verify the supported event format and account/environment before relying on parsed fields. A signed delivery is evidence about message origin/integrity, not permission for every business transition. A delivery acknowledgment does not certify completion of downstream work.

## Test bytes, time and scope independently

The original standard-library fixture signs a domain label, trusted configured endpoint, timestamp and exact body bytes with HMAC-SHA256. Its test key is a dummy value. Real endpoint secrets stay in server configuration. [Python's HMAC documentation](https://docs.python.org/3.13/library/hmac.html) recommends `compare_digest` for externally supplied digests; its same-type/length constraints still matter. Timing-safe comparison does not make the whole handler timing-independent.

The fixture validates shape, freshness and signature **before** parsing the authenticated event ID. Its in-memory set models an admission receipt, not a durable effect ledger. Predict tampering, reserialization, stale/future time, endpoint substitution, renewed retry and key retirement:

```python
import hashlib
import hmac
import json
import re
from unittest.mock import patch


def unsigned_int(value):
    return type(value) is int and value >= 0


def signed_bytes(endpoint, timestamp, body):
    return b"lesson-webhook-v1\0" + endpoint.encode() + b"\0" + str(timestamp).encode() + b"\0" + body


def sign(key, endpoint, timestamp, body):
    return hmac.new(key, signed_bytes(endpoint, timestamp, body), hashlib.sha256).hexdigest()


def receive(endpoint, timestamp, body, signature, keys, now, max_age, seen):
    if (not isinstance(endpoint, str) or not endpoint.strip() or "\0" in endpoint
            or not unsigned_int(timestamp) or not unsigned_int(now)
            or type(max_age) is not int or max_age <= 0
            or not isinstance(body, bytes) or not 0 < len(body) <= 4_096
            or not isinstance(signature, str) or not re.fullmatch(r"[0-9a-f]{64}", signature)
            or not isinstance(keys, tuple) or not 1 <= len(keys) <= 2
            or any(not isinstance(key, bytes) or not key for key in keys)):
        return "invalid"
    if abs(now - timestamp) > max_age:
        return "stale"
    if not any(hmac.compare_digest(sign(key, endpoint, timestamp, body), signature) for key in keys):
        return "unauthenticated"
    try:
        event = json.loads(body)
    except (ValueError, UnicodeDecodeError):
        return "invalid-event"
    if (not isinstance(event, dict) or not isinstance(event.get("id"), str)
            or not event["id"].strip()):
        return "invalid-event"
    receipt = (endpoint, event["id"])
    if receipt in seen:
        return "duplicate"
    seen.add(receipt)
    return "accepted"


a, b = "test-account-a:event-endpoint", "test-account-b:event-endpoint"
key, retired = b"dummy-test-key-not-a-credential", b"old-dummy-test-key"
body = b'{"id":"event-1","amount":10}'
signature = sign(key, a, 100, body)
assert signed_bytes(a, 100, body) == b'lesson-webhook-v1\0test-account-a:event-endpoint\0' + b'100\0' + body
with patch("hmac.compare_digest", wraps=hmac.compare_digest) as compare:
    assert receive(a, 100, body, signature, (key,), 100, 30, set()) == "accepted"
    compare.assert_called_once_with(signature, signature)
seen = set()
assert receive(a, 100, body, signature, (key,), 100, 30, seen) == "accepted"
assert receive(a, 100, body, signature, (key,), 100, 30, seen) == "duplicate"
assert receive(a, 110, body, sign(key, a, 110, body), (key,), 110, 30, seen) == "duplicate"
assert receive(b, 100, body, signature, (key,), 100, 30, seen) == "unauthenticated"
assert receive(b, 100, body, sign(key, b, 100, body), (key,), 100, 30, seen) == "accepted"
for changed in (body.replace(b"10", b"11"), json.dumps(json.loads(body)).encode()):
    assert receive(a, 100, changed, signature, (key,), 100, 30, seen) == "unauthenticated"
assert receive(a, 101, body, signature, (key,), 101, 30, seen) == "unauthenticated"
for now in (69, 131):
    assert receive(a, 100, body, signature, (key,), now, 30, seen) == "stale"
for now in (70, 130):
    assert receive(a, 100, body, signature, (key,), now, 30, seen) == "duplicate"
old_signature = sign(retired, a, 100, body)
assert receive(a, 100, body, old_signature, (key, retired), 100, 30, seen) == "duplicate"
assert receive(a, 100, body, old_signature, (key,), 100, 30, seen) == "unauthenticated"
for invalid_body in (b"not json", b"\xff", b"[]", b"{}", b'{"id":" "}', b'{"id":1}'):
    before = seen.copy()
    assert receive(a, 100, invalid_body, sign(key, a, 100, invalid_body), (key,), 100, 30, seen) == "invalid-event"
    assert seen == before
for timestamp, raw, sig, keys, now, age in (
    (True, body, signature, (key,), 100, 30), (-1, body, signature, (key,), 100, 30),
    (1.5, body, signature, (key,), 100, 30), ("100", body, signature, (key,), 100, 30),
    (100, "text", signature, (key,), 100, 30), (100, b"", signature, (key,), 100, 30),
    (100, b"x" * 4_097, signature, (key,), 100, 30),
    (100, body, "bad", (key,), 100, 30), (100, body, "\u00e9" * 64, (key,), 100, 30),
    (100, body, None, (key,), 100, 30), (100, body, signature, (), 100, 30),
    (100, body, signature, [key], 100, 30), (100, body, signature, (key, key, key), 100, 30),
    (100, body, signature, (b"",), 100, 30), (100, body, signature, (key,), True, 30),
    (100, body, signature, ("key",), 100, 30), (100, body, signature, (key,), -1, 30),
    (100, body, signature, (key,), 100, 0), (100, body, signature, (key,), 100, True),
    (100, body, signature, (key,), 100, -1), (100, body, signature, (key,), 100, 1.5),
):
    before = seen.copy()
    assert receive(a, timestamp, raw, sig, keys, now, age, seen) == "invalid"
    assert seen == before
for endpoint in (None, "", " ", "test\0account"):
    assert receive(endpoint, 100, body, signature, (key,), 100, 30, seen) == "invalid"
assert receive(a, 100, body, "0" * 64, (key,), 100, 30, set()) == "unauthenticated"
prefix, suffix = b'{"id":"boundary","padding":"', b'"}'
bounded = prefix + b"x" * (4_096 - len(prefix) - len(suffix)) + suffix
assert len(bounded) == 4_096
assert receive(a, 100, bounded, sign(key, a, 100, bounded), (key,), 100, 30, set()) == "accepted"
assert seen == {(a, "event-1"), (b, "event-1")}
print("raw bytes, signed time, scoped retry, rotation and invalid inputs: passed")
```

This toy accepts clock skew within 30 seconds in either direction, inclusive. That is its own explicit policy; check the real SDK's tolerance semantics rather than copying it. Endpoint configuration supplies trusted account scope. Body fields alone cannot choose a secret or authority. Test key rotation with a bounded overlap and explicit retirement; a new secret does not invalidate all previously admitted effects.

## Admit durably, then process idempotently

The set disappears on restart and its check/add is not a distributed transaction. It grows without retention and does not record completion, version conflicts or failure recovery. The fixture validates no real provider header, HTTP framework, TLS connection or concurrent receiver. Do not deploy it as a webhook endpoint.

Use a scoped unique event receipt with durable queued work in one transaction where your architecture permits. Commit admission before acknowledging; retry a failed admission. Processing needs its own idempotent transition and reconciliation, especially when an external effect succeeds before the local receipt is updated. A provider may use separate event objects for a related business change; event-ID deduplication alone cannot decide that domain equivalence. The existing [durable-generation lesson](/docs/software-engineering/product-interview-durable-generation-architecture) covers those crash/effect boundaries.

Write a review receipt for the verified endpoint/account, raw-body handling, signature scheme, signed fields, clock/freshness policy, allowed event versions/types, deduplication retention, durable acknowledgment, retries and out-of-order reconciliation. Trace an old duplicate after receipt expiry and two simultaneous deliveries. Pair it with the [Webhook Authenticity Checkpoint](/practice/system-design/webhook-authenticity-checkpoint). No live payment, webhook or external API is called by this exercise.
