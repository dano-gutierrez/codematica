import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { getExerciseBySlug } from "@codematica/core";
import { PracticeScreen } from "../../../../packages/ui/src/screens";

const exercise = getExerciseBySlug("ml-systems/ai-triad-guided-lab")!;
if (exercise.type !== "guided-lab") throw new Error("Expected guided lab fixture");
const lab = exercise;
const navigate = jest.fn();
async function prepare(view: Awaited<ReturnType<typeof render>>) {
  await fireEvent.press(view.getByRole("radio", { name: lab.prediction.options[1].label }));
  for (const item of lab.evidenceChecklist) await fireEvent.press(view.getByRole("checkbox", { name: item.label }));
  await fireEvent.changeText(view.getByLabelText(lab.reflectionPrompts[0]), "Keep this private working note");
}

it("announces completion only after progress acknowledgment and disables repeated completion", async () => {
  let finish!: () => void;
  const record = jest.fn((_target, status) => status === "completed" ? new Promise<void>(resolve => { finish = resolve; }) : Promise.resolve());
  const view = await render(<PracticeScreen exercise={lab} nextHref="/paths/ml-systems-engineer/flashcards" adapters={{ navigation: { navigate }, progress: { record } }} />);
  await prepare(view);
  await fireEvent.press(view.getByTestId("mobile-guided-lab-complete"));
  expect(view.getByText("Completing lab…")).toBeOnTheScreen();
  expect(view.queryByText("Lab complete.")).toBeNull();
  expect(view.getByTestId("mobile-guided-lab-complete")).toBeDisabled();
  expect(view.getByRole("radio", { name: lab.prediction.options[1].label })).toBeDisabled();
  await fireEvent.press(view.getByTestId("mobile-guided-lab-complete"));
  expect(record.mock.calls.filter(([, status]) => status === "completed")).toHaveLength(1);
  await act(async () => finish());
  await waitFor(() => expect(view.getByText("Lab complete.")).toBeOnTheScreen());
  expect(view.getByRole("button", { name: "Start review feed" })).toBeOnTheScreen();
  expect(view.getByLabelText(lab.reflectionPrompts[0]).props.value ?? view.getByLabelText(lab.reflectionPrompts[0]).props.defaultValue).toBe("Keep this private working note");
  expect(record).toHaveBeenLastCalledWith(expect.objectContaining({ slug: lab.slug }), "completed", { predictionCommitted: true, evidenceCount: 3, evidenceTotal: 3 });
  await fireEvent.press(view.getByRole("button", { name: "Practice again" }));
  expect(view.getByTestId("mobile-guided-lab-complete")).toBeDisabled();
  expect(view.getByRole("radio", { name: lab.prediction.options[1].label }).props.accessibilityState.checked).toBe(false);
  expect(view.getByLabelText(lab.reflectionPrompts[0]).props.value ?? "").toBe("");
});

it("keeps choices and private notes through a failed completion and retries the same milestone", async () => {
  let failures = 1;
  const record = jest.fn(async (_target, status, _position?: Record<string, unknown>) => { if (status === "completed" && failures-- > 0) throw new Error("storage failed"); });
  const view = await render(<PracticeScreen exercise={lab} adapters={{ navigation: { navigate }, progress: { record } }} />);
  await prepare(view);
  await fireEvent.press(view.getByTestId("mobile-guided-lab-complete"));
  await waitFor(() => expect(view.getByRole("button", { name: "Retry completion" })).toBeOnTheScreen());
  expect(view.queryByText("Lab complete.")).toBeNull();
  expect(view.getByRole("checkbox", { name: lab.evidenceChecklist[0].label }).props.accessibilityState.checked).toBe(true);
  expect(view.getByLabelText(lab.reflectionPrompts[0]).props.value ?? view.getByLabelText(lab.reflectionPrompts[0]).props.defaultValue).toBe("Keep this private working note");
  await fireEvent.press(view.getByRole("button", { name: "Retry completion" }));
  await waitFor(() => expect(view.getByText("Lab complete.")).toBeOnTheScreen());
  expect(record.mock.calls.filter(([, status]) => status === "completed").map(call => call[2])).toEqual([
    { predictionCommitted: true, evidenceCount: 3, evidenceTotal: 3 },
    { predictionCommitted: true, evidenceCount: 3, evidenceTotal: 3 },
  ]);
});

it("ignores an older start-save failure after a completed lab", async () => {
  let rejectStart!: (error: Error) => void;
  const record = jest.fn((_target, status) => status === "started" ? new Promise<void>((_resolve, reject) => { rejectStart = reject; }) : Promise.resolve());
  const view = await render(<PracticeScreen exercise={lab} adapters={{ navigation: { navigate }, progress: { record } }} />);
  await prepare(view);
  await fireEvent.press(view.getByTestId("mobile-guided-lab-complete"));
  await waitFor(() => expect(view.getByText("Lab complete.")).toBeOnTheScreen());
  await act(async () => rejectStart(new Error("old failure")));
  expect(view.queryByRole("alert")).toBeNull();
});

it("reports a start-save failure without discarding work and handles a late completion rejection after leaving", async () => {
  let rejectCompletion!: (error: Error) => void;
  const record = jest.fn((_target, status) => status === "started" ? Promise.reject(new Error("offline")) : new Promise<void>((_resolve, reject) => { rejectCompletion = reject; }));
  const view = await render(<PracticeScreen exercise={lab} adapters={{ navigation: { navigate }, progress: { record } }} />);
  await prepare(view);
  await waitFor(() => expect(view.getByRole("alert")).toHaveTextContent(/Keep working/));
  await fireEvent.press(view.getByTestId("mobile-guided-lab-complete"));
  await view.unmount();
  await act(async () => rejectCompletion(new Error("late failure")));
});
