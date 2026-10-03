import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { createCustomNotebook, getContentIndex } from "@codematica/core";
import { JapaneseNotebookCatalog } from "./JapaneseNotebookCatalog";
const { storage, replace, query } = vi.hoisted(() => ({
  storage: {
    list: vi.fn(),
    saveDefinition: vi.fn(),
    load: vi.fn(),
    save: vi.fn(),
    loadRomajiPreference: vi.fn(),
    saveRomajiPreference: vi.fn(),
  },
  replace: vi.fn(),
  query: { value: "" },
}));
vi.mock("@/lib/notebooks/storage", () => ({
  createWebNotebookStorage: () => storage,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(query.value),
}));
vi.mock("./JapaneseWritingPractice", () => ({
  JapaneseWritingPractice: ({ notebook }: { notebook: { id: string } }) => (
    <div data-testid="notebook-test">{notebook.id}</div>
  ),
}));
beforeEach(() => {
  vi.clearAllMocks();
  storage.list.mockResolvedValue([]);
  storage.saveDefinition.mockResolvedValue(undefined);
  query.value = "";
  storage.loadRomajiPreference.mockReset().mockResolvedValue(true);
  storage.saveRomajiPreference.mockReset().mockResolvedValue(undefined);
});
it("shows Japanese card prompts with optional romaji above and preserves the preference when reopening", async () => {
  const view = render(<JapaneseNotebookCatalog />);
  const card = screen.getByTestId("notebook-curated-languages-japanese-hiragana-h-m-writing-notebook-v1");
  expect(card).toHaveTextContent("はひ");
  expect(card).not.toHaveTextContent("H And M");
  expect(within(card).getByText("ha · hi").tagName).toBe("RT");
  const toggle = screen.getByRole("switch", { name: "Show romaji" });
  await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"));
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-checked", "false");
  expect(within(card).getByText("ha · hi")).not.toBeVisible();
  expect(card).toHaveTextContent("はひ");
  await waitFor(() => expect(storage.saveRomajiPreference).toHaveBeenCalledWith(false));
  view.unmount();
  storage.loadRomajiPreference.mockResolvedValue(false);
  render(<JapaneseNotebookCatalog />);
  await waitFor(() => expect(screen.getByRole("switch", { name: "Show romaji" })).toHaveAttribute("aria-checked", "false"));
  expect(within(screen.getByTestId("notebook-curated-languages-japanese-hiragana-h-m-writing-notebook-v1")).getByText("ha · hi")).not.toBeVisible();
});
it("uses whole-phrase readings and applies the toggle to saved notebooks too", async () => {
  storage.list.mockResolvedValue([createCustomNotebook("あい", getContentIndex())]);
  render(<JapaneseNotebookCatalog />);
  await screen.findByTestId("notebook-saved-custom-3042-3044-v1");
  expect(screen.getByText("konnichiwa")).toBeInTheDocument();
  expect(screen.getByText("a i")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("switch", { name: "Show romaji" }));
  expect(screen.getByText("konnichiwa")).not.toBeVisible();
  expect(screen.getByTestId("notebook-saved-custom-3042-3044-v1")).toHaveTextContent("あい");
});
it("keeps a user's toggle when preference restoration is late and storage is unavailable", async () => {
  let restore!: (show: boolean) => void;
  storage.loadRomajiPreference.mockReturnValue(new Promise<boolean>(resolve => { restore = resolve; }));
  storage.saveRomajiPreference.mockRejectedValue(new Error("unavailable"));
  render(<JapaneseNotebookCatalog />);
  fireEvent.click(screen.getByRole("switch", { name: "Show romaji" }));
  await act(async () => restore(true));
  expect(screen.getByRole("switch", { name: "Show romaji" })).toHaveAttribute("aria-checked", "false");
});
it("defaults to readable romaji if restoring the preference fails", async () => {
  storage.loadRomajiPreference.mockRejectedValue(new Error("blocked"));
  await act(async () => { render(<JapaneseNotebookCatalog />); });
  expect(screen.getByRole("switch", { name: "Show romaji" })).toHaveAttribute("aria-checked", "true");
  expect(within(screen.getByTestId("notebook-curated-languages-japanese-hiragana-h-m-writing-notebook-v1")).getByText("ha · hi")).toBeInTheDocument();
});
it("serializes rapid preference changes and ignores restoration after unmount", async () => {
  let finishSave!: () => void;
  storage.saveRomajiPreference.mockImplementationOnce(() => new Promise<void>(resolve => { finishSave = resolve; }));
  const view = render(<JapaneseNotebookCatalog />);
  const toggle = screen.getByRole("switch", { name: "Show romaji" });
  fireEvent.click(toggle);
  await waitFor(() => expect(storage.saveRomajiPreference).toHaveBeenCalledWith(false));
  fireEvent.click(toggle);
  expect(storage.saveRomajiPreference).toHaveBeenCalledTimes(1);
  await act(async () => finishSave());
  await waitFor(() => expect(storage.saveRomajiPreference).toHaveBeenNthCalledWith(2, true));
  view.unmount();
  let restore!: (show: boolean) => void;
  storage.loadRomajiPreference.mockReturnValue(new Promise<boolean>(resolve => { restore = resolve; }));
  const pending = render(<JapaneseNotebookCatalog />);
  pending.unmount();
  await act(async () => restore(false));
});
it("validates custom input inline, normalizes whitespace, creates and restores saved notebooks", async () => {
  render(<JapaneseNotebookCatalog />);
  await waitFor(() => expect(storage.list).toHaveBeenCalled());
  fireEvent.change(screen.getByTestId("notebook-custom-text"), {
    target: { value: "A" },
  });
  expect(screen.getByRole("status")).toHaveTextContent(
    "No writing guide for: A",
  );
  expect(screen.getByTestId("notebook-create")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "あい" }));
  fireEvent.change(screen.getByTestId("notebook-custom-text"), {
    target: { value: "あ い" },
  });
  fireEvent.click(screen.getByTestId("notebook-create"));
  await screen.findByTestId("notebook-test");
  expect(storage.saveDefinition).toHaveBeenCalledWith(
    expect.objectContaining({ id: "custom-3042-3044-v1" }),
  );
  expect(replace).toHaveBeenCalledWith(
    expect.stringContaining("custom-3042-3044-v1"),
    { scroll: false },
  );
  const n = createCustomNotebook("あい", getContentIndex());
  storage.list.mockResolvedValue([n]);
  query.value = "notebook=" + n.id;
  fireEvent.click(screen.getByTestId("notebooks-back"));
  await screen.findByTestId("notebook-saved-" + n.id);
  fireEvent.click(screen.getByTestId("notebook-saved-" + n.id));
  expect(screen.getByTestId("notebook-test")).toHaveTextContent(n.id);
});
it("opens curated notebooks and query links, and retries saved notebook failures", async () => {
  storage.list.mockRejectedValueOnce(new Error("unavailable"));
  const view = render(<JapaneseNotebookCatalog />);
  await screen.findByRole("button", { name: "Retry saved notebooks" });
  fireEvent.click(
    screen.getByRole("button", { name: "Retry saved notebooks" }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Retry saved notebooks" }),
    ).not.toBeInTheDocument(),
  );
  fireEvent.click(
    screen
      .getAllByRole("button")
      .find((e) =>
        e.getAttribute("data-testid")?.startsWith("notebook-curated-"),
      )!,
  );
  expect(screen.getByTestId("notebook-test")).toHaveTextContent("notebook-v1");
  view.unmount();
  query.value =
    "notebook=languages%2Fjapanese-hiragana-vowels-writing-notebook-v1";
  await act(async () => { render(<JapaneseNotebookCatalog />); });
  expect(screen.getByTestId("notebook-test")).toHaveTextContent("vowels");
});
it("opens an unsaved session if definition storage fails", async () => {
  storage.saveDefinition.mockRejectedValue(new Error("full"));
  render(<JapaneseNotebookCatalog />);
  fireEvent.change(screen.getByTestId("notebook-custom-text"), {
    target: { value: "ありがとう" },
  });
  fireEvent.click(screen.getByTestId("notebook-create"));
  await screen.findByTestId("notebook-test");
});
