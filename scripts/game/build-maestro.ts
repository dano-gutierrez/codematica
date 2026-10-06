import { readFile, writeFile } from "node:fs/promises";
import { gameCampaignSchema } from "../../packages/core/src/game/schema";
const campaign = gameCampaignSchema.parse(
  JSON.parse(await readFile("content/game/restore-the-signal.json", "utf8")),
);
const steps: (object | string)[] = [
  { launchApp: { clearState: true } },
  { assertVisible: { id: "mobile-nav-learn" } },
  { setAirplaneMode: "enabled" },
];
let rank = 0;
function find(selector: object, next: number) {
  const direction = next < rank ? "UP" : "DOWN";
  const id = (selector as { id?: string }).id ?? "";
  const nearbyControl = /^(game-connect-|game-piece-|game-port-)/.test(id) || (id === "game-run" && direction === "UP");
  steps.push({
    scrollUntilVisible: {
      element: selector,
      direction,
      // Adjacent controls and the return from results need bounded movement.
      speed: nearbyControl ? 20 : 80,
      centerElement: false,
      timeout: 20000,
    },
  });
  rank = next;
}
function tap(id: string, next: number) {
  find({ id }, next);
  steps.push({ tapOn: { id } });
}
for (const level of campaign.levels) {
  steps.push({ openLink: `codematica://play/${campaign.id}/${level.id}` });
  rank = 0;
  steps.push({
    runFlow: {
      when: { visible: "Open in.*Codematica.*" },
      commands: [{ tapOn: "Open" }],
    },
  });
  for (const [index, scenario] of level.scenarios.entries()) {
    const previous = level.scenarios[index - 1];
    // Long screens need local waypoints when returning from results.
    // Each search keeps its original budget instead of one distant search.
    if (previous?.kind === "system") {
      find({ id: "game-board" }, 200);
      find({ id: `game-piece-${previous.components[0]!.id}` }, 100);
    } else if (previous) {
      find({ id: "game-run" }, 600);
      if (previous.kind === "pipes")
        find({ id: `game-port-${previous.pieces[0]!.ports[0]!.id}` }, 100);
      else find({ id: "game-code" }, 50);
    }
    tap(`game-scenario-${scenario.id}`, 10);
    if (scenario.kind === "grid" || scenario.kind === "sql") {
      find({ id: "game-code" }, 50);
      steps.push(
        { longPressOn: { id: "game-code", point: "25%,20%" } },
        { runFlow: {
          when: { platform: "Android", notVisible: "Select [Aa]ll" },
          commands: [{ tapOn: { id: "android:id/overflow" } }],
        } },
        { tapOn: "Select [Aa]ll" },
        { eraseText: 1 },
      );
      for (const [lineIndex, line] of scenario.solution.split("\n").entries()) {
        if (lineIndex) steps.push({ pressKey: "Enter" });
        steps.push({ inputText: line });
      }
      steps.push(
        { assertVisible: { id: "game-code", text: `^${scenario.solution.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$` } },
        "hideKeyboard",
      );
    } else if (scenario.kind === "pipes") {
      const ports = scenario.pieces.flatMap((p) => p.ports);
      for (const e of scenario.solution) {
        tap(
          `game-port-${e.from}`,
          100 + ports.findIndex((p) => p.id === e.from),
        );
        tap(`game-port-${e.to}`, 100 + ports.findIndex((p) => p.id === e.to));
      }
    } else {
      if (level.mode === "defense" && scenario.id !== "main") {
        tap("game-assist", 700);
        find({ id: "game-board" }, 200);
      }
      for (const id of scenario.solution.nodes)
        tap(
          `game-piece-${id}`,
          100 + scenario.components.findIndex((c) => c.id === id),
        );
      // Android reports clipped container bounds as fully visible. Placement
      // order spans the rows; check the bottom then top before direct taps.
      find({ id: `game-connect-${scenario.solution.nodes.at(-1)}` }, 201);
      find({ id: `game-connect-${scenario.solution.nodes[0]}` }, 200);
      for (const id of scenario.solution.nodes)
        steps.push({ assertVisible: { id: `game-connect-${id}` } });
      for (const e of scenario.solution.edges)
        steps.push(
          { tapOn: { id: `game-connect-${e.from}` } },
          { tapOn: { id: `game-connect-${e.to}` } },
        );
      if (scenario.solution.routing === "capacity-weighted")
        tap("game-routing", 250);
      if (scenario.solution.invalidate) tap("game-invalidate", 270);
    }
    tap("game-run", 600);
    if (level.mode === "defense" && scenario.id === "main") {
      steps.push(
        { pressKey: "Home" },
        { launchApp: { stopApp: false } },
        { assertVisible: { id: "game-resume" } },
        { tapOn: { id: "game-resume" } },
      );
      steps.push({
        extendedWaitUntil: {
          visible: "Integrity.*24/24s.*won",
          timeout: 40000,
        },
      });
    }
    find({ text: "Signal restored!" }, 1000);
    steps.push({ assertVisible: "Signal restored!" });
  }
  // A full restart must keep all earned objectives while discarding the attempt.
  steps.push("launchApp", { assertVisible: { id: "mobile-nav-learn" } });
  rank = 0;
}
steps.push(
  { setAirplaneMode: "disabled" },
  { openLink: "codematica://" },
  // The compact list keeps the score header within reach of the bounded lookup.
  { assertVisible: "Level list" },
  { tapOn: "Level list" },
  {
    scrollUntilVisible: {
      element: { text: ".*36/36.*1800 XP.*" },
      direction: "UP",
    },
  },
  { assertVisible: ".*36/36.*1800 XP.*" },
);
await writeFile(
  "apps/mobile/.maestro/game-chapter.regression.yaml",
  `# Generated by npm run game:flows; solutions come from validated campaign content.\nappId: com.codematica.app\ntags:\n  - regression\nonFlowComplete:\n  - setAirplaneMode: disabled\n---\n${JSON.stringify(steps, null, 2)}\n`,
);
console.log(
  `Exported the 36-scenario native chapter journey (${steps.length} actions).`,
);
