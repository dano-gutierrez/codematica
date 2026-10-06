import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { getContentIndex } from "@codematica/core";
import { JapaneseReviewScreen } from "../../../../packages/ui/src/screens";

const learningPath = getContentIndex().learningPaths.find(path => path.slug === "japanese-foundations")!;
const adapters = { navigation: { navigate: jest.fn() }, progress: { record: jest.fn() } };

it("shows pending acknowledgment before saved and disables repeat taps", async () => {
  let finish!: () => void;
  const onRate = jest.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  const view = await render(<JapaneseReviewScreen learningPath={learningPath} progress={[]} onRate={onRate} adapters={adapters} />);
  await fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
  expect(view.queryByText(/Good saved/)).toBeNull();
  expect(view.getByText("Saving on this device…")).toBeOnTheScreen();
  expect(view.queryByTestId("mobile-japanese-review-reset")).toBeNull();
  await fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
  expect(onRate).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  await waitFor(() => expect(view.getByText(/Good saved on this device/)).toBeOnTheScreen());
  await fireEvent.press(view.getByTestId("mobile-japanese-review-reset"));
  expect(view.getByTestId("mobile-japanese-review-good")).not.toBeDisabled();
});

it("keeps the chosen recall on failure and retries the same skill and rating", async () => {
  const onRate = jest.fn().mockRejectedValueOnce(new Error("disk")).mockResolvedValue(undefined);
  const view = await render(<JapaneseReviewScreen learningPath={learningPath} progress={[]} onRate={onRate} adapters={adapters} />);
  await fireEvent.press(view.getByTestId("mobile-japanese-review-hard"));
  await waitFor(() => expect(view.getByRole("button", { name: "Retry save" })).toBeOnTheScreen());
  expect(view.queryByText(/saved/)).toBeNull();
  expect(view.getByTestId("mobile-japanese-review-hard")).toBeDisabled();
  await fireEvent.press(view.getByRole("button", { name: "Retry save" }));
  await waitFor(() => expect(view.getByText(/Hard saved on this device/)).toBeOnTheScreen());
  expect(onRate.mock.calls).toEqual([["kana-listening", "hard"], ["kana-listening", "hard"]]);
});

it("requires reload for a conflicting recall and keeps rating disabled during load failure", async () => {
  const conflict = Object.assign(new Error("changed"), { name: "ReviewSaveConflict" });
  const onRate = jest.fn().mockRejectedValue(conflict);
  const onReload = jest.fn();
  const view = await render(<JapaneseReviewScreen learningPath={learningPath} progress={[]} onRate={onRate} adapters={adapters} onReload={onReload} />);
  await fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
  await waitFor(() => expect(view.getByRole("button", { name: "Reload progress" })).toBeOnTheScreen());
  expect(view.queryByRole("button", { name: "Retry save" })).toBeNull();
  await fireEvent.press(view.getByRole("button", { name: "Reload progress" }));
  expect(onReload).toHaveBeenCalledTimes(1);
  await view.rerender(<JapaneseReviewScreen learningPath={learningPath} progress={[]} onRate={onRate} adapters={adapters} onReload={onReload} loading />);
  expect(view.getByText("Loading saved progress…")).toBeOnTheScreen();
  expect(view.getByTestId("mobile-japanese-review-good")).toBeDisabled();
  await view.rerender(<JapaneseReviewScreen learningPath={learningPath} progress={[]} onRate={onRate} adapters={adapters} onReload={onReload} loadError />);
  expect(view.getByRole("alert")).toHaveTextContent(/saved data has been kept/);
  expect(view.getByTestId("mobile-japanese-review-good")).toBeDisabled();
});

it("handles completion after leaving the screen without another save", async () => {
  let reject!: (error: Error) => void;
  const onRate = jest.fn(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
  const view = await render(<JapaneseReviewScreen learningPath={learningPath} progress={[]} onRate={onRate} adapters={adapters} />);
  await fireEvent.press(view.getByTestId("mobile-japanese-review-easy"));
  await view.unmount();
  await act(async () => reject(new Error("late failure")));
  expect(onRate).toHaveBeenCalledTimes(1);
});
