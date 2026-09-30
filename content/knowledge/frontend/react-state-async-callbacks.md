---
title: React State Snapshots and Async Callbacks
slug: frontend/react-state-async-callbacks
summary: Understand why a timeout or promise callback sees old state, preserve concurrent changes with functional updates, and guard late results after clearing or unmounting.
track: Front-End Development
topic: React State
difficulty: practitioner
tags: [react, useState, stale-closure, setTimeout, async, functional-updates, interview]
prerequisites: [JavaScript closures, React useState, Promises]
sourceRefs: [react-state-snapshot, react-state-update-queue, react-state-setter, react-effect-cleanup]
status: published
---

## The scenario

You start with `useState([])`. A button appends an item with `setItems([...items, newItem])`. A timeout then runs an asynchronous operation, and its success or failure callback reads `items` without that new item.

**Yes, this behavior makes sense.** A callback closes over the variables from the render in which it was created. Calling the setter schedules an update; it does not replace the `items` variable inside that already-running handler. A timeout or `await` does not refresh that variable. The UI can show the new item while the old callback still sees the earlier array. [React: state as a snapshot](https://react.dev/learn/state-as-a-snapshot).

`useSetTimeout` is not a built-in React hook. If that name refers to a custom or library hook, check its implementation: does it keep the first callback, replace it on later renders, or cancel and reschedule the timer? Call hooks at the component's top level. A scheduling function returned by a hook can be called from a click handler; the hook itself cannot be called there. [React: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks).

## Trace the bug before fixing it

For one click starting from an empty array:

| Moment | What happens |
| --- | --- |
| Render 1 | `items` is `[]`; the click handler belongs to this render. |
| Click | The setter queues `[A pending]`, and a timer captures Render 1's `items`. |
| Render 2 | The UI displays A. This render receives a new state snapshot. |
| Timer fires | The old callback still uses `[]`. Mapping it produces `[]`. |
| Next render | Replacing state with that empty array makes A disappear. |

This complete example is **intentionally broken**. Paste it into a React/TypeScript `App.tsx`, click once, and watch the item disappear after one second. The timer isolates the closure problem; adding a promise inside it does not change the cause.

```tsx BrokenExample.tsx
import { useState } from "react";

type Item = { id: string; status: "pending" | "saved" };

export default function App() {
  const [items, setItems] = useState<Item[]>([]);

  function addItem() {
    const item: Item = { id: "A", status: "pending" };
    setItems([...items, item]);
    setTimeout(() => {
      // This callback reads the array from the render before the click.
      setItems(items.map((current) =>
        current.id === item.id ? { ...current, status: "saved" } : current
      ));
    }, 1000);
  }

  return (
    <main>
      <h1>Stale callback demonstration</h1>
      <button onClick={addItem} disabled={items.length > 0}>Add item</button>
      <ul>{items.map((item) => <li key={item.id}>{item.id}: {item.status}</li>)}</ul>
    </main>
  );
}
```

With two items the consequence can be worse: a delayed replacement can remove a newer item or revert its status. The problem is the old **read used to calculate a replacement**, not that React failed to store an earlier update.

## Default fix: calculate from the pending state

When the next value depends on the previous value, pass a function to the setter. React processes queued updaters in order, giving each updater the pending state after earlier queued updates. Keep the updater pure: return a new array and new changed objects. [React: queueing updates](https://react.dev/learn/queueing-a-series-of-state-updates).

Inside an existing component, with `newItem` and `setItems` in scope:

```ts
setItems((current) => [...current, newItem]);

// Later, in either a success or failure branch:
setItems((current) => current.map((item) =>
  item.id === newItem.id ? { ...item, status: "saved" } : item
));
// Use status: "error" for failure.
```

Use this form for the initial append **and every subsequent update that depends on that array**. Fixing only the append leaves a later stale replacement free to erase it. Conversely, `setItems([])` is appropriate when your intent is to clear everything.

Notice what stays captured: the new item's stable ID and request input. Those describe this operation. What must be current is the array being updated. A functional updater refreshes its argument; it does not refresh other captured props or variables.

## Complete working example

Replace `App.tsx` in a React/TypeScript project with this code. You can [open the board playground](/interviews/frontend-practice/dynamic-board?path=frontend-interview-practice), choose **Show full solution**, replace `App.tsx`, and press **Run**. Click **Add slow success**, then **Add fast failure** before one second passes. Both items remain: the fast one becomes `error`, then the slow one becomes `saved`. The mocked operation makes no network request.

The example also includes **Clear items**. It cancels timers that have not fired and invalidates already-started operations so a late result cannot affect a new list. The same cleanup runs on unmount.

```tsx WorkingExample.tsx
import { useEffect, useRef, useState } from "react";

type Outcome = "success" | "failure";
type Item = {
  id: string;
  label: string;
  status: "pending" | "saved" | "error";
};
type Save = (item: Item, outcome: Outcome) => Promise<void>;

async function mockSave(_item: Item, outcome: Outcome): Promise<void> {
  await Promise.resolve();
  if (outcome === "failure") throw new Error("Simulated failure");
}

export default function App({ save = mockSave }: { save?: Save }) {
  const [items, setItems] = useState<Item[]>([]);
  const generation = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const scheduled = timers.current;
    return () => {
      generation.current += 1;
      scheduled.forEach(clearTimeout);
      scheduled.clear();
    };
  }, []);

  function clearItems() {
    generation.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    setItems([]);
  }

  function addItem(outcome: Outcome, delay: number) {
    const item: Item = {
      id: crypto.randomUUID(),
      label: outcome === "success" ? "Success" : "Failure",
      status: "pending",
    };
    const startedIn = generation.current;
    setItems((current) => [...current, item]);

    const timer = setTimeout(async () => {
      timers.current.delete(timer);
      let status: Item["status"];
      try {
        await save(item, outcome);
        status = "saved";
      } catch {
        status = "error";
      }
      if (startedIn !== generation.current) return;
      // Both success and failure use one pure functional update.
      setItems((current) => current.map((existing) =>
        existing.id === item.id ? { ...existing, status } : existing
      ));
    }, delay);
    timers.current.add(timer);
  }

  return (
    <main>
      <h1>Async item updates</h1>
      <button onClick={() => addItem("success", 1000)}>Add slow success</button>
      <button onClick={() => addItem("failure", 250)}>Add fast failure</button>
      <button onClick={clearItems}>Clear items</button>
      <p role="status">{items.length} items</p>
      <ul aria-live="polite">
        {items.map((item) => <li key={item.id}>{item.label} — {item.status}</li>)}
      </ul>
    </main>
  );
}
```

For plain JavaScript, remove the type declarations, parameter annotations, and generic type arguments; the state-update logic stays the same. The optional `save` prop lets tests control completion order without changing the example's behavior.

### Why it works

- Each append builds on the pending array, so even two additions queued from the same render survive.
- Each completion maps the current array and changes only its own ID. Completing B before A does not undo A or delete B.
- A removed item is not reinserted by a completion: mapping an array without its ID leaves the contents unchanged.
- Clear and unmount invalidate the generation captured by each job. `clearTimeout` alone cannot stop a callback that has already started awaiting work.

For n items, each append or status update takes O(n) time and O(n) additional array space. Timer bookkeeping takes O(p) space for p scheduled jobs. Using functional updates improves correctness; it does not make array copying constant time.

### What this does not solve automatically

This example starts a distinct operation for each distinct item. If you retry or edit **the same item** concurrently, an older response can still overwrite a newer result. Add a per-item request ID or revision and accept only the intended operation's result, or serialize writes for that item.

The generation check ignores late results locally. It does not cancel an already-running remote request or undo a server mutation. With real fetches, pass an `AbortSignal`, abort during cleanup when supported, and retain a stale-result guard. Decide separately how to reconcile uncertain server outcomes. [React: cleanup and stale responses](https://react.dev/learn/synchronizing-with-effects).

## Alternative: dispatch transitions with a reducer

Use `useReducer` when add, save, fail, remove, retry, and reset transitions become difficult to review. Your handler dispatches an addition, performs the async operation outside the reducer, and dispatches a result containing the item ID. React passes the reducer its pending state.

For example, the completion transition can be expressed as this standalone module:

```ts
export type Item = { id: string; status: "pending" | "saved" | "error" };
export type Action =
  | { type: "added"; item: Item }
  | { type: "settled"; id: string; status: "saved" | "error" }
  | { type: "cleared" };

export function itemsReducer(items: Item[], action: Action): Item[] {
  switch (action.type) {
    case "added": return [...items, action.item];
    case "settled": return items.map((item) =>
      item.id === action.id ? { ...item, status: action.status } : item
    );
    case "cleared": return [];
  }
}
```

The reducer organizes transitions; it has the same O(n) copying costs. Keep timers, requests, random IDs, logging side effects, and cancellation outside it. The request-ID and cleanup rules still apply. For an interview with only append and status changes, start with functional setters. [React: useReducer](https://react.dev/reference/react/useReducer).

## When a ref or effect is appropriate

A ref is useful for mutable bookkeeping that should not render: timer handles, cancellation tokens, or a request generation, as above. It is also an option when a long-lived callback specifically needs to **read** a latest committed value for imperative work. A ref mirrored in an effect is updated after commit, not synchronously with every queued setter. Writing a ref does not rerender the UI. Avoid making a second mutable copy of the list just to calculate React state. [React: useRef](https://react.dev/reference/react/useRef).

Use an effect when a committed state change should synchronize an external system. For example, an effect with `[items]` can log the committed list while debugging. Do not add an effect that resubmits all items on every array change unless that repeated synchronization is the intended contract. A button-triggered save can stay in the event handler.

## Fixes that miss the problem

| Attempt | Why it fails or changes the contract |
| --- | --- |
| `await setItems(...)` | A React state setter returns no promise for a committed update. Awaiting it does not replace the handler's captured state. |
| Wait longer or use a promise microtask | Time passing does not change which render created the callback. |
| `setItems(async current => ...)` | An updater must synchronously return the next state, not a Promise. Await the operation outside it. |
| Start the request inside an updater | Updaters must be pure. React can invoke them twice in development Strict Mode to detect impurities. |
| Add `items` to `useCallback` dependencies | This creates a new callback for later renders; it does not rewrite callbacks already scheduled by a timer. |
| Compute `next = [...items, item]`, then later call `setItems(next)` | `next` can be a deliberate request payload, but replacing state with it later can erase other completed work. |

Use a typed empty array in TypeScript, such as `useState<Item[]>([])`, so the element type is explicit. [React: useState contract](https://react.dev/reference/react/useState).

## Senior-engineer recipe

1. Trace one click with `items = []`. Identify the exact render that creates the delayed callback.
2. Clarify the policy: independent items, last request wins for one item, or an ordered queue? Choose IDs and cancellation around that policy.
3. Capture the item's ID and request payload in the handler. Append with a pure functional update.
4. Keep async work outside the updater. Commit success and failure by ID using the pending array.
5. Test two quick additions, success and failure in reverse order, Clear before the timer, and Clear/unmount during a request.
6. Add a request revision for overlapping work on the same item. Explain whether cleanup cancels work or only ignores its result.
7. Consider a reducer when transition rules grow. Do not add refs or memoization merely to hide stale reads.

**Interview summary:** “Each render supplies a state snapshot. This timer captured an earlier one. I'll use functional updates to calculate from pending state, preserve the operation's ID, and add cancellation or revision checks for late results.”

## Check your understanding

[Take the six-question checkpoint](/practice/frontend/react-state-async-questionnaire).

For a larger exercise, [study the asynchronous user matrix](/docs/frontend/interview-user-matrix?path=frontend-interview-practice), then use its guided playground. This is a supplementary React lesson; it does not add another required unit to the seven-challenge path.
