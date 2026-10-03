import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  createCustomNotebook,
  getContentIndex,
  type NotebookStorage,
} from "@codematica/core";
import {
  useNotebookInkRejection,
  useNotebookSession,
} from "@codematica/ui/notebook-session";
afterEach(() => vi.useRealTimers());
it("delays error feedback and cancels it if writing resumes before the grace period ends", () => {
  vi.useFakeTimers();
  const clear = vi.fn(), showError = vi.fn();
  const view = renderHook(() => useNotebookInkRejection(clear));
  act(() => view.result.current.reject(showError));
  act(() => vi.advanceTimersByTime(799));
  expect(view.result.current.phase).toBe("idle");
  expect(showError).not.toHaveBeenCalled();
  act(() => view.result.current.cancel());
  act(() => vi.advanceTimersByTime(3000));
  expect(showError).not.toHaveBeenCalled();
  expect(clear).not.toHaveBeenCalled();
  act(() => view.result.current.reject(showError));
  act(() => vi.advanceTimersByTime(800));
  expect(view.result.current.phase).toBe("rejected");
  expect(showError).toHaveBeenCalledTimes(1);
  act(() => view.result.current.reject(showError));
  view.unmount();
  act(() => vi.advanceTimersByTime(3000));
  expect(showError).toHaveBeenCalledTimes(1);
  expect(clear).not.toHaveBeenCalled();
});
it("waits before fading, clears exactly once, and uses the latest expiry callback", () => {
  vi.useFakeTimers();
  const original = vi.fn(),
    latest = vi.fn();
  const view = renderHook(({ onExpire }) => useNotebookInkRejection(onExpire), {
    initialProps: { onExpire: original },
  });
  act(() => view.result.current.reject());
  act(() => vi.advanceTimersByTime(1999));
  expect(view.result.current.phase).toBe("rejected");
  act(() => vi.advanceTimersByTime(1));
  expect(view.result.current.phase).toBe("fading");
  view.rerender({ onExpire: latest });
  act(() => vi.advanceTimersByTime(250));
  expect(latest).toHaveBeenCalledTimes(1);
  expect(original).not.toHaveBeenCalled();
  expect(view.result.current.phase).toBe("idle");
  act(() => vi.advanceTimersByTime(5000));
  expect(latest).toHaveBeenCalledTimes(1);
});
it("restarts rejection timing and cancels expiry on correction or unmount", () => {
  vi.useFakeTimers();
  const clear = vi.fn();
  const view = renderHook(() => useNotebookInkRejection(clear));
  act(() => view.result.current.reject());
  act(() => vi.advanceTimersByTime(1100));
  act(() => view.result.current.reject());
  expect(view.result.current.attempt).toBe(1);
  act(() => vi.advanceTimersByTime(800));
  expect(view.result.current.attempt).toBe(2);
  act(() => vi.advanceTimersByTime(350));
  expect(clear).not.toHaveBeenCalled();
  act(() => view.result.current.cancel());
  act(() => vi.advanceTimersByTime(2500));
  expect(clear).not.toHaveBeenCalled();
  act(() => view.result.current.reject());
  view.unmount();
  act(() => vi.advanceTimersByTime(2500));
  expect(clear).not.toHaveBeenCalled();
});
it("saves each accepted character locally while a previous remote sync is still pending", async () => {
  const n = createCustomNotebook("一", getContentIndex()),
    storage: NotebookStorage = {
      load: vi.fn(async () => undefined),
      save: vi.fn(async () => undefined),
      saveDefinition: vi.fn(async () => undefined),
      list: vi.fn(async () => []),
      sync: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockImplementation(() => new Promise(() => undefined)),
    };
  const view = renderHook(() => useNotebookSession(n, storage));
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  act(() => {
    view.result.current.commit("one", [
      {
        points: [
          [10, 50],
          [90, 50],
        ],
      },
    ]);
  });
  await waitFor(() => expect(storage.save).toHaveBeenCalledTimes(1));
  act(() => {
    view.result.current.commit("two", [
      {
        points: [
          [10, 50],
          [90, 50],
        ],
      },
    ]);
  });
  await waitFor(() => expect(storage.save).toHaveBeenCalledTimes(2), {
    timeout: 150,
  });
  expect(
    vi.mocked(storage.save).mock.calls[1]![0].pages[n.sheets[0]!.id]!.cells,
  ).toHaveLength(2);
  view.unmount();
});
it("persists difficulty and keeps it through restart and restoration", async () => {
  const notebook = createCustomNotebook("一", getContentIndex());
  const storage: NotebookStorage = {
    load: vi.fn(),
    save: vi.fn(),
    saveDefinition: vi.fn(),
    list: vi.fn(),
  };
  const view = renderHook(() => useNotebookSession(notebook, storage));
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  expect(view.result.current.difficulty).toBe("easy");
  act(() => view.result.current.setDifficulty("precise"));
  await waitFor(() =>
    expect(storage.save).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: "precise" }),
    ),
  );
  act(() => view.result.current.restart());
  expect(view.result.current.difficulty).toBe("precise");
  const saved = view.result.current.snapshot;
  view.unmount();
  vi.mocked(storage.load).mockResolvedValue(saved);
  const restored = renderHook(() => useNotebookSession(notebook, storage));
  await waitFor(() => expect(restored.result.current.loading).toBe(false));
  expect(restored.result.current.difficulty).toBe("precise");
});
