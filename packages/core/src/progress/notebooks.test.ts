import { describe, expect, it, vi } from "vitest";
import { getContentIndex, createCustomNotebook } from "../index";
import { readNotebookProgress, syncNotebookProgress } from "./notebooks";

const notebook = createCustomNotebook("あ", getContentIndex());
const row = {
  notebookId: notebook.id,
  sheetId: notebook.sheets[0]!.id,
  prompt: "あ",
  bestCount: 24,
};
function client(signedIn = true) {
  const upsert = vi.fn(async () => ({ error: null }));
  const eq = vi.fn(async () => ({
    data: [
      {
        notebook_id: row.notebookId,
        sheet_id: row.sheetId,
        prompt: row.prompt,
        best_count: 24,
      },
    ],
    error: null,
  }));
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: signedIn ? { id: "learner" } : null },
      })),
    },
    from: vi.fn(() => ({ upsert, select: vi.fn(() => ({ eq })) })),
    upsert,
    eq,
  };
}
describe("optional notebook progress", () => {
  it("reads only the authenticated learner's milestones", async () => {
    const c = client();
    expect(await readNotebookProgress(c)).toMatchObject({
      isSignedIn: true,
      userId: "learner",
      items: [row],
    });
    expect(c.eq).toHaveBeenCalledWith("user_id", "learner");
    expect(await readNotebookProgress(client(false))).toEqual({
      isSignedIn: false,
      items: [],
    });
  });
  it("validates counts and supported prompts, takes identity from auth, and stores no ink", async () => {
    const c = client();
    expect(
      await syncNotebookProgress(c, [row], getContentIndex()),
    ).toMatchObject({ status: 200 });
    expect(c.upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ user_id: "learner", best_count: 24 })],
      { onConflict: "user_id,notebook_id,sheet_id" },
    );
    expect(JSON.stringify(c.upsert.mock.calls)).not.toContain("strokes");
    for (const invalid of [
      [{ ...row, bestCount: 25 }],
      [{ ...row, prompt: "🚀" }],
      [{ ...row, strokes: [] }],
      Array(21).fill(row),
      null,
    ])
      expect(
        await syncNotebookProgress(c, invalid, getContentIndex()),
      ).toMatchObject({ status: 400 });
    expect(
      await syncNotebookProgress(client(false), [row], getContentIndex()),
    ).toMatchObject({ status: 401 });
  });
  it("reports backend failures and skips corrupted remote rows", async () => {
    const c = client();
    c.upsert.mockResolvedValue({ error: { message: "offline" } } as never);
    expect(
      await syncNotebookProgress(c, [row], getContentIndex()),
    ).toMatchObject({ status: 500 });
    c.eq.mockResolvedValue({
      error: { message: "offline" },
      data: null,
    } as never);
    await expect(readNotebookProgress(c)).rejects.toThrow(/load/);
    c.eq.mockResolvedValue({ error: null, data: [{ prompt: "bad" }] } as never);
    expect((await readNotebookProgress(c)).items).toEqual([]);
  });
});
