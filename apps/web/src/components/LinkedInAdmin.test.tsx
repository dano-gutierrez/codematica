import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinkedInAdmin } from "./LinkedInAdmin";
import { editorialFixture, analysisFixture } from "../../../../packages/core/src/test/linkedin-fixture";

describe("LinkedIn admin", () => {
  const client = () => ({ isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(editorialFixture), review: vi.fn().mockResolvedValue(null) });
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
