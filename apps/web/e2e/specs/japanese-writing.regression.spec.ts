import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type CDPSession } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { ContentIndex } from "../../../../packages/core/src/content/schema";
const index = JSON.parse(
  readFileSync(
    new URL(
      "../../../../packages/core/src/generated/content-index.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as ContentIndex;
const roughA = [
  [
    [25, 37],
    [38, 38],
    [56, 33],
    [68, 31],
  ],
  [
    [52, 18],
    [48, 43],
    [49, 68],
    [54, 84],
  ],
  [
    [63, 39],
    [63, 51],
    [54, 65],
    [40, 80],
    [27, 82],
    [21, 75],
    [22, 65],
    [34, 53],
    [48, 49],
    [61, 49],
    [77, 55],
    [84, 65],
    [80, 78],
    [64, 87],
  ],
];
async function ink(
  page: Page,
  session: CDPSession,
  strokes: number[][][],
  pen = true,
) {
  const viewport = page.getByTestId("writing-notebook-viewport");
  await viewport.scrollIntoViewIfNeeded();
  const box = (await viewport.boundingBox())!;
  for (const points of strokes) {
    const first = points[0]!;
    if (pen)
      await session.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: box.x + 40 + first[0]!,
        y: box.y + 140 + first[1]!,
        button: "left",
        buttons: 1,
        clickCount: 1,
        pointerType: "pen",
        force: 0.6,
      });
    else
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [
          { x: box.x + 40 + first[0]!, y: box.y + 140 + first[1]! },
        ],
      });
    for (const [x, y] of points.slice(1)) {
      if (pen)
        await session.send("Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x: box.x + 40 + x!,
          y: box.y + 140 + y!,
          button: "left",
          buttons: 1,
          pointerType: "pen",
          force: 0.8,
        });
      else
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: box.x + 40 + x!, y: box.y + 140 + y! }],
        });
    }
    const last = points.at(-1)!;
    if (pen)
      await session.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: box.x + 40 + last[0]!,
        y: box.y + 140 + last[1]!,
        button: "left",
        buttons: 0,
        clickCount: 1,
        pointerType: "pen",
      });
    else
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
  }
}
async function submit(page: Page) {
  await expect(page.getByTestId("writing-ink-0")).toHaveCount(0);
}
test("@regression mouse handwriting uses saved difficulty and automatic checking without a submit button", async ({
  page,
}) => {
  await page.goto("/languages/japanese/notebooks");
  await page.getByTestId("notebook-custom-text").fill("あ");
  await page.getByTestId("notebook-create").click();
  await expect(page.getByTestId("writing-repeat")).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Check character" }),
  ).toHaveCount(0);
  await expect(page.getByTestId("writing-difficulty")).toContainText("Easy");
  await page.getByTestId("writing-difficulty").click();
  await page.getByRole("option", { name: "Precise", exact: true }).click();
  await page.clock.install({ time: new Date("2026-10-02T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-02T12:00:01Z"));
  const viewport = page.getByTestId("writing-notebook-viewport");
  await viewport.scrollIntoViewIfNeeded();
  const box = (await viewport.boundingBox())!;
  for (const points of roughA) {
    const first = points[0]!;
    await page.mouse.move(
      box.x + 40 + first[0]! * 1.55,
      box.y + 140 + first[1]! * 0.82,
    );
    await page.mouse.down();
    for (const [x, y] of points.slice(1))
      await page.mouse.move(box.x + 40 + x! * 1.55, box.y + 140 + y! * 0.82);
    await page.mouse.up();
  }
  await page.clock.runFor(400);
  await expect(page.getByTestId("writing-cell-0-feedback")).toHaveAttribute("data-error", "false");
  await page.clock.runFor(800);
  await expect(page.getByTestId("writing-cell-0-feedback")).toHaveAttribute(
    "data-error",
    "true",
  );
  await expect(page.getByTestId("writing-sheet-progress")).toContainText(
    "0 / 24",
  );
  await page.getByTestId("writing-difficulty").click();
  await page.getByRole("option", { name: "Easy", exact: true }).click();
  await page.clock.runFor(400);
  await expect(page.getByTestId("writing-cell-0-ink-2")).toBeVisible();
  await expect(page.getByTestId("writing-sheet-progress")).toContainText(
    "1 / 24",
  );
  await expect.poll(() => savedCount(page)).toBe(1);
  await page.getByTestId("writing-difficulty").click();
  await page.getByRole("option", { name: "Balanced", exact: true }).click();
  await page.clock.resume();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve) => {
          const r = indexedDB.open("codematica-writing-notebooks", 1);
          r.onsuccess = () => resolve(r.result);
        });
        const rows = await new Promise<
          Array<{ snapshot?: { difficulty?: string } }>
        >((resolve) => {
          const r = db.transaction("records").objectStore("records").getAll();
          r.onsuccess = () => resolve(r.result);
        });
        db.close();
        return rows.find((r) => r.snapshot)?.snapshot?.difficulty;
      }),
    )
    .toBe("balanced");
  await page.reload();
  await expect(page.getByTestId("writing-difficulty")).toContainText(
    "Balanced",
  );
  await expect(page.getByTestId("writing-cell-0-ink-2")).toBeVisible();
});
async function savedCount(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("codematica-writing-notebooks", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const rows = await new Promise<
      Array<{
        kind: string;
        snapshot?: { pages: Record<string, { cells: unknown[] }> };
      }>
    >((resolve) => {
      const request = db.transaction("records").objectStore("records").getAll();
      request.onsuccess = () => resolve(request.result);
    });
    db.close();
    return rows
      .filter((r) => r.kind === "snapshot")
      .flatMap((r) => Object.values(r.snapshot!.pages))
      .reduce((sum, p) => sum + p.cells.length, 0);
  });
}
test("@regression labeled notebook controls and a longer pause allow slower mouse handwriting", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/languages/japanese/notebooks");
  await page.getByTestId("notebook-custom-text").fill("あ");
  await page.getByTestId("notebook-create").click();
  const restart = page.getByTestId("writing-repeat");
  const next = page.getByTestId("writing-next-sheet");
  await expect(restart).toBeEnabled();
  await expect(restart).toHaveAccessibleName("Clear and restart sheet");
  await expect(restart).toContainText("Clear and restart sheet");
  for (const width of [820, 320]) {
    await page.setViewportSize({ width, height: 1180 });
    const nextBox = (await next.boundingBox())!, restartBox = (await restart.boundingBox())!;
    for (const control of [nextBox, restartBox]) {
      expect(control.width).toBeGreaterThanOrEqual(48);
      expect(control.height).toBeGreaterThanOrEqual(48);
      expect(control.x).toBeGreaterThanOrEqual(0);
      expect(control.x + control.width).toBeLessThanOrEqual(width);
    }
    const rowDistance = Math.abs(nextBox.y + nextBox.height / 2 - restartBox.y - restartBox.height / 2);
    if (rowDistance <= 1) expect(restartBox.x - nextBox.x - nextBox.width).toBeGreaterThanOrEqual(8);
    else expect(restartBox.y - nextBox.y - nextBox.height).toBeGreaterThanOrEqual(8);
  }
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.clock.install({ time: new Date("2026-10-02T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-02T12:00:01Z"));
  const viewport = page.getByTestId("writing-notebook-viewport");
  await viewport.scrollIntoViewIfNeeded();
  const box = (await viewport.boundingBox())!;
  for (const [i, points] of roughA.entries()) {
    const first = points[0]!;
    await page.mouse.move(box.x + 40 + first[0]!, box.y + 140 + first[1]!);
    await page.mouse.down();
    for (const [x, y] of points.slice(1))
      await page.mouse.move(box.x + 40 + x!, box.y + 140 + y!);
    await page.mouse.up();
    await page.clock.runFor(i === 2 ? 400 : 900);
    if (i < 2) {
      await expect(page.getByTestId("writing-cell-0-feedback")).toHaveAttribute("data-error", "false");
      await expect(page.getByTestId("writing-feedback")).not.toContainText("Not quite");
    }
  }
  await expect(page.getByTestId("writing-cell-0-ink-2")).toHaveCount(1);
  await page.clock.runFor(3000);
  await expect(page.getByTestId("writing-sheet-progress")).toContainText("1 / 24");
  await expect(page.getByTestId("writing-feedback")).toContainText("Correct");
  await page.getByTestId("writing-practice").screenshot({ path: testInfo.outputPath("compact-notebook-controls.png") });
  await restart.click();
  await expect(page.getByTestId("writing-sheet-progress")).toContainText("0 / 24");
  await expect(page.getByTestId("writing-cell-0-ink-0")).toHaveCount(0);
});
test("@regression rejected characters bounce and fade while saved ink and the notebook margin stay clear", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 507, height: 900 });
  await page.goto("/languages/japanese/notebooks");
  await page.getByTestId("notebook-custom-text").fill("一");
  await page.getByTestId("notebook-create").click();
  await expect(page.getByTestId("writing-repeat")).toBeEnabled();
  await page.clock.install({ time: new Date("2026-10-02T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-02T12:00:01Z"));
  const session = await page.context().newCDPSession(page);
  await ink(page, session, [
    [
      [18, 50],
      [82, 50],
    ],
  ]);
  await page.clock.runFor(400);
  await submit(page);
  await expect(page.getByTestId("writing-cell-0-ink-0")).toHaveCount(1);
  await expect(page.getByTestId("writing-cell-0")).toBeVisible();
  const viewport = page.getByTestId("writing-notebook-viewport");
  const top = await viewport.evaluate(
    (e) => e.getBoundingClientRect().top + window.scrollY,
  );
  const margin = (await page.getByTestId("writing-margin-line").boundingBox())!;
  const cell = (await page.getByTestId("writing-cell-0").boundingBox())!;
  expect(cell.x - margin.x).toBeGreaterThanOrEqual(16);
  await ink(page, session, [
    [
      [20, 20],
      [80, 80],
    ],
  ]);
  await page.clock.runFor(400);
  await expect(page.getByTestId("writing-cell-1-feedback")).toHaveAttribute("data-error", "false");
  await page.clock.runFor(800);
  await expect(page.getByTestId("writing-cell-1-feedback")).toHaveAttribute(
    "data-error",
    "true",
  );
  await expect(page.getByTestId("writing-cell-1-feedback")).toHaveCSS(
    "animation-name",
    "notebook-error-bounce",
  );
  await page
    .getByTestId("writing-practice")
    .screenshot({ path: testInfo.outputPath("rejected-ink-bounce.png") });
  await page.clock.runFor(1200);
  await expect(page.getByTestId("writing-pending-ink")).toHaveAttribute(
    "data-phase",
    "fading",
  );
  await page.clock.runFor(250);
  await expect(page.getByTestId("writing-ink-0")).toHaveCount(0);
  await expect(page.getByTestId("writing-cell-0-ink-0")).toHaveCount(1);
  await expect(page.getByTestId("writing-sheet-progress")).toContainText(
    "1 / 24",
  );
  expect(
    await viewport.evaluate(
      (e) => e.getBoundingClientRect().top + window.scrollY,
    ),
  ).toBe(top);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ink(page, session, [
    [
      [20, 20],
      [80, 80],
    ],
  ]);
  await page.clock.runFor(1200);
  await expect(page.getByTestId("writing-cell-1-feedback")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.getByTestId("writing-clear").click();
  await ink(page, session, [
    [
      [18, 50],
      [82, 50],
    ],
  ]);
  await page.clock.runFor(400);
  await submit(page);
  await expect(page.getByTestId("writing-cell-1-ink-0")).toHaveCount(1);
  await session.detach();
});
test("@regression rough finger あ is accepted anywhere, retains ink, survives reload and does not shift the page", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1024, height: 1366 });
  await page.goto(
    "/practice/languages/japanese-hiragana-vowels-writing?path=japanese-foundations",
  );
  await expect(page.getByTestId("writing-repeat")).toBeEnabled();
  const session = await page.context().newCDPSession(page);
  await ink(page, session, [roughA[2]!, roughA[0]!, roughA[1]!], false);
  const pending = await page.getByTestId("writing-ink-0").getAttribute("d");
  expect(pending).toContain(" C ");
  const before = await page
    .getByTestId("writing-notebook-viewport")
    .evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
  await submit(page);
  await expect(page.getByTestId("writing-cell-0-ink-2")).toBeVisible();
  expect(
    await page
      .getByTestId("writing-notebook-viewport")
      .evaluate((e) => e.getBoundingClientRect().top + window.scrollY),
  ).toBe(before);
  await expect(page.getByTestId("writing-sheet-progress")).toContainText(
    "0 / 24",
  );
  await expect.poll(() => savedCount(page)).toBe(1);
  await page.reload();
  await expect(page.getByTestId("writing-cell-0-ink-2")).toBeVisible();
  await page
    .getByTestId("writing-practice")
    .screenshot({ path: testInfo.outputPath("rough-a-retained-ink.png") });
  await page.getByTestId("writing-undo").click();
  await expect(page.getByTestId("writing-cell-0-ink-0")).toHaveCount(0);
  await page
    .getByTestId("writing-practice")
    .screenshot({ path: testInfo.outputPath("rough-a-notebook.png") });
  await session.detach();
});
test("@regression 24 complete pairs unlock the next sheet without advancing and restart preserves unlocks", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto(
    "/practice/languages/japanese-hiragana-vowels-writing?path=japanese-foundations",
  );
  await expect(page.getByTestId("writing-repeat")).toBeEnabled();
  const session = await page.context().newCDPSession(page);
  const characters = ["a", "i"].map((name) =>
    index.languageCharacters.find(
      (c) => c.slug === "japanese/hiragana/" + name,
    )!,
  );
  for (let i = 0; i < 48; i++) {
    await ink(
      page,
      session,
      characters[i % 2]!.strokes.map((s) =>
        s.points.filter((_, k) => k % 4 === 0 || k === s.points.length - 1),
      ),
    );
    await submit(page);
    await expect(
      page.getByRole("progressbar", { name: "Sheet progress" }),
    ).toHaveAttribute("aria-valuenow", String(i + 1));
  }
  await expect(page.getByTestId("writing-sheet-progress")).toContainText(
    "Sheet 1",
  );
  await expect(page.getByTestId("writing-feedback")).toContainText(
    "Sheet complete",
  );
  await page.getByTestId("writing-next-sheet").click();
  await expect(page.getByTestId("writing-sheet-progress")).toContainText(
    "Sheet 2",
  );
  await page.getByTestId("writing-sheet-3042-3044-characters").click();
  await page.getByTestId("writing-repeat").click();
  await expect(page.getByTestId("writing-sheet-progress")).toContainText(
    "0 / 24",
  );
  await expect(
    page.getByTestId("writing-sheet-3046-3048-characters"),
  ).toBeEnabled();
  await page.getByTestId("writing-activity-match").click();
  await page.getByTestId("writing-match-kana-characters-0-0").click();
  await page.getByTestId("writing-match-romaji-characters-0-1").click();
  await expect(page.getByRole("status")).toContainText("Try another pair");
  await page.getByTestId("writing-match-romaji-characters-0-0").click();
  await expect(
    page.getByTestId("writing-match-kana-characters-0-0"),
  ).toBeDisabled();
  await session.detach();
});
test("@regression custom notebooks validate text, complete all three sheets and restore the active saved page", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/languages/japanese/notebooks");
  await page.getByTestId("notebook-custom-text").fill("🙂");
  await expect(page.getByRole("status")).toContainText("No writing guide");
  await expect(page.getByTestId("notebook-create")).toBeDisabled();
  await page.getByTestId("notebook-custom-text").fill(" 一 ");
  await page.getByTestId("notebook-create").click();
  await expect(page.getByTestId("writing-repeat")).toBeEnabled();
  const session = await page.context().newCDPSession(page);
  for (let sheet = 0; sheet < 3; sheet++) {
    for (let i = 0; i < 24; i++) {
      await ink(page, session, [
        [
          [15, 45],
          [48, 47],
          [87, 43],
        ],
      ]);
      await submit(page);
      await expect(
        page.getByRole("progressbar", { name: "Sheet progress" }),
      ).toHaveAttribute("aria-valuenow", String(i + 1));
    }
    if (sheet < 2) await page.getByTestId("writing-next-sheet").click();
  }
  await expect.poll(() => savedCount(page)).toBe(72);
  await page.reload();
  await expect(page.getByTestId("writing-sheet-progress")).toContainText(
    "Recall · Sheet 3",
  );
  await expect(page.getByTestId("writing-feedback")).toContainText(
    "Sheet complete",
  );
  await page.getByTestId("writing-repeat").click();
  await expect.poll(() => savedCount(page)).toBe(48);
  await page.getByTestId("notebooks-back").click();
  await page.getByTestId("notebook-saved-custom-4e00-v1").click();
  await expect(page.getByTestId("writing-sheet-progress")).toContainText(
    "Sheet 3",
  );
  await expect(page.getByTestId("writing-sheet-progress")).toContainText(
    "0 / 24",
  );
  await session.detach();
});
for (const [name, width, height] of [
  ["phone", 320, 850],
  ["iPad portrait", 820, 1180],
  ["iPad landscape", 1180, 820],
  ["Split View", 507, 820],
] as const) {
  test(`@regression ${name} notebook stays accessible and stable during drawing, correction and row scrolling`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto("/languages/japanese/characters/kanji/one");
    await expect(page.getByTestId("writing-repeat")).toBeEnabled();
    await expect(page.getByTestId("japanese-character-practice")).toContainText("Stroke order is up to you.");
    const viewport = page.getByTestId("writing-notebook-viewport");
    await viewport.scrollIntoViewIfNeeded();
    expect((await viewport.boundingBox())!.width).toBeGreaterThanOrEqual(280);
    const session = await page.context().newCDPSession(page);
    await ink(
      page,
      session,
      [
        [
          [10, 15],
          [10, 15],
        ],
      ],
      false,
    );
    await expect(page.getByTestId("writing-feedback")).toContainText("tiny mark");
    await expect(page.getByTestId("writing-feedback")).toContainText("enough");
    await page.getByTestId("writing-clear").click();
    await ink(
      page,
      session,
      [
        [
          [20, 43],
          [45, 44],
          [90, 42],
        ],
      ],
      false,
    );
    await submit(page);
    await expect(page.getByTestId("writing-cell-0-ink-0")).toBeVisible();
    const top = await viewport.evaluate(
      (e) => e.getBoundingClientRect().top + window.scrollY,
    );
    for (const label of ["Draw", "Pen", "Scroll"])
      await expect(page.getByRole("button", {name:label, exact:true})).toHaveCount(0);
    let box = (await viewport.boundingBox())!;
    const beforeWheel = await viewport.evaluate(e => ({
      offset: e.scrollTop + window.scrollY,
      overflow: e.scrollHeight > e.clientHeight,
    }));
    await page.mouse.move(box.x + box.width / 2, box.y + 160);
    await page.mouse.wheel(0, beforeWheel.overflow ? 120 : -120);
    await expect.poll(() => viewport.evaluate(e => e.scrollTop + window.scrollY))
      .toBe(beforeWheel.offset + (beforeWheel.overflow ? Math.min(120, await viewport.evaluate(e => e.scrollHeight - e.clientHeight)) : -120));
    box = (await viewport.boundingBox())!;
    const beforePan = await viewport.evaluate(e => e.scrollTop + window.scrollY);
    const fingers = (y:number) => [
      {id:1,x:box.x+80,y:box.y+y}, {id:2,x:box.x+160,y:box.y+y},
    ];
    await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[fingers(200)[0]!]});
    await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:fingers(200)});
    await session.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:fingers(300)});
    await session.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await expect.poll(() => viewport.evaluate(e => e.scrollTop + window.scrollY)).toBeLessThan(beforePan - 50);
    await expect(page.getByTestId("writing-pending-ink").getByTestId(/^writing-ink-/)).toHaveCount(0);
    await expect(page.getByTestId("writing-sheet-progress")).toContainText("1 / 24");
    expect(
      await viewport.evaluate(
        (e) => e.getBoundingClientRect().top + window.scrollY,
      ),
    ).toBe(top);
    await page.getByTestId("writing-practice").screenshot({
      path: testInfo.outputPath(name.replaceAll(" ", "-") + "-notebook.png"),
    });
    const violations = (
      await new AxeBuilder({ page })
        .include('[data-testid="writing-practice"]')
        .analyze()
    ).violations;
    expect(
      violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      ),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
    await session.detach();
  });
}
