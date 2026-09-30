import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { LinkedInAdminScreen } from "../../../../packages/ui/src/LinkedInAdminScreen";
import { analysisFixture, editorialFixture } from "../../../../packages/core/src/test/linkedin-fixture";
describe("native editorial review", () => {
  it("protects the collection and supports refine and approve", async () => {
    const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(editorialFixture), review: jest.fn().mockResolvedValue(null) };
    const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
    await waitFor(() => expect(view.getByText("Retries need a budget")).toBeOnTheScreen());
    await fireEvent.press(view.getByText("Retries need a budget"));
    await fireEvent.press(view.getByTestId("linkedin-refine"));
    await waitFor(() => expect(api.review).toHaveBeenCalledWith(expect.any(String), expect.any(String), "refine", undefined));
    await fireEvent.press(view.getByTestId("linkedin-approve"));
    await waitFor(() => expect(api.review).toHaveBeenCalledWith(expect.any(String), expect.any(String), "approve", undefined));
  });
  it("shows denied access without loading private content", async () => {
    const api = { isAdmin: jest.fn().mockResolvedValue(false), snapshot: jest.fn(), review: jest.fn() };
    const signIn = jest.fn(); const view = await render(<LinkedInAdminScreen client={api} onSignIn={signIn} />);
    await waitFor(() => expect(view.getByText("Admin access required")).toBeOnTheScreen());
    await fireEvent.press(view.getByText("Sign in")); expect(signIn).toHaveBeenCalled(); expect(api.snapshot).not.toHaveBeenCalled();
  });
});

it("edits text, confirms facts, adopts proposals and filters the collection", async () => {
  const data = structuredClone(editorialFixture);
  data.revisions[0].analysis = { ...analysisFixture, verificationNotes: ["Check the metric"], visualOutline: ["Slide 1: a retry budget"] };
  data.revisions.push({ ...data.revisions[0], id: "20000000-0000-4000-8000-000000000002", kind: "refine", parent_revision_id: data.revisions[0].id, body: analysisFixture.rewrittenPost });
  const api = { isAdmin: jest.fn().mockResolvedValue(true), snapshot: jest.fn().mockResolvedValue(data), review: jest.fn().mockResolvedValue(null) };
  const view = await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
  await waitFor(() => expect(view.getByText("Retries need a budget")).toBeOnTheScreen());
  await fireEvent.changeText(view.getByTestId("linkedin-search"),"missing"); expect(view.queryByText("Retries need a budget")).toBeNull();
  await fireEvent.changeText(view.getByTestId("linkedin-search"),"");
  await fireEvent.press(view.getByText("Reliability")); await fireEvent.press(view.getByText("review"));
  await fireEvent.press(view.getByText("scheduled")); expect(view.queryByText("Retries need a budget")).toBeNull();
  await fireEvent.press(view.getAllByText("all")[2]);
  await fireEvent.press(view.getByText("Retries need a budget"));
  expect(view.getAllByText("Analysis")[0]).toBeOnTheScreen();
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
  const api={isAdmin:jest.fn().mockResolvedValue(true),snapshot:jest.fn().mockResolvedValue(data),review:jest.fn().mockResolvedValue(null)};
  const view=await render(<LinkedInAdminScreen client={api} onSignIn={jest.fn()} />);
  await waitFor(()=>expect(view.getByText("Retries need a budget")).toBeOnTheScreen());
  await fireEvent.press(view.getByText("Retries need a budget")); expect(view.getByTestId("linkedin-body").props.editable).toBe(false);
  await fireEvent.press(view.getByTestId("linkedin-withdraw"));
  await waitFor(()=>expect(api.review).toHaveBeenCalledWith(expect.any(String),expect.any(String),"withdraw",undefined));
});
