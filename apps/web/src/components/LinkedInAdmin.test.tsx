import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinkedInAdmin } from "./LinkedInAdmin";
import { editorialFixture, analysisFixture } from "../../../../packages/core/src/test/linkedin-fixture";

describe("LinkedIn admin", () => {
  const client = () => ({ isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(editorialFixture), create: vi.fn().mockResolvedValue("10000000-0000-4000-8000-000000000001"), review: vi.fn().mockResolvedValue(null) });
  it("denies non-admins and handles absent configuration", async () => {
    const { unmount } = render(<LinkedInAdmin client={null} />);
    expect(screen.getByText(/not configured/i)).toBeInTheDocument(); unmount();
    const api = client(); api.isAdmin.mockResolvedValue(false); render(<LinkedInAdmin client={api} />);
    expect(await screen.findByText("Admin access required")).toBeInTheDocument();
    expect(api.snapshot).not.toHaveBeenCalled();
  });
  it("loads a draft, prevents approval of unsaved text, saves and queues refinement", async () => {
    const api = client(); render(<LinkedInAdmin client={api} />);
    fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
    fireEvent.change(screen.getByLabelText("Post text"), { target: { value: "Edited lesson" } });
    expect(screen.getByRole("button", { name: "Approve & queue" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Post text"), { target: { value: editorialFixture.revisions[0].body } });
    expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Post text"), { target: { value: "Edited lesson" } });
    fireEvent.click(screen.getByRole("button", { name: "Save revision" }));
    await waitFor(() => expect(api.review).toHaveBeenCalledWith(editorialFixture.posts[0].id, editorialFixture.posts[0].current_revision_id, "save", expect.objectContaining({ body: "Edited lesson" })));
    fireEvent.click(screen.getByRole("button", { name: "Back to collection" }));
    expect(screen.queryByLabelText("Post text")).not.toBeInTheDocument();
  });
  it("shows a proposal and only adopts it on request", async () => {
    const api = client(); api.snapshot.mockResolvedValue({ ...editorialFixture, revisions: [...editorialFixture.revisions, { ...editorialFixture.revisions[0], id: "20000000-0000-4000-8000-000000000002", parent_revision_id: editorialFixture.revisions[0].id, kind: "refine", analysis: analysisFixture, body: analysisFixture.rewrittenPost }] });
    render(<LinkedInAdmin client={api} />);
    fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
    expect(screen.getAllByText(analysisFixture.rewrittenPost)[0]).toBeInTheDocument();
    expect(api.review).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Use revision" }));
    await waitFor(() => expect(api.review).toHaveBeenCalledWith(expect.any(String), expect.any(String), "use", { proposalId: "20000000-0000-4000-8000-000000000002" }));
  });
});

it("creates a manual draft, keeps input after failure and requires analysis before approval", async () => {
  const data = structuredClone(editorialFixture); data.posts[0].origin = "manual"; data.revisions[0].sources = [];
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(data), review: vi.fn(), create: vi.fn().mockRejectedValueOnce(new Error("Offline")).mockResolvedValue(data.posts[0].id) };
  render(<LinkedInAdmin client={api} />);
  fireEvent.click(await screen.findByRole("button", { name: "Create" }));
  expect(screen.getByRole("button", { name: "Add for analysis" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "My lesson" } });
  fireEvent.change(screen.getByLabelText("Topic"), { target: { value: "Systems" } });
  fireEvent.change(screen.getByTestId("linkedin-create-body"), { target: { value: "Manual lesson" } });
  fireEvent.click(screen.getByRole("button", { name: "Add for analysis" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
  expect(screen.getByTestId("linkedin-create-body")).toHaveValue("Manual lesson");
  fireEvent.click(screen.getByRole("button", { name: "Add for analysis" }));
  await waitFor(() => expect(screen.queryByTestId("linkedin-create-form")).not.toBeInTheDocument());
  expect(api.create).toHaveBeenCalledWith(expect.any(String), { title: "My lesson", topic: "Systems", body: "Manual lesson" });
  expect(screen.getByRole("button", { name: "Approve & queue" })).toBeDisabled(); expect(api.review).not.toHaveBeenCalled();
});
it("cancels creation without persisting a draft", async () => {
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(editorialFixture), review: vi.fn(), create: vi.fn() };
  render(<LinkedInAdmin client={api} />); fireEvent.click(await screen.findByRole("button", { name: "Create" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" })); expect(api.create).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
});
