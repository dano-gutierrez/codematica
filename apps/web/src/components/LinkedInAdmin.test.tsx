import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinkedInAdmin } from "./LinkedInAdmin";
import { editorialFixture, analysisFixture } from "../../../../packages/core/src/test/linkedin-fixture";

const client = () => ({ isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(editorialFixture), create: vi.fn().mockResolvedValue("10000000-0000-4000-8000-000000000001"), review: vi.fn().mockResolvedValue(null) });

describe("LinkedIn admin", () => {
  it("returns focus to search when filters removed the initiating draft", async () => {
    render(<LinkedInAdmin client={client()} />);
    fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
    fireEvent.change(screen.getByTestId("linkedin-search"), { target: { value: "No matching draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Back to collection" }));
    expect(screen.getByTestId("linkedin-search")).toHaveFocus();
  });
  it("moves focus into a selected draft and restores it to the collection without losing edits", async () => {
    const api = client(); render(<LinkedInAdmin client={api} />);
    const draft = await screen.findByRole("button", { name: /Retries need a budget/ });
    fireEvent.click(draft);
    expect(screen.getByRole("heading", { name: "Retries need a budget" })).toHaveFocus();
    fireEvent.change(screen.getByLabelText("Post text"), { target: { value: "Keep my draft" } });
    expect(screen.getByRole("status")).toHaveTextContent("Save or discard to switch drafts");
    fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to collection" }));
    expect(draft).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "New post" }));
    expect(screen.getByLabelText("Title")).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "New post" })).toHaveFocus();
  });
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
    expect(screen.getByRole("button", { name: "Refresh posts" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Post text"), { target: { value: editorialFixture.revisions[0].body } });
    expect(screen.getByRole("button", { name: "Refresh posts" })).toBeEnabled();
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
  fireEvent.click(await screen.findByRole("button", { name: "New post" }));
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
  render(<LinkedInAdmin client={api} />); fireEvent.click(await screen.findByRole("button", { name: "New post" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" })); expect(api.create).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "New post" })).toBeEnabled();
});


it("uses compact descriptive actions and keeps supporting details collapsed", async () => {
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(editorialFixture), create: vi.fn(), review: vi.fn() };
  render(<LinkedInAdmin client={api} />);
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  const actions = within(screen.getByRole("group", { name: "Post actions" }));
  expect(actions.getByRole("button", { name: "Refine post" })).toHaveAttribute("data-icon-only", "true");
  expect(actions.getByRole("button", { name: "Reject post" })).toHaveAttribute("data-tone", "danger");
  expect(actions.getByRole("button", { name: "Save revision" })).toHaveAttribute("data-tone", "info");
  expect(actions.getByRole("button", { name: "Approve & queue" })).toHaveTextContent("Approve & queue");
  expect(screen.getByTestId("linkedin-sources")).not.toHaveAttribute("open");
  expect(screen.getByTestId("linkedin-first-comment")).not.toHaveAttribute("open");
  expect(screen.getByTestId("linkedin-worker-details")).not.toHaveAttribute("open");
  expect(screen.getByTestId("linkedin-editor-save-state")).toHaveTextContent("Saved");
});

it("keeps dirty edits when selecting another post until they are discarded", async () => {
  const data = structuredClone(editorialFixture);
  data.posts.push({ ...data.posts[0], id: "10000000-0000-4000-8000-000000000002", title: "Timeouts are uncertain", current_revision_id: "20000000-0000-4000-8000-000000000002" });
  data.revisions.push({ ...data.revisions[0], id: data.posts[1].current_revision_id, post_id: data.posts[1].id });
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(data), create: vi.fn(), review: vi.fn() };
  render(<LinkedInAdmin client={api} />);
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  fireEvent.change(screen.getByTestId("linkedin-body"), { target: { value: "Unsaved personal draft" } });
  fireEvent.click(screen.getByRole("button", { name: /Timeouts are uncertain/ }));
  expect(screen.getByTestId("linkedin-body")).toHaveValue("Unsaved personal draft");
  expect(screen.getByRole("button", { name: /Timeouts are uncertain/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(screen.getByTestId("linkedin-body")).toHaveValue(editorialFixture.revisions[0].body);
  fireEvent.click(screen.getByRole("button", { name: /Timeouts are uncertain/ }));
  expect(screen.getByRole("heading", { name: "Timeouts are uncertain" })).toBeInTheDocument();
});

it("keeps failed requests visible and saves human verification with the revision", async () => {
  const data = structuredClone(editorialFixture);
  data.revisions[0].analysis = { ...analysisFixture, verificationNotes: ["Confirm the retry limit"] };
  data.jobs = [{ id: "40000000-0000-4000-8000-000000000001", post_id: data.posts[0].id, revision_id: data.revisions[0].id, kind: "refine", status: "failed", attempts: 3, error: "Source unavailable", result_revision_id: null, created_at: data.posts[0].created_at }];
  data.settings.worker_last_seen = "2026-10-02T12:00:00Z"; data.settings.worker_message = "Manual processing ready";
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(data), create: vi.fn(), review: vi.fn().mockResolvedValue(null) };
  render(<LinkedInAdmin client={api} />);
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  expect(screen.getByTestId(`linkedin-job-${data.jobs[0].id}`)).toHaveTextContent("refine: failed · Source unavailable");
  expect(screen.getAllByText("Confirm the retry limit")[0]).toBeVisible();
  expect(screen.getByRole("button", { name: "Approve & queue" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("button", { name: "Approve & queue" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Save revision" }));
  await waitFor(() => expect(api.review).toHaveBeenCalledWith(data.posts[0].id, data.revisions[0].id, "save", expect.objectContaining({ factsConfirmed: true })));
});

it("edits and copies the optional comment, and explicit discard restores it", async () => {
  const data = structuredClone(editorialFixture);
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(data), create: vi.fn(), review: vi.fn().mockResolvedValue(null) };
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  render(<LinkedInAdmin client={api} />);
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  fireEvent.click(screen.getByTestId("linkedin-comment-toggle"));
  fireEvent.change(screen.getByTestId("linkedin-comment"), { target: { value: "My reading note" } });
  fireEvent.click(screen.getByRole("button", { name: "Copy first comment" }));
  expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
  expect(writeText).toHaveBeenCalledWith("My reading note");
  expect(screen.getByRole("button", { name: "Refresh posts" })).toBeDisabled();
  fireEvent.change(screen.getByTestId("linkedin-comment"), { target: { value: "x".repeat(1249) } });
  expect(screen.getByRole("button", { name: "Save revision" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(screen.getByTestId("linkedin-comment")).toHaveValue(data.revisions[0].first_comment);
  writeText.mockRejectedValueOnce(new Error("Clipboard denied"));
  fireEvent.click(screen.getByRole("button", { name: "Copy first comment" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Copy first comment" })).toBeInTheDocument());
});

it("does not mark a changed or discarded comment as copied when an older request finishes", async () => {
  const api = client();
  let finish!: () => void;
  const writeText = vi.fn().mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  render(<LinkedInAdmin client={api} />);
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  fireEvent.click(screen.getByTestId("linkedin-comment-toggle"));
  fireEvent.change(screen.getByTestId("linkedin-comment"), { target: { value: "Old reading note" } });
  fireEvent.click(screen.getByRole("button", { name: "Copy first comment" }));
  fireEvent.change(screen.getByTestId("linkedin-comment"), { target: { value: "New reading note" } });
  await act(async () => finish());
  expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
  expect(writeText).toHaveBeenCalledExactlyOnceWith("Old reading note");
  fireEvent.click(screen.getByRole("button", { name: "Copy first comment" }));
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  await act(async () => finish());
  expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
  expect(screen.getByTestId("linkedin-comment")).toHaveValue(editorialFixture.revisions[0].first_comment);
});

it.each(["denied", "unavailable"])("reports a %s clipboard while preserving the comment", async failure => {
  const api = client();
  const writeText = vi.fn().mockRejectedValue(new Error("Clipboard denied"));
  Object.defineProperty(navigator, "clipboard", { value: failure === "denied" ? { writeText } : undefined, configurable: true });
  render(<LinkedInAdmin client={api} />);
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  fireEvent.click(screen.getByTestId("linkedin-comment-toggle"));
  fireEvent.click(screen.getByRole("button", { name: "Copy first comment" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't copy. Select the comment and copy it manually.");
  expect(screen.getByTestId("linkedin-comment")).toHaveValue(editorialFixture.revisions[0].first_comment);
  if (failure === "denied") expect(writeText).toHaveBeenCalledExactlyOnceWith(editorialFixture.revisions[0].first_comment);
});

it("retries copying and ignores an older failure after the new copy succeeds", async () => {
  let fail!: (error: Error) => void;
  const writeText = vi.fn().mockRejectedValueOnce(new Error("Denied"))
    .mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { fail = reject; }))
    .mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  render(<LinkedInAdmin client={client()} />);
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  fireEvent.click(screen.getByTestId("linkedin-comment-toggle"));
  fireEvent.click(screen.getByRole("button", { name: "Copy first comment" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't copy.");
  fireEvent.click(screen.getByRole("button", { name: "Copy first comment" }));
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Copy first comment" }));
  expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
  await act(async () => fail(new Error("Older failure")));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  expect(writeText).toHaveBeenCalledTimes(3);
  expect(writeText.mock.calls).toEqual(Array.from({ length: 3 }, () => [editorialFixture.revisions[0].first_comment]));
});

it("discards text, comment and fact confirmation together without a review write", async () => {
  const data = structuredClone(editorialFixture);
  data.revisions[0].analysis = { ...analysisFixture, verificationNotes: ["Check the metric"] };
  const api = { ...client(), snapshot: vi.fn().mockResolvedValue(data) };
  render(<LinkedInAdmin client={api} />);
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  fireEvent.click(screen.getByTestId("linkedin-comment-toggle"));
  fireEvent.change(screen.getByTestId("linkedin-body"), { target: { value: "Unsaved text" } });
  fireEvent.change(screen.getByTestId("linkedin-comment"), { target: { value: "Unsaved comment" } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(screen.getByTestId("linkedin-body")).toHaveValue(data.revisions[0].body);
  expect(screen.getByTestId("linkedin-comment")).toHaveValue(data.revisions[0].first_comment);
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(screen.getByRole("button", { name: "Refresh posts" })).toBeEnabled();
  expect(api.review).not.toHaveBeenCalled();
});

it("locks approved text and requests withdrawal while retaining publication status", async () => {
  const data = structuredClone(editorialFixture); data.posts[0].status = "approved";
  data.publications = [{ id: "30000000-0000-4000-8000-000000000001", post_id: data.posts[0].id, revision_id: data.revisions[0].id, buffer_id: "inert", status: "scheduled", scheduled_at: "2026-10-03T12:00:00Z", sent_at: null, error: null, url: "https://example.test/post" }];
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(data), create: vi.fn(), review: vi.fn().mockResolvedValue(null) };
  render(<LinkedInAdmin client={api} />);
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  expect(screen.getByTestId("linkedin-body")).toBeDisabled();
  expect(screen.getByRole("link", { name: "View post" })).toHaveAttribute("href", "https://example.test/post");
  fireEvent.click(screen.getByRole("button", { name: "Return to review" }));
  await waitFor(() => expect(api.review).toHaveBeenCalledWith(data.posts[0].id, data.revisions[0].id, "withdraw", undefined));
});

it("does not withdraw a published post or queue refinement twice", async () => {
  const data = structuredClone(editorialFixture); data.posts[0].status = "withdrawing";
  data.publications = [{ id: "30000000-0000-4000-8000-000000000001", post_id: data.posts[0].id, revision_id: data.revisions[0].id, buffer_id: "inert", status: "sent", scheduled_at: null, sent_at: "2026-10-03T12:00:00Z", error: "Already published", url: "javascript:alert(1)" }];
  data.jobs = [{ id: "40000000-0000-4000-8000-000000000001", post_id: data.posts[0].id, revision_id: data.revisions[0].id, kind: "refine", status: "pending", attempts: 0, error: null, result_revision_id: null, created_at: data.posts[0].created_at }];
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(data), create: vi.fn(), review: vi.fn() };
  render(<LinkedInAdmin client={api} />);
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  expect(screen.getByRole("button", { name: "Cancellation queued" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Refinement queued" })).toBeDisabled();
  expect(screen.queryByRole("link", { name: "View post" })).not.toBeInTheDocument();
});

it("loads a preparation on demand, preserves the original, and requires an override reason", async () => {
  const { preparationFixture } = await import("../../../../packages/core/src/test/linkedin-fixture");
  const data = structuredClone(editorialFixture); data.posts[0].preparation_required = true; data.preparations = [preparationFixture];
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn(), overview: vi.fn().mockResolvedValue({ ...data, revisions: [], preparations: [], version: "1" }), detail: vi.fn().mockResolvedValue(data), create: vi.fn(), review: vi.fn(), preparationAction: vi.fn().mockResolvedValue(null) };
  render(<LinkedInAdmin client={api} />);
  expect(api.detail).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button", { name: /Retries need a budget/ }));
  expect(await screen.findByText("Local preparation · held")).toBeInTheDocument();
  expect(screen.getByLabelText("Post text")).toHaveValue(data.revisions[0].body);
  expect(screen.getByRole("button", { name: "Approve & queue" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Send to Codex with flags" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Reason for sending"), { target: { value: "This is a distinct follow-up" } });
  fireEvent.click(screen.getByRole("button", { name: "Keep as a follow-up" }));
  await waitFor(() => expect(api.preparationAction).toHaveBeenCalledWith(data.posts[0].id, data.posts[0].current_revision_id, preparationFixture.id, "follow_up", "This is a distinct follow-up"));
  expect(api.review).not.toHaveBeenCalled();
});


it.each(["pending", "failed"])("returns to the collection while draft details are %s and can retry", async outcome => {
  let resolve!: (value: typeof editorialFixture) => void;
  let reject!: (error: Error) => void;
  const first = new Promise<typeof editorialFixture>((yes, no) => { resolve = yes; reject = no; });
  const api = { ...client(), overview: vi.fn().mockResolvedValue({ ...editorialFixture, revisions: [], version: "1" }), detail: vi.fn().mockReturnValueOnce(first).mockResolvedValue(editorialFixture) };
  render(<LinkedInAdmin client={api} />);
  const draft = await screen.findByRole("button", { name: /Retries need a budget/ });
  fireEvent.click(draft);
  if (outcome === "failed") {
    await act(async () => reject(new Error("Detail request failed")));
    expect(screen.getByRole("alert")).toHaveTextContent("Detail request failed");
  }
  fireEvent.click(screen.getByRole("button", { name: "Back to collection" }));
  expect(draft).toHaveFocus();
  if (outcome === "pending") await act(async () => resolve(editorialFixture));
  expect(screen.queryByLabelText("Post text")).not.toBeInTheDocument();
  fireEvent.click(draft);
  expect(await screen.findByLabelText("Post text")).toHaveValue(editorialFixture.revisions[0].body);
  expect(api.detail).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(api.review).not.toHaveBeenCalled();
});

it("keeps the active draft dirty when its collection button is selected again", async () => {
  const api = { ...client(), overview: vi.fn().mockResolvedValue({ ...editorialFixture, revisions: [], version: "1" }), detail: vi.fn().mockResolvedValue(editorialFixture) };
  render(<LinkedInAdmin client={api} />);
  const draft = await screen.findByRole("button", { name: /Retries need a budget/ });
  fireEvent.click(draft);
  fireEvent.change(await screen.findByLabelText("Post text"), { target: { value: "Keep my unsaved changes" } });
  fireEvent.click(draft);
  expect(screen.getByRole("button", { name: "Refresh posts" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Back to collection" })).toBeDisabled();
  expect(screen.getByLabelText("Post text")).toHaveValue("Keep my unsaved changes");
  expect(api.detail).toHaveBeenCalledTimes(1);
});
