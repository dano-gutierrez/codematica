import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { createCustomNotebook, getContentIndex } from "@codematica/core";
import { JapaneseNotebookCatalog } from "./JapaneseNotebookCatalog";
const { storage, replace, query } = vi.hoisted(() => ({
  storage: {
    list: vi.fn(),
    saveDefinition: vi.fn(),
    load: vi.fn(),
    save: vi.fn(),
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
  render(<JapaneseNotebookCatalog />);
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
