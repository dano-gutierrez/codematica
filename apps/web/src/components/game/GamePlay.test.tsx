import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getContentIndex } from "@codematica/core";
import {
  GameStore,
  awardScenario,
  emptyGameProgress,
  getGameSession,
} from "@codematica/core/game";
import { GamePlay } from "./GamePlay";
const campaign = getContentIndex().gameCampaigns[0];
let store: GameStore;
vi.mock("@/lib/game/store", () => ({ webGameStore: () => store }));
vi.mock("./GameScene", () => ({ GameScene: () => <div>Patch</div> }));
async function open(order: number, unlock = true) {
  let progress = emptyGameProgress();
  if (unlock)
    for (const l of campaign.levels.slice(0, order))
      progress = awardScenario(progress, campaign, l.id, "main", "standard");
  store = new GameStore(campaign, {
    getItem: () => JSON.stringify(progress),
    setItem: vi.fn(),
  });
  const level = campaign.levels[order];
  const session = getGameSession(campaign.id, level);
  session.choose("main");
  session.reset();
  render(<GamePlay campaign={campaign} level={level} />);
  await waitFor(() =>
    expect(
      screen.queryByText("Preparing Patch’s workshop…"),
    ).not.toBeInTheDocument(),
  );
  return session;
}
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, text: async () => "worker" }),
  );
});
afterEach(() => vi.useRealTimers());
it("explains locks without disabling access to the story map", async () => {
  await open(1, false);
  expect(screen.getByText("This signal is still out of reach.")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Return to the map" }),
  ).toHaveAttribute("href", "/");
});
it("edits and resets real CSS, ignores unrelated messages, then claims one completion", async () => {
  const session = await open(0);
  fireEvent.change(screen.getByTestId("game-code"), {
    target: { value: "grid-column: 2 / 3;" },
  });
  fireEvent.click(screen.getByTestId("game-run"));
  await act(async () => {});
  const frame = screen.getByTestId("game-sandbox") as HTMLIFrameElement;
  const nonce = JSON.parse(
    frame.srcdoc.match(/const data=(.*);\nconst send/)![1],
  ).nonce;
  act(() =>
    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.contentWindow!,
        data: {
          channel: "other",
          nonce,
          result: { passed: true, reasons: [], events: [] },
        },
      }),
    ),
  );
  expect(session.getSnapshot().attempt.phase).toBe("briefing");
  act(() =>
    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.contentWindow!,
        data: {
          channel: "codematica-game",
          nonce,
          result: {
            passed: true,
            reasons: [],
            events: ["Net covers the target."],
          },
        },
      }),
    ),
  );
  await waitFor(() =>
    expect(screen.getByTestId("game-result")).toHaveTextContent(
      "Signal restored!",
    ),
  );
  expect(Object.keys(store.getSnapshot().awards)).toHaveLength(1);
  fireEvent.click(screen.getByTestId("game-scenario-mastery-1"));
  expect(session.getSnapshot().scenario.id).toBe("mastery-1");
  fireEvent.click(screen.getByTestId("game-reset"));
  expect(session.getSnapshot().attempt.phase).toBe("briefing");
});
it("shows SQL fixture data, handles runner failures and resets stalled execution", async () => {
  await open(1);
  expect(screen.getByText("zombies")).toBeVisible();
  vi.mocked(fetch).mockRejectedValueOnce(Error("offline"));
  fireEvent.click(screen.getByTestId("game-run"));
  await waitFor(() =>
    expect(screen.getByTestId("game-result")).toHaveTextContent(
      "failed to load",
    ),
  );
  fireEvent.click(screen.getByTestId("game-reset"));
  fireEvent.click(screen.getByTestId("game-run"));
  await waitFor(() =>
    expect(screen.getByTestId("game-sandbox")).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByTestId("game-reset"));
  expect(screen.queryByTestId("game-sandbox")).not.toBeInTheDocument();
});
it("traces broken pipes, surfaces progressive help and completes the correct request graph", async () => {
  const session = await open(2);
  fireEvent.click(screen.getByTestId("game-run"));
  fireEvent.click(screen.getByTestId("game-run"));
  expect(session.getSnapshot().failures).toBe(2);
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId("game-hint"));
  const sc = session.getSnapshot().scenario;
  if (sc.kind !== "pipes") throw Error();
  for (const edge of sc.solution) {
    fireEvent.click(screen.getByTestId(`game-port-${edge.from}`));
    fireEvent.click(screen.getByTestId(`game-port-${edge.to}`));
  }
  fireEvent.click(
    screen.getByRole("button", {
      name: `Remove ${sc.solution[0].from} to ${sc.solution[0].to}`,
    }),
  );
  fireEvent.click(screen.getByTestId(`game-port-${sc.solution[0].from}`));
  fireEvent.click(screen.getByTestId(`game-port-${sc.solution[0].to}`));
  fireEvent.click(screen.getByTestId("game-run"));
  expect(screen.getByTestId("game-result")).toHaveTextContent(
    "Signal restored!",
  );
});
it("places, connects and moves infrastructure with keyboard alternatives", async () => {
  const session = await open(3);
  const sc = session.getSnapshot().scenario;
  if (sc.kind !== "system") throw Error();
  for (const id of sc.solution.nodes)
    fireEvent.click(screen.getByTestId(`game-piece-${id}`));
  const client = screen.getByTestId("game-connect-client");
  fireEvent.keyDown(client, { key: "ArrowRight" });
  expect(session.getSnapshot().board.positions?.client.x).toBeGreaterThan(0.18);
  for (const e of sc.solution.edges) {
    fireEvent.click(screen.getByTestId(`game-connect-${e.from}`));
    fireEvent.click(screen.getByTestId(`game-connect-${e.to}`));
  }
  fireEvent.click(screen.getByLabelText("Capacity weighted"));
  fireEvent.click(
    screen.getByLabelText("Remove unhealthy APIs with health checks"),
  );
  fireEvent.click(
    screen.getByLabelText("Invalidate cached targeting data after writes"),
  );
  fireEvent.click(screen.getByTestId("game-run"));
  expect(screen.getByTestId("game-result")).toHaveTextContent(
    "Signal restored!",
  );
});
it("freezes live editing while paused, requires resume after backgrounding, and allows assistance", async () => {
  const session = await open(7);
  fireEvent.click(screen.getByTestId("game-run"));
  fireEvent.click(screen.getByTestId("game-pause"));
  expect(screen.getByTestId("game-piece-client")).toBeDisabled();
  fireEvent.click(screen.getByTestId("game-resume"));
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  fireEvent(document, new Event("visibilitychange"));
  expect(session.getSnapshot().attempt.phase).toBe("paused");
  expect(screen.getByTestId("game-resume")).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Use assisted untimed mode" }),
  );
  expect(session.getSnapshot().attempt.assisted).toBe(true);
  expect(screen.getByTestId("game-run")).toHaveTextContent("Run solution");
});

it.each(["fetch", "body"])("discards a %s rejection after resetting the attempt", async (boundary) => {
  const session = await open(1);
  let reject!: (error: Error) => void;
  const pending = new Promise<never>((_resolve, fail) => { reject = fail; });
  if (boundary === "fetch") vi.mocked(fetch).mockReturnValueOnce(pending);
  else vi.mocked(fetch).mockResolvedValueOnce(Object.assign(new Response(""), { text: () => pending }));
  fireEvent.click(screen.getByTestId("game-run"));
  await act(async () => {});
  const signal = vi.mocked(fetch).mock.calls.at(-1)?.[1]?.signal;
  fireEvent.click(screen.getByTestId("game-reset"));
  await act(async () => { reject(Error("late failure")); });
  expect(session.getSnapshot().failures).toBe(0);
  expect(session.getSnapshot().result).toBeNull();
  expect(signal?.aborted).toBe(true);
});

it("discards a late worker download after timeout and preserves the replacement draft", async () => {
  const session = await open(1);
  let resolve!: (response: Response) => void;
  vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>((done) => { resolve = done; }));
  vi.useFakeTimers();
  fireEvent.click(screen.getByTestId("game-run"));
  await act(async () => { vi.advanceTimersByTime(10000); });
  expect(session.getSnapshot().failures).toBe(1);
  await act(async () => { resolve({ ok: true, text: async () => "late worker" } as Response); });
  expect(screen.queryByTestId("game-sandbox")).not.toBeInTheDocument();
  fireEvent.change(screen.getByTestId("game-code"), { target: { value: "SELECT id FROM zombies WHERE threat > 4;" } });
  expect(session.getSnapshot().code).toBe("SELECT id FROM zombies WHERE threat > 4;");
  expect(session.getSnapshot().result).toBeNull();
});

it("cancels the worker download when leaving for a lesson", async () => {
  const session = await open(1);
  let reject!: (error: Error) => void;
  vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>((_done, fail) => { reject = fail; }));
  fireEvent.click(screen.getByTestId("game-run"));
  const signal = vi.mocked(fetch).mock.calls.at(-1)?.[1]?.signal;
  cleanup();
  await act(async () => { reject(Error("after navigation")); });
  expect(session.getSnapshot().failures).toBe(0);
  expect(signal?.aborted).toBe(true);
});
