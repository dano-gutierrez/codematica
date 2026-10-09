---
title: "Reliable Integrations And Customer Workflows"
slug: "fde/integrations-and-workflows"
summary: "Design API connectors and durable work around scoped identity, uncertain outcomes, retries and reconciliation."
track: "Forward Deployed Engineering"
topic: "Reliable Integrations And Customer Workflows"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-aws-idempotency"]
status: "published"
---

A connector turns someone else's contract into your application's behavior. Start by reading the actual provider's authentication, pagination, rate-limit, retry, webhook, idempotency and versioning rules. Similar-looking APIs can make different guarantees. Keep transport failures separate from business rejection and uncertain outcomes.

## Specify the boundary

For an order lookup, define input schema, authorization context, timeout budget, response schema, freshness and error categories. Bound page traversal and record continuation tokens; an empty page may still have a continuation token. For webhook delivery, verify the provider's signature over the required representation before trusting fields, persist acceptance, and expect duplicates or out-of-order events only according to the provider contract.

A successful remote write followed by a lost response is an unknown outcome. A retry must preserve the same operation identity when the provider supports it. A newly generated key can mean a new action. Hashing request bodies alone cannot tell whether two identical requests represent the same intent. AWS's idempotency guidance motivates a caller-provided identity and a conflict when the same identity carries different parameters.

## Model a small receipt reducer

The following original Python function is an in-memory, sequential decision model. It performs no external action and gives no crash or concurrency guarantee. The authenticated tenant is an argument supplied by trusted server context, never a field blindly accepted from a request body.

```python
def accept(receipts, tenant, key, payload):
    identity = (tenant, key)
    if identity in receipts:
        if receipts[identity] != payload:
            return "conflict"
        return "replay"
    receipts[identity] = payload
    return "accepted"

receipts = {}
assert accept(receipts, "a", "k1", "order-7") == "accepted"
assert accept(receipts, "a", "k1", "order-7") == "replay"
assert accept(receipts, "a", "k1", "order-8") == "conflict"
assert accept(receipts, "b", "k1", "order-7") == "accepted"
assert len(receipts) == 2
```

Use immutable canonical payloads in this toy. A real system needs durable storage, an atomic unique identity check, versioned parameter comparison, authorization, retention policy and operation state. A receipt must distinguish accepted intent, in-progress work, completed result and unresolved failure. “Seen” does not mean “completed.”

## Trace the crash boundaries

If the API records a job then crashes before queue publication, a transactionally written outbox can preserve dispatch intent. If the worker changes a remote system then crashes before recording completion, the outbox alone does not prevent repeating the remote effect. Use the provider's idempotent operation or reconciliation lookup; otherwise surface uncertainty and escalate. These are two different failure windows.

Use bounded retries with backoff and jitter for eligible transient failures, respect the provider's retry guidance, set an overall deadline and cap concurrency. Retrying authentication failures forever amplifies noise. Instrument attempts separately from accepted business operations. Support explicit manual replay with an audit record.

## Practice

Run the reducer and mutate its identity to use only `key`; show that the cross-tenant assertion fails. Remove parameter comparison; show that the conflict assertion fails. Build a fake adapter that applies a write then raises a timeout. Trace a retry with the original operation ID and with a new ID. Do not call a live order, payment or campaign API.

Use the integration guided lab to produce the trace, receipt states, retry budget and recovery procedure. Continue with the existing [durable generation architecture](/docs/software-engineering/product-interview-durable-generation-architecture) for deeper acceptance and reconciliation analysis.

## Review your work

Can you point to the exact durable transition that accepts work? Can you recover after each crash without inventing success? A passing reducer test proves its finite rule; it does not prove a distributed connector's safety.

## Sources and further study

- [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): Malcolm Featonby, Amazon Builders Library. Selected client intent, atomicity and parameter mismatch guidance.
