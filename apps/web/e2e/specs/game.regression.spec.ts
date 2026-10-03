import { expect, test } from "@playwright/test";
import campaign from "../../../../content/game/restore-the-signal.json" with { type: "json" };
for (const level of campaign.levels)
  for (const scenario of level.scenarios)
    test(`@regression ${level.title} ${scenario.id} accepts its authored solution`, async ({
      page,
    }) => {
      await page.addInitScript(
        ({ campaign, order, scenario }) => {
          const awards: Record<string, { earnedAt: string; mode: string }> = {};
          for (const l of campaign.levels)
            if (l.order < order || (l.order === order && scenario !== "main"))
              awards[`${campaign.id}/${l.id}/main`] = {
                earnedAt: new Date().toISOString(),
                mode: "standard",
              };
          localStorage.setItem(
            "codematica.game.v1",
            JSON.stringify({
              version: 1,
              timezone: "UTC",
              awards,
              activityDays: [],
              cosmetic: "none",
              updatedAt: new Date().toISOString(),
            }),
          );
        },
        { campaign, order: level.order, scenario: scenario.id },
      );
      await page.goto(`/play/${campaign.id}/${level.id}`);
      await page.getByTestId(`game-scenario-${scenario.id}`).click();
      if (scenario.kind === "grid" || scenario.kind === "sql") {
        await page.getByTestId("game-code").fill(scenario.solution as string);
      } else if (scenario.kind === "pipes") {
        for (const e of scenario.solution as { from: string; to: string }[]) {
          await page.getByTestId(`game-port-${e.from}`).click();
          await page.getByTestId(`game-port-${e.to}`).click();
        }
      } else {
        if (level.mode === "defense")
          await page
            .getByRole("button", { name: "Use assisted untimed mode" })
            .click();
        const board = scenario.solution as {
          nodes: string[];
          edges: { from: string; to: string }[];
          invalidate: boolean;
          routing?: string;
        };
        for (const node of board.nodes)
          await page.getByTestId(`game-piece-${node}`).click();
        for (const edge of board.edges) {
          await page.getByTestId(`game-connect-${edge.from}`).click();
          await page.getByTestId(`game-connect-${edge.to}`).click();
        }
        if (board.routing === "capacity-weighted")
          await page.getByLabel("Capacity weighted").check();
        if (board.invalidate)
          await page
            .getByLabel("Invalidate cached targeting data after writes")
            .check();
      }
      await page.getByTestId("game-run").click();
      await expect(page.getByTestId("game-result")).toContainText(
        "Signal restored!",
      );
    });
test("@regression preserves a draft through a help lesson", async ({
  page,
}) => {
  await page.goto("/play/restore-the-signal/courtyard-defense");
  await page.getByTestId("game-code").fill("grid-column: 3 / 4;");
  await page.getByRole("link", { name: /css grid defense/ }).click();
  await expect(page.getByTestId("document-page")).toBeVisible();
  await page.getByTestId("game-return").click();
  await expect(page.getByTestId("game-code")).toHaveValue(
    "grid-column: 3 / 4;",
  );
});

test("@regression rejects overflowing grid geometry and unsafe SQL without granting rewards", async ({
  page,
}) => {
  await page.goto("/play/restore-the-signal/courtyard-defense");
  await page
    .getByTestId("game-code")
    .fill(
      "grid-template-columns: 1000px 1000px 1000px 1000px; grid-column: 2 / 3; grid-row: 1 / 2;",
    );
  await page.getByTestId("game-run").click();
  await expect(page.getByTestId("game-result")).toContainText(
    "Inspect the result",
  );
  await page.getByTestId("game-code").fill("grid-column: 2 / 3;");
  await page.getByTestId("game-run").click();
  await expect(page.getByTestId("game-result")).toContainText(
    "Signal restored!",
  );
  await page.getByRole("link", { name: "Next level" }).click();
  for (const query of [
    "SELECT id FROM zombies",
    "DELETE FROM zombies;",
    "SELECT id FROM zombies; SELECT id FROM zombies;",
  ]) {
    await page.getByTestId("game-code").fill(query);
    await page.getByTestId("game-run").click();
    await expect(page.getByTestId("game-result")).toContainText(
      "Inspect the result",
    );
  }
  await page
    .getByTestId("game-code")
    .fill("SELECT id FROM zombies WHERE 'runner' = kind ORDER BY id DESC");
  await page.getByTestId("game-run").click();
  await expect(page.getByTestId("game-result")).toContainText(
    "Signal restored!",
  );
});
for (const order of [8, 12])
  test(`@regression level ${order} runs live, freezes on background and requires explicit resume`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(
      ({ campaign, order }) => {
        if (localStorage.getItem("codematica.game.v1")) return;
        const awards: Record<string, { earnedAt: string; mode: string }> = {};
        for (const l of campaign.levels.filter((l) => l.order < order))
          awards[`${campaign.id}/${l.id}/main`] = {
            earnedAt: new Date().toISOString(),
            mode: "standard",
          };
        localStorage.setItem(
          "codematica.game.v1",
          JSON.stringify({
            version: 1,
            timezone: "UTC",
            awards,
            activityDays: [],
            cosmetic: "none",
            updatedAt: new Date().toISOString(),
          }),
        );
      },
      { campaign, order },
    );
    const level = campaign.levels[order - 1],
      board = level.scenarios[0].solution as {
        nodes: string[];
        edges: { from: string; to: string }[];
        invalidate: boolean;
      };
    await page.goto(`/play/${campaign.id}/${level.id}`);
    for (const node of board.nodes)
      await page.getByTestId(`game-piece-${node}`).click();
    for (const edge of board.edges) {
      await page.getByTestId(`game-connect-${edge.from}`).click();
      await page.getByTestId(`game-connect-${edge.to}`).click();
    }
    if (board.invalidate)
      await page
        .getByLabel("Invalidate cached targeting data after writes")
        .check();
    const client = page.getByTestId("game-connect-client");
    await client.focus();
    const before = await client.getAttribute("style");
    await page.keyboard.press("ArrowRight");
    await expect(client).not.toHaveAttribute("style", before!);
    await page.getByTestId("game-run").click();
    await page.clock.runFor(1100);
    await expect(page.getByTestId("game-result")).toContainText(
      "System holding",
    );
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(page.getByTestId("game-resume")).toBeVisible();
    await expect(page.getByTestId("game-piece-client")).toBeDisabled();
    await page.clock.runFor(30000);
    await expect(page.getByTestId("game-result")).not.toContainText(
      "Signal restored!",
    );
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(page.getByTestId("game-resume")).toBeVisible();
    await page.getByTestId("game-resume").click();
    await page.clock.runFor(24000);
    await expect(page.getByTestId("game-result")).toContainText(
      "Signal restored!",
    );
    await page.reload();
    await expect(page.getByTestId("game-run")).toHaveText(/Start defense/);
    await expect(page.getByTestId("game-scenario-mastery-1")).toBeEnabled();
  });
