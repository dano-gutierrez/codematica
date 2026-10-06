---
title: Card Payment State Evidence — Follow The Receipt
slug: system-design/card-payment-state-evidence
summary: Practice card payment state evidence through original source-bound cases; inspect the declared scope and missing evidence.
track: System Design
topic: Card Payment State Evidence
difficulty: practitioner
tags: [evidence-review, contracts, original-practice]
prerequisites: []
diagramRefs: []
sourceRefs: ["evidence-stripe-hold", "evidence-visa-flow"]
status: published
---

## Name the participants before drawing the arrows

The [Visa acceptance overview](https://developer.visa.com/capabilities/visanet-connect-acceptance/docs-getting-started) separates authorization from later capture and settlement activity. In this fictional shop, the buyer, merchant, processor/acquirer, network and issuer have distinct roles. A diagram arrow needs an operation and observed response. A gateway’s accepted request does not by itself prove that the issuer authorized funds or that the merchant received settlement.

## Separate a hold from collected funds

[Stripe manual capture](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method) can leave a PaymentIntent in requires_capture after authorization. The original example authorizes 80 units and later captures 60 under its stated permitted partial-capture policy. Track held, captured and released amounts separately. A hold expiry depends on applicable method/network rules and the transaction’s capture deadline; do not replace that evidence with a universal seven-day assumption.

## Require the current operation identity

A fictional capture C7 succeeds at the provider but its acknowledgement is lost. Retrying with a new operation identity can repeat a request that already had an effect. Preserve the intended capture identity and inspect its outcome before claiming failure. This exercise assumes a provider contract for deduplicating that identity; it is not a claim about every card protocol. The [durable retry lesson](/docs/software-engineering/product-interview-durable-generation-architecture) explains why request and effect receipts differ.

## Reconcile each stage independently

The paper ledger records authorization A3, capture C7, clearing batch B2 and settlement S8. Capture success does not prove that settlement has completed; settlement totals can include later adjustments under the explicitly supplied ledger rules. A refund is also a separate operation, not deleting the earlier capture record. Retain failed and pending stages rather than flattening every intermediate status into paid.

## Build a bounded payment receipt

For the checkpoint, assume only the fictional 80-unit hold and accepted 60-unit capture. Record a 20-unit released remainder according to the supplied policy, and leave settlement pending until S8 exists. Replace the capture response with a timeout and mark its result unknown. No real money, account, card details or provider call is involved. Exact method deadlines, fees, disputes and product eligibility need their own evidence; this is selected systems practice rather than a complete payments course.

Continue with the [checkpoint](/practice/system-design/card-payment-state-evidence-checkpoint).
