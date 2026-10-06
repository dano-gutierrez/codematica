import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import JapaneseReviewRoute from "../../app/languages/japanese/review";
import { reviewStorageKey } from "../lib/review-persistence";

const mockLoad = jest.fn();
const mockSync = jest.fn();
const mockAdapters = { navigation: { navigate: jest.fn() }, progress: { record: jest.fn() } };
jest.mock("../lib/adapters", () => ({ useCodematicaAdapters: () => mockAdapters }));
jest.mock("../lib/supabase", () => ({ createNativeSupabaseClient: () => undefined }));
jest.mock("../lib/skill-progress", () => ({ loadNativeSkillProgress: () => mockLoad(), syncNativeSkillProgress: (...args: unknown[]) => mockSync(...args) }));
let stored: string | null;
beforeEach(() => {
  jest.clearAllMocks(); stored = null;
  jest.mocked(AsyncStorage.getItem).mockImplementation(async () => stored);
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => { stored = value; });
  mockLoad.mockResolvedValue([]); mockSync.mockResolvedValue(false);
});

it("holds the saved claim until the route acknowledges device storage", async () => {
  let finish!: () => void;
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
    if (value.includes("attemptCount")) await new Promise<void>(resolve => { finish = resolve; });
    stored = value;
  });
  const view = await render(<JapaneseReviewRoute />);
  await waitFor(() => expect(view.getByTestId("mobile-japanese-review-good")).not.toBeDisabled());
  await fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
  await waitFor(() => expect(finish).toBeDefined());
  expect(view.queryByText(/Good saved/)).toBeNull();
  expect(view.getByText("Saving on this device…")).toBeOnTheScreen();
  await act(async () => finish());
  await waitFor(() => expect(view.getByText(/Good saved on this device/)).toBeOnTheScreen());
  expect(JSON.parse(stored!)[0]).toMatchObject({ skillId: "kana-listening", attemptCount: 1 });
});

it("retries the same persisted recall and permits an intentional second attempt", async () => {
  const view = await render(<JapaneseReviewRoute />);
  await waitFor(() => expect(view.getByTestId("mobile-japanese-review-good")).not.toBeDisabled());
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error("disk full"));
  await fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
  await waitFor(() => expect(view.getByRole("button", { name: "Retry save" })).toBeOnTheScreen());
  expect(stored).toBeNull();
  await fireEvent.press(view.getByRole("button", { name: "Retry save" }));
  await waitFor(() => expect(view.getByText(/Good saved on this device/)).toBeOnTheScreen());
  expect(JSON.parse(stored!)[0].attemptCount).toBe(1);
  await fireEvent.press(view.getByTestId("mobile-japanese-review-reset"));
  await fireEvent.press(view.getByTestId("mobile-japanese-review-easy"));
  await waitFor(() => expect(view.getByText(/Easy saved on this device/)).toBeOnTheScreen());
  expect(JSON.parse(stored!)[0].attemptCount).toBe(2);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(reviewStorageKey, stored);
});

it("keeps corrupt data intact and allows a fresh read after explicit reload", async () => {
  stored = '{"private":"must not erase"}';
  const view = await render(<JapaneseReviewRoute />);
  await waitFor(() => expect(view.getByRole("button", { name: "Reload progress" })).toBeOnTheScreen());
  expect(view.getByTestId("mobile-japanese-review-good")).toBeDisabled();
  expect(stored).toBe('{"private":"must not erase"}');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(mockLoad).not.toHaveBeenCalled();
  stored = null; // Simulate storage becoming readable; the UI never deletes it.
  await fireEvent.press(view.getByRole("button", { name: "Reload progress" }));
  await waitFor(() => expect(view.getByTestId("mobile-japanese-review-good")).not.toBeDisabled());
});

it("preserves local practice while remote loading is pending or sync rejects", async () => {
  let finish!: (rows: unknown[]) => void;
  mockLoad.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  mockSync.mockRejectedValue(new Error("offline"));
  const view = await render(<JapaneseReviewRoute />);
  await waitFor(() => expect(view.getByTestId("mobile-japanese-review-good")).not.toBeDisabled());
  await fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
  await waitFor(() => expect(view.getByText(/Good saved on this device/)).toBeOnTheScreen());
  const local = JSON.parse(stored!)[0];
  await act(async () => finish([{ ...local, skillId: "kana-writing" }]));
  await waitFor(() => expect(JSON.parse(stored!)).toHaveLength(2));
  expect(JSON.parse(stored!)).toEqual(expect.arrayContaining([local]));
  expect(view.getByText(/Good saved on this device/)).toBeOnTheScreen();
});

it("preserves changed progress on retry, then reloads without applying the failed recall", async () => {
  const view = await render(<JapaneseReviewRoute />);
  await waitFor(() => expect(view.getByTestId("mobile-japanese-review-good")).not.toBeDisabled());
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error("disk"));
  await fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
  await waitFor(() => expect(view.getByRole("button", { name: "Retry save" })).toBeOnTheScreen());
  stored = JSON.stringify([{ pathSlug: "japanese-foundations", skillId: "kana-listening", bestScore: 1, attemptCount: 9, reviewBox: 4, masteryState: "mastered", lastPracticedAt: "2026-10-04T00:00:00.000Z", nextReviewAt: "2026-11-04T00:00:00.000Z" }]);
  const changed = stored;
  await fireEvent.press(view.getByRole("button", { name: "Retry save" }));
  await waitFor(() => expect(view.getByRole("button", { name: "Reload progress" })).toBeOnTheScreen());
  expect(stored).toBe(changed);
  expect(view.queryByText(/saved on this device/)).toBeNull();
  await fireEvent.press(view.getByRole("button", { name: "Reload progress" }));
  await waitFor(() => expect(view.getByText("Best 100% · box 4")).toBeOnTheScreen());
  expect(stored).toBe(changed);
  expect(view.getByTestId("mobile-japanese-review-good")).not.toBeDisabled();
});

it("does not apply a late remote snapshot after leaving the review route", async () => {
  let finish!: (rows: unknown[]) => void;
  mockLoad.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const view = await render(<JapaneseReviewRoute />);
  await waitFor(() => expect(view.getByTestId("mobile-japanese-review-good")).not.toBeDisabled());
  await view.unmount();
  await act(async () => finish([{ invalid: true }]));
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(mockSync).not.toHaveBeenCalled();
});
