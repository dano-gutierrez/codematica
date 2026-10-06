import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { LinkedInAdminScreen } from "../../../../packages/ui/src/LinkedInAdminScreen";
import { analysisFixture, editorialFixture } from "../../../../packages/core/src/test/linkedin-fixture";
import { Keyboard, StyleSheet } from "react-native";
describe("native editorial review", () => {
  it("announces topic and review status to distinguish posts with the same title", async () => {
    const data = structuredClone(editorialFixture);
    const secondPostId = "10000000-0000-4000-8000-000000000002";
    const secondRevisionId = "20000000-0000-4000-8000-000000000002";
    data.posts.push({ ...data.posts[0], id: secondPostId, topic: "Observability", status: "rejected", current_revision_id: secondRevisionId });
    data.revisions.push({ ...data.revisions[0], id: secondRevisionId, post_id: secondPostId, body: "A separately reviewed draft." });
    const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(data), create: jest.fn(), review: jest.fn() };
    const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
    await waitFor(() => expect(view.getByTestId(`linkedin-post-${secondPostId}`)).toBeOnTheScreen());
    expect(view.getByRole("button", { name: "Retries need a budget, Reliability, review" })).toBeOnTheScreen();
    const rejected = view.getByRole("button", { name: "Retries need a budget, Observability, rejected" });
    await fireEvent.press(rejected);
    expect(view.getByTestId("linkedin-body").props.value).toBe("A separately reviewed draft.");
    expect(api.review).not.toHaveBeenCalled();
  });
  it("preserves unsaved comments and fact confirmation until explicit discard", async () => {
    const data = structuredClone(editorialFixture);
    data.revisions[0].analysis = { ...analysisFixture, verificationNotes: ["Verify the metric"] };
    const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(data), create: jest.fn(), review: jest.fn() };
    const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
    await waitFor(() => expect(view.getByText("Retries need a budget")).toBeOnTheScreen());
    await fireEvent.press(view.getByText("Retries need a budget"));
    expect(view.getByText("Verify the metric")).toBeOnTheScreen();
    await fireEvent.changeText(view.getByTestId("linkedin-comment"), "Unsaved comment");
    expect(view.getByTestId("linkedin-back")).toBeDisabled();
    await fireEvent.press(view.getByText("Confirm flagged facts are verified"));
    await fireEvent.press(view.getByTestId("linkedin-discard"));
    expect(view.getByTestId("linkedin-comment").props.value).toBe(data.revisions[0].first_comment);
    expect(view.getByText("Confirm flagged facts are verified")).toBeOnTheScreen();
    expect(view.getByTestId("linkedin-back")).toBeEnabled();
    expect(api.review).not.toHaveBeenCalled();
  });
  it("uses touch targets, keyboard-safe editing and explicit discard before leaving a draft", async () => {
    const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(editorialFixture), create: jest.fn(), review: jest.fn() };
    const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
    await waitFor(() => expect(view.getByTestId("linkedin-create")).toBeOnTheScreen());
    expect(StyleSheet.flatten(view.getByTestId("linkedin-create").props.style).minHeight).toBeGreaterThanOrEqual(48);
    expect(StyleSheet.flatten(view.getByTestId("linkedin-create").props.style).minWidth).toBeGreaterThanOrEqual(48);
    expect(view.getByTestId("keyboard-aware-screen")).toBeOnTheScreen();
    expect(view.getByTestId("keyboard-aware-scroll").props.keyboardShouldPersistTaps).toBe("handled");
    await fireEvent.press(view.getByText("Retries need a budget"));
    await fireEvent.changeText(view.getByTestId("linkedin-body"), "Keep my work");
    expect(view.getByTestId("linkedin-back")).toBeDisabled();
    await fireEvent.press(view.getByTestId("linkedin-back"));
    expect(view.getByTestId("linkedin-body").props.value).toBe("Keep my work");
    await fireEvent.press(view.getByTestId("linkedin-discard"));
    expect(view.getByTestId("linkedin-body").props.value).toBe(editorialFixture.revisions[0].body);
    expect(view.getByTestId("linkedin-back")).toBeEnabled();
    await fireEvent.press(view.getByTestId("linkedin-back"));
    expect(view.getByTestId("linkedin-search")).toBeOnTheScreen();
  });
  it("protects the collection and supports refine and approve", async () => {
    const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(editorialFixture), create: jest.fn().mockResolvedValue("10000000-0000-4000-8000-000000000001"), review: jest.fn().mockResolvedValue(null) };
    const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
    await waitFor(() => expect(view.getByText("Retries need a budget")).toBeOnTheScreen());
    await fireEvent.press(view.getByText("Retries need a budget"));
    await fireEvent.press(view.getByTestId("linkedin-refine"));
    await waitFor(() => expect(api.review).toHaveBeenCalledWith(expect.any(String), expect.any(String), "refine", undefined));
    await fireEvent.press(view.getByTestId("linkedin-approve"));
    await waitFor(() => expect(api.review).toHaveBeenCalledWith(expect.any(String), expect.any(String), "approve", undefined));
  });
  it("shows denied access without loading private content", async () => {
    const api = { isAdmin: jest.fn().mockResolvedValue(false), snapshot: jest.fn(), create: jest.fn().mockResolvedValue("10000000-0000-4000-8000-000000000001"), review: jest.fn() };
    const signIn = jest.fn(); const view = await render(<LinkedInAdminScreen client={api} onSignIn={signIn} />);
    await waitFor(() => expect(view.getByText("Admin access required")).toBeOnTheScreen());
    await fireEvent.press(view.getByText("Sign in")); expect(signIn).toHaveBeenCalled(); expect(api.snapshot).not.toHaveBeenCalled();
  });
});

it("edits text, confirms facts, adopts proposals and filters the collection", async () => {
  const data = structuredClone(editorialFixture);
  data.revisions[0].analysis = { ...analysisFixture, verificationNotes: ["Check the metric"], visualOutline: ["Slide 1: a retry budget"] };
  data.revisions.push({ ...data.revisions[0], id: "20000000-0000-4000-8000-000000000002", kind: "refine", parent_revision_id: data.revisions[0].id, body: analysisFixture.rewrittenPost });
  const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(data), create: jest.fn().mockResolvedValue("10000000-0000-4000-8000-000000000001"), review: jest.fn().mockResolvedValue(null) };
  const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
  await waitFor(() => expect(view.getByText("Retries need a budget")).toBeOnTheScreen());
  await fireEvent.changeText(view.getByTestId("linkedin-search"),"missing"); expect(view.queryByText("Retries need a budget")).toBeNull();
  await fireEvent.changeText(view.getByTestId("linkedin-search"),"");
  await fireEvent.press(view.getByRole("button", { name: "Filters" }));
  await fireEvent.press(view.getByRole("button", { name: "Reliability" })); await fireEvent.press(view.getByRole("button", { name: "Review" }));
  await fireEvent.press(view.getByRole("button", { name: "Scheduled" })); expect(view.queryByText("Retries need a budget")).toBeNull();
  await fireEvent.press(view.getByRole("button", { name: "All publications" }));
  await fireEvent.press(view.getByText("Retries need a budget"));
  expect(view.getAllByRole("button", { name: "Analysis" })[0]).toBeOnTheScreen();
  await fireEvent.press(view.getByTestId("linkedin-use-20000000-0000-4000-8000-000000000002"));
  await waitFor(() => expect(api.review).toHaveBeenCalledWith(expect.any(String),expect.any(String),"use",expect.any(Object)));
  await fireEvent.changeText(view.getByTestId("linkedin-body"),"Edited draft");
  await fireEvent.changeText(view.getByTestId("linkedin-comment"),"Updated reference");
  await fireEvent.press(view.getAllByText("Confirm flagged facts are verified")[0]);
  await fireEvent.press(view.getByTestId("linkedin-save"));
  await waitFor(() => expect(api.review).toHaveBeenCalledWith(expect.any(String),expect.any(String),"save",{ body: "Edited draft", firstComment: "Updated reference", factsConfirmed: true }));
  await fireEvent.press(view.getByTestId("linkedin-back"));
  await fireEvent.press(view.getByTestId("linkedin-refresh"));
  await fireEvent.press(view.getByText("Retries need a budget"));
  await fireEvent.press(view.getByTestId("linkedin-reject"));
  await waitFor(() => expect(api.review).toHaveBeenCalledWith(expect.any(String),expect.any(String),"reject",undefined));
});

it("locks approved versions and requests cancellation", async () => {
  const data = structuredClone(editorialFixture);
  data.posts[0].status="approved"; data.posts[0].approved_revision_id=data.revisions[0].id;
  data.settings.worker_last_seen="2026-09-29T00:00:00Z"; data.settings.publishing_enabled=true;
  data.publications=[{id:"30000000-0000-4000-8000-000000000001",post_id:data.posts[0].id,revision_id:data.revisions[0].id,buffer_id:"external",status:"scheduled",scheduled_at:"2026-10-01T00:00:00Z",sent_at:null,url:null,error:null}];
  data.jobs=[{id:"40000000-0000-4000-8000-000000000001",post_id:data.posts[0].id,revision_id:data.revisions[0].id,kind:"schedule",status:"succeeded",attempts:1,error:null,created_at:"2026-09-29T00:00:00Z",result_revision_id:null}];
  const api={isAdmin:jest.fn().mockResolvedValue(true),snapshot:jest.fn().mockResolvedValue(data),create: jest.fn().mockResolvedValue("10000000-0000-4000-8000-000000000001"), review:jest.fn().mockResolvedValue(null)};
  const view=await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
  await waitFor(()=>expect(view.getByText("Retries need a budget")).toBeOnTheScreen());
  await fireEvent.press(view.getByText("Retries need a budget")); expect(view.getByTestId("linkedin-body").props.editable).toBe(false);
  await fireEvent.press(view.getByTestId("linkedin-withdraw"));
  await waitFor(()=>expect(api.review).toHaveBeenCalledWith(expect.any(String),expect.any(String),"withdraw",undefined));
});

it("creates and formats a manual post, preserves failed input and gates approval", async () => {
  const data = structuredClone(editorialFixture); data.posts[0].origin = "manual"; data.revisions[0].sources = [];
  const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(data), review: jest.fn(), create: jest.fn().mockRejectedValueOnce(new Error("Offline")).mockResolvedValue(data.posts[0].id) };
  const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
  await waitFor(() => expect(view.getByTestId("linkedin-create")).toBeOnTheScreen());
  await fireEvent.press(view.getByTestId("linkedin-create"));
  expect(view.getByTestId("linkedin-create-submit")).toBeDisabled();
  await fireEvent.changeText(view.getByTestId("linkedin-create-title"), "My lesson");
  await fireEvent.changeText(view.getByTestId("linkedin-create-topic"), "Systems");
  await fireEvent.changeText(view.getByTestId("linkedin-create-body"), "Hello");
  await fireEvent(view.getByTestId("linkedin-create-body"), "selectionChange", { nativeEvent: { selection: { start: 0, end: 5 } } });
  await fireEvent.press(view.getByText("Bold")); expect(view.getByTestId("linkedin-create-body").props.value).toBe("𝗛𝗲𝗹𝗹𝗼");
  await fireEvent.press(view.getByText("Italic")); expect(view.getByTestId("linkedin-create-body").props.value).toBe("𝘏𝘦𝘭𝘭𝘰");
  await fireEvent.press(view.getByText("Plain text"));
  await fireEvent.press(view.getByText("Bullets")); expect(view.getByTestId("linkedin-create-body").props.value).toBe("• Hello");
  await fireEvent.press(view.getByTestId("linkedin-create-submit"));
  await waitFor(() => expect(view.getByText("Offline")).toBeOnTheScreen());
  expect(view.getByTestId("linkedin-create-body").props.value).toBe("• Hello");
  await fireEvent.press(view.getByTestId("linkedin-create-submit"));
  await waitFor(() => expect(view.queryByTestId("linkedin-create-form")).toBeNull());
  expect(api.create).toHaveBeenCalledWith(expect.any(String), { title: "My lesson", topic: "Systems", body: "• Hello" });
  expect(view.getByTestId("linkedin-approve")).toBeDisabled(); expect(api.review).not.toHaveBeenCalled();
  await fireEvent.press(view.getByTestId("linkedin-back"));
  await fireEvent.press(view.getByTestId("linkedin-create")); await fireEvent.press(view.getByText("Cancel"));
  expect(view.queryByTestId("linkedin-create-form")).toBeNull();
});

it("offers named queue details, clear filters and source/history disclosures", async () => {
  const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(editorialFixture), create: jest.fn(), review: jest.fn() };
  const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
  await waitFor(() => expect(view.getByTestId("linkedin-search")).toBeOnTheScreen());
  expect(view.getByRole("button", { name: "Queue details" }).props.accessibilityState.expanded).toBe(false);
  await fireEvent.press(view.getByRole("button", { name: "Queue details" }));
  expect(view.getByText(/Ask Codex to process queued requests/)).toBeOnTheScreen();
  await fireEvent.changeText(view.getByLabelText("Search posts"), "qzqznotfound");
  expect(view.getByText("No matching posts.")).toBeOnTheScreen();
  await fireEvent.press(view.getByRole("button", { name: "Reset filters" }));
  expect(view.getByLabelText("Search posts").props.value).toBe("");
  await fireEvent.press(view.getByRole("button", { name: "Retries need a budget, Reliability, review" }));
  const sources = view.getByRole("button", { name: "Source material" });
  expect(sources.props.accessibilityState.expanded).toBe(false);
  await fireEvent.press(sources);
  expect(view.getByRole("button", { name: "Revision history" }).props.accessibilityState.expanded).toBe(false);
  expect(StyleSheet.flatten(view.getByTestId("linkedin-reject").props.style).backgroundColor).toBe("#fff0f2");
  expect(api.review).not.toHaveBeenCalled();
});

it("keeps optional queue filters collapsed and preserves their selection until reset", async () => {
  const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(editorialFixture), create: jest.fn(), review: jest.fn() };
  const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
  await waitFor(() => expect(view.getByRole("button", { name: "Retries need a budget, Reliability, review" })).toBeOnTheScreen());
  expect(view.queryByRole("button", { name: /^Rejected$/ })).toBeNull();
  await fireEvent.press(view.getByRole("button", { name: /^Filters$/ }));
  await fireEvent.press(view.getByRole("button", { name: /^Rejected$/ }));
  expect(view.getByText("No matching posts.")).toBeOnTheScreen();
  await fireEvent.press(view.getByRole("button", { name: /^Filters \(1\)$/ }));
  expect(view.queryByRole("button", { name: /^Rejected$/ })).toBeNull();
  expect(view.getByText("No matching posts.")).toBeOnTheScreen();
  await fireEvent.press(view.getByRole("button", { name: "Reset filters" }));
  expect(view.getByRole("button", { name: /^Filters$/ })).toBeOnTheScreen();
  expect(view.getByRole("button", { name: "Retries need a budget, Reliability, review" })).toBeOnTheScreen();
  expect(api.review).not.toHaveBeenCalled();
});

it("returns new queue views to their start without dismissing the keyboard while editing", async () => {
  const dismiss = jest.spyOn(Keyboard, "dismiss");
  try {
    const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(editorialFixture), create: jest.fn().mockResolvedValue(editorialFixture.posts[0].id), review: jest.fn() };
    const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
    await waitFor(() => expect(view.getByTestId("linkedin-create")).toBeEnabled());
    dismiss.mockClear();
    await fireEvent.press(view.getByTestId("linkedin-create"));
    expect(dismiss).toHaveBeenCalledTimes(1);
    await fireEvent.changeText(view.getByTestId("linkedin-create-title"), "Manual lesson");
    await fireEvent.changeText(view.getByTestId("linkedin-create-topic"), "Reliability");
    await fireEvent.changeText(view.getByTestId("linkedin-create-body"), "Bound retries before adding load.");
    expect(dismiss).toHaveBeenCalledTimes(1);
    await fireEvent.press(view.getByTestId("linkedin-create-submit"));
    await waitFor(() => expect(view.getByTestId("linkedin-body")).toBeOnTheScreen());
    expect(dismiss).toHaveBeenCalledTimes(2);
    await fireEvent.press(view.getByTestId("linkedin-back"));
    expect(dismiss).toHaveBeenCalledTimes(3);
    await fireEvent.press(view.getByRole("button", { name: "Retries need a budget, Reliability, review" }));
    expect(dismiss).toHaveBeenCalledTimes(4);
    await fireEvent.changeText(view.getByTestId("linkedin-body"), "Keep this edit");
    expect(dismiss).toHaveBeenCalledTimes(4);
    expect(view.getByTestId("linkedin-body").props.value).toBe("Keep this edit");
    expect(view.getByTestId("linkedin-back")).toBeDisabled();
  } finally {
    dismiss.mockRestore();
  }
});
