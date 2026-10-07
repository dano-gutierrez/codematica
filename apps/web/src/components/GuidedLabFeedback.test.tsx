import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getExerciseBySlug } from "@/lib/content";
import { PracticeCard } from "./PracticeCard";

const exercise = getExerciseBySlug("ml-systems/ai-triad-guided-lab")!;
if (exercise.type !== "guided-lab") throw new Error("Expected guided lab fixture");
const lab = exercise;
function prepare() {
  fireEvent.click(screen.getByLabelText(lab.prediction.options[1].label));
  for (const item of lab.evidenceChecklist) fireEvent.click(screen.getByLabelText(item.label));
  fireEvent.change(screen.getByLabelText(lab.reflectionPrompts[0]), { target: { value: "Private working note" } });
}

it("waits for completion acknowledgment, focuses the result and restarts without erasing earned progress", async () => {
  let finish!: () => void;
  const onProgressEvent = vi.fn((status) => status === "completed" ? new Promise<void>(resolve => { finish = resolve; }) : Promise.resolve());
  render(<PracticeCard exercise={lab} nextHref="/paths/ml-systems-engineer/flashcards" onProgressEvent={onProgressEvent} />);
  prepare();
  fireEvent.click(screen.getByTestId("guided-lab-complete"));
  expect(screen.getByText("Completing lab…")).toBeVisible();
  expect(screen.queryByText("Lab complete.")).not.toBeInTheDocument();
  expect(screen.getByTestId("guided-lab-complete")).toBeDisabled();
  fireEvent.click(screen.getByTestId("guided-lab-complete"));
  expect(onProgressEvent.mock.calls.filter(([status]) => status === "completed")).toHaveLength(1);
  await act(async () => finish());
  await waitFor(() => expect(screen.getByRole("heading", { name: "Lab complete." })).toHaveFocus());
  expect(screen.getByLabelText(lab.reflectionPrompts[0])).toHaveValue("Private working note");
  expect(screen.getByRole("link", { name: "Start review feed" })).toHaveAttribute("href", "/paths/ml-systems-engineer/flashcards");
  fireEvent.click(screen.getByRole("button", { name: "Practice again" }));
  expect(screen.getByLabelText(lab.reflectionPrompts[0])).toHaveValue("");
  expect(screen.getByLabelText(lab.prediction.options[0].label)).toHaveFocus();
  expect(screen.getByTestId("guided-lab-complete")).toBeDisabled();
  expect(onProgressEvent.mock.calls.filter(([status]) => status === "completed")).toHaveLength(1);
});

it("keeps choices and notes through failure, retries the same milestone and excludes notes from progress", async () => {
  let failures = 1;
  const onProgressEvent = vi.fn(async (status) => { if (status === "completed" && failures-- > 0) throw new Error("disk"); });
  render(<PracticeCard exercise={lab} onProgressEvent={onProgressEvent} />);
  prepare();
  fireEvent.click(screen.getByTestId("guided-lab-complete"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Retry completion" })).toBeVisible());
  expect(screen.getByRole("alert")).toHaveTextContent(/choices and working notes/);
  expect(screen.getByLabelText(lab.reflectionPrompts[0])).toHaveValue("Private working note");
  expect(screen.getByLabelText(lab.evidenceChecklist[0].label)).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Retry completion" }));
  await waitFor(() => expect(screen.getByText("Lab complete.")).toBeVisible());
  expect(onProgressEvent.mock.calls.filter(([status]) => status === "completed")).toEqual([
    ["completed", { predictionCommitted: true, evidenceCount: 3, evidenceTotal: 3 }],
    ["completed", { predictionCommitted: true, evidenceCount: 3, evidenceTotal: 3 }],
  ]);
});

it("keeps an older start-write failure from replacing completed feedback", async () => {
  let rejectStart!: (error: Error) => void;
  const onProgressEvent = vi.fn((status) => status === "started" ? new Promise<void>((_resolve, reject) => { rejectStart = reject; }) : Promise.resolve());
  render(<PracticeCard exercise={lab} onProgressEvent={onProgressEvent} />);
  prepare();
  fireEvent.click(screen.getByTestId("guided-lab-complete"));
  await waitFor(() => expect(screen.getByText("Lab complete.")).toBeVisible());
  await act(async () => rejectStart(new Error("old failure")));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("reports a start-write failure while leaving the lab usable and handles a late rejection after unmount", async () => {
  let rejectCompletion!: (error: Error) => void;
  const onProgressEvent = vi.fn((status) => status === "started" ? Promise.reject(new Error("offline")) : new Promise<void>((_resolve, reject) => { rejectCompletion = reject; }));
  const view = render(<PracticeCard exercise={lab} onProgressEvent={onProgressEvent} />);
  prepare();
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/Keep working/));
  fireEvent.click(screen.getByTestId("guided-lab-complete"));
  expect(screen.getByText("Completing lab…")).toBeVisible();
  view.unmount();
  await act(async () => rejectCompletion(new Error("late failure")));
});
