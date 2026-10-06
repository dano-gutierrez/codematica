import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { gameSandboxHtml } from "./html";
import { gameCampaignSchema } from "./schema";
import source from "../../../../content/game/restore-the-signal.json";

type Result = {
  passed: boolean;
  reasons: string[];
  events: string[];
  columns?: string[];
  rows?: number[][];
};

class WorkerStub {
  static instances: WorkerStub[] = [];
  onmessage: ((event: { data: Result }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() {
    WorkerStub.instances.push(this);
  }
}

const query = "SELECT id FROM zombies";
let rendered: string[] = [];
const sandboxDocument = {
  createElement: () => ({ textContent: "" }),
  getElementById: () => ({ appendChild: (element: { textContent: string }) => rendered.push(element.textContent) }),
};
function startSqlPreview() {
  const scenario = gameCampaignSchema.parse(source).levels[1].scenarios[0];
  if (scenario.kind !== "sql") throw new Error("Expected the SQL fixture");
  const html = gameSandboxHtml(scenario, query, "offline-worker", "attempt-1");
  const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  if (!script) throw new Error("Missing sandbox script");
  const postMessage = vi.fn();
  const revokeObjectURL = vi.fn();
  runInNewContext(script, {
    Blob,
    URL: { createObjectURL: () => "blob:worker", revokeObjectURL },
    Worker: WorkerStub,
    document: sandboxDocument,
    window: { ReactNativeWebView: { postMessage } },
    setTimeout,
    clearTimeout,
  });
  return { worker: WorkerStub.instances[0], postMessage, revokeObjectURL, scenario };
}

beforeEach(() => {
  vi.useFakeTimers();
  WorkerStub.instances = [];
  rendered = [];
});
afterEach(() => {
  vi.useRealTimers();
});

it("bounds the whole SQL worker at two seconds and describes the runner timeout accurately", () => {
  const { worker, postMessage, revokeObjectURL, scenario } = startSqlPreview();
  expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith({ scenario, source: query });
  vi.advanceTimersByTime(1999);
  expect(postMessage).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(postMessage).toHaveBeenCalledTimes(1);
  expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
    channel: "codematica-game",
    nonce: "attempt-1",
    result: {
      passed: false,
      reasons: ["The local SQL runner took too long. Retry your query."],
      events: [],
    },
  });
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:worker");
});

it("ignores queued worker results and errors after the deadline", () => {
  const { worker, postMessage, revokeObjectURL } = startSqlPreview();
  vi.advanceTimersByTime(2000);
  worker.onmessage?.({ data: { passed: true, reasons: [], events: [], columns: ["id"], rows: [[1]] } });
  worker.onerror?.();
  expect(postMessage).toHaveBeenCalledTimes(1);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  expect(rendered).toEqual([]);
});

it("renders a timely result once and cancels its deadline", () => {
  const { worker, postMessage, revokeObjectURL } = startSqlPreview();
  const result = { passed: true, reasons: [], events: [], columns: ["id"], rows: [[1]] };
  vi.advanceTimersByTime(1500);
  worker.onmessage?.({ data: result });
  worker.onmessage?.({ data: result });
  vi.advanceTimersByTime(10000);
  expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({ channel: "codematica-game", nonce: "attempt-1", result });
  expect(postMessage).toHaveBeenCalledTimes(1);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  expect(rendered).toEqual(["id\n1"]);
});

it("reports worker startup errors once without a later timeout", () => {
  const { worker, postMessage } = startSqlPreview();
  worker.onerror?.();
  vi.advanceTimersByTime(10000);
  worker.onmessage?.({ data: { passed: true, reasons: [], events: [] } });
  expect(JSON.parse(postMessage.mock.calls[0][0]).result.reasons).toEqual(["The local SQL runner could not start. Retry this level."]);
  expect(postMessage).toHaveBeenCalledTimes(1);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
});
