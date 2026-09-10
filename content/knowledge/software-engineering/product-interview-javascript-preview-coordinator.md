---
title: Product Engineering Coding Drill — A Latest-Intent Preview Coordinator
slug: software-engineering/product-interview-javascript-preview-coordinator
summary: Implement a bounded plain JavaScript preview scheduler, test stale responses and failures, and explain cancellation without relying on a framework.
track: Software Engineering
topic: Interview Preparation
difficulty: senior
tags: [product-engineering, javascript, concurrency, interview, backpressure]
sourceRefs: [product-interview-abort-controller, product-interview-websocket]
status: published
---

## The 25-minute prompt

An artist drags a slider faster than an image generator responds. Implement `createPreviewCoordinator({ generate, render, onError })` in **plain JavaScript**. It exposes `submit(input)` and `dispose()`. This is an original Codematica drill for real-time creative applications, not a reported interview question.

Spend 3 minutes clarifying the contract, 12 coding, 7 testing, and 3 explaining tradeoffs. Use an empty local JavaScript scratch file. The app displays reference code and grades the separate checkpoint; it does not execute your scratch solution. Attempt the prompt before scrolling to the answer.

## Contract to clarify aloud

- `input` is an immutable string snapshot in this exercise. A real canvas needs an immutable revision/reference, not a mutable object captured by closure.
- `generate(input, { signal })` returns a promise; it may reject or throw synchronously. The adapter may ignore abort. It must eventually settle for liveness in this baseline.
- At most **one unsettled generation** runs and **one newest pending input** is retained. Pending work is replaced, not accumulated.
- Only the result or error for the most recently submitted revision may reach the UI. Once a newer input arrives, suppress the older outcome even if the new request later fails. Keep a previously displayed image labeled as stale while showing the current error.
- `submit` returns an increasing revision number. It does not promise an output for an input that may be superseded.
- `dispose` is idempotent, drops pending work, requests cancellation, and prevents later UI callbacks. Submitting afterward throws.
- `render` and `onError` are synchronous, non-throwing observers. Render scheduling and decoding are adapter responsibilities. Do not add automatic retries to this baseline.

Start by stating: “The UI's current intent and the provider's completion order are different clocks. I need a revision guard plus a bounded backlog.”

## Trace before coding

| Event | Active | Pending | Visible callback |
| --- | --- | --- | --- |
| submit A | A | none | none |
| submit B, then C before A settles | A | C | none |
| A resolves | C | none | A suppressed |
| C resolves | none | none | render C |
| submit D, then dispose | abort requested for D | none | no later callbacks |

A common failed attempt is `generate(input).then(render)`: it starts unlimited work and paints obsolete results. Debouncing reduces starts during a burst but does not order in-flight results. Aborting alone is also insufficient: the operation can finish before cancellation or ignore the signal. [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) communicates cancellation; it does not prove remote computation stopped.

## Reference implementation — reveal after your attempt

```javascript
function createPreviewCoordinator({ generate, render, onError }) {
  let revision = 0;
  let pending = null;
  let active = null;
  let disposed = false;

  async function pump() {
    if (disposed || active || pending === null) return;
    const job = pending;
    pending = null;
    const controller = new AbortController();
    active = controller;

    try {
      const output = await generate(job.input, {
        signal: controller.signal,
      });
      if (!disposed && job.revision === revision) render(output);
    } catch (error) {
      if (!disposed && job.revision === revision) onError(error);
    } finally {
      active = null;
      void pump();
    }
  }

  return {
    submit(input) {
      if (disposed) throw new Error("Coordinator is disposed");
      const nextRevision = ++revision;
      pending = { input, revision: nextRevision };
      void pump();
      return nextRevision;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pending = null;
      active?.abort();
    },
  };
}
```

The active slot is claimed before the first `await`. Synchronous adapter exceptions enter `catch`, and `finally` releases the slot after success or failure. A newer input invalidates old outcomes immediately. Normal supersession waits for the active request; only disposal asks it to abort. This is a deliberate simple policy that avoids pretending an abort frees remote capacity.

Coordinator bookkeeping takes O(1) work per submission and O(1) slots, excluding the size of the two retained input snapshots, output data, observer work, and provider execution. Continuous input can suppress every intermediate result until the user pauses; that is the specified policy, not universally good UX.

## Deterministic scratch test

Copy the function above and this harness into a local `preview-drill.cjs`, then run `node preview-drill.cjs`. No packages, credentials, network, or GPU calls are needed. Resolve promises manually instead of racing wall-clock delays.

```javascript
const assert = require("node:assert/strict");

async function verify() {
  const calls = [];
  const shown = [];
  const errors = [];
  const coordinator = createPreviewCoordinator({
    generate(input, { signal }) {
      return new Promise((resolve, reject) => {
        calls.push({ input, signal, resolve, reject });
      });
    },
    render: (value) => shown.push(value),
    onError: (error) => errors.push(error),
  });
  coordinator.submit("A");
  coordinator.submit("B");
  coordinator.submit("C");
  assert.equal(calls.length, 1);
  calls[0].resolve("obsolete A");
  await Promise.resolve();
  assert.deepEqual(calls.map((call) => call.input), ["A", "C"]);
  assert.deepEqual(shown, []);
  calls[1].resolve("current C");
  await Promise.resolve();
  assert.deepEqual(shown, ["current C"]);
  coordinator.submit("D");
  coordinator.dispose();
  assert.equal(calls[2].signal.aborted, true);
  calls[2].resolve("late D");
  await Promise.resolve();
  assert.deepEqual(shown, ["current C"]);
  assert.deepEqual(errors, []);
  console.log("Preview invariants passed");
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Add cases for stale rejection followed by current success, current rejection then recovery, a synchronous adapter throw, repeated disposal, and submission after disposal. Codematica's content tests execute the authored reference against these failure scenarios; that does not grade your implementation.

## Follow-ups that expose deeper reasoning

1. **The adapter never settles.** The baseline blocks forever. Add a bounded operation deadline in the adapter and show an explicit unavailable state. A `Promise.race` timeout releases only local waiting; overlapping a replacement may violate a remote concurrency budget. Discuss provider cancellation acknowledgement, leases, or rejecting new work until reconciliation.
2. **Continuous drawing never pauses.** Offer a documented alternative: display monotonically newer completed previews labeled with their revision, or sample intent at a controlled cadence. Change the stale-result contract and its tests deliberately.
3. **Ten thousand canvas events per second.** Coalesce at the input boundary; put heavy serialization/decoding off the input path. A bounded JavaScript queue does not bound a WebSocket's browser or server buffers. MDN notes that the classic [WebSocket API lacks automatic backpressure](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).
4. **Two editors.** A local counter does not order collaborators' edits. Keep server document revision, client session epoch, and local preview request identity distinct. Attach generated output to the immutable input revision and model configuration.
5. **An export button.** Accepted exports need durable identity and completion tracking. Never discard them using the preview coalescing rule. Continue to the architecture lesson.

Self-assess on correctness before fluency: bound work, guard both results and errors, release the slot, explain disposal, and prove the races with controlled promises.
