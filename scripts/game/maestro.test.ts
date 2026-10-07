import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("generated native chapter readiness", () => {
  it("returns through the compact level list before checking retained chapter totals", () => {
    const source = readFileSync("apps/mobile/.maestro/game-chapter.regression.yaml", "utf8");
    const steps: (string | Record<string, unknown>)[] = JSON.parse(source.split("\n---\n")[1]!);
    expect(steps.slice(-6)).toEqual([
      { setAirplaneMode: "disabled" },
      { openLink: "codematica://" },
      { assertVisible: "Level list" },
      { tapOn: "Level list" },
      { scrollUntilVisible: { element: { text: ".*36/36.*1800 XP.*" }, direction: "UP" } },
      { assertVisible: ".*36/36.*1800 XP.*" },
    ]);
  });

  it("checks both spatial rows and every placed connector before tapping", () => {
    const campaign = JSON.parse(readFileSync("content/game/restore-the-signal.json", "utf8")) as {
      levels: { id: string; scenarios: { id: string; kind: string; solution: { nodes: string[]; edges: { from: string; to: string }[] } }[] }[];
    };
    const source = readFileSync("apps/mobile/.maestro/game-chapter.regression.yaml", "utf8");
    const steps: (string | Record<string, unknown>)[] = JSON.parse(source.split("\n---\n")[1]!);
    let level: (typeof campaign.levels)[number] | undefined;
    let scenario: NonNullable<typeof level>["scenarios"][number] | undefined;
    let boards = 0;
    for (const [index, step] of steps.entries()) {
      if (typeof step !== "object") continue;
      if (typeof step.openLink === "string") level = campaign.levels.find(item => step.openLink === `codematica://play/restore-the-signal/${item.id}`);
      const tap = (step.tapOn as { id?: string } | undefined)?.id;
      if (tap?.startsWith("game-scenario-")) scenario = level?.scenarios.find(item => tap === `game-scenario-${item.id}`);
      const search = step.scrollUntilVisible as { element?: { id?: string }; direction?: string; centerElement?: boolean; speed?: number } | undefined;
      if (!search?.element?.id?.startsWith("game-connect-") || search.direction !== "UP") continue;
      expect(scenario?.kind).toBe("system");
      // Placement order defines rows; the first and last nodes span the board.
      expect(steps[index - 1]).toMatchObject({ scrollUntilVisible: { element: { id: `game-connect-${scenario!.solution.nodes.at(-1)}` }, direction: "DOWN", speed: 20, centerElement: false, timeout: 20000 } });
      expect(search).toMatchObject({ element: { id: `game-connect-${scenario!.solution.nodes[0]}` }, direction: "UP", speed: 20, centerElement: false, timeout: 20000 });
      for (const [offset, id] of scenario!.solution.nodes.entries())
        expect(steps[index + offset + 1]).toEqual({ assertVisible: { id: `game-connect-${id}` } });
      const connections = scenario!.solution.edges.flatMap(edge => [edge.from, edge.to]);
      for (const [offset, id] of connections.entries())
        expect(steps[index + scenario!.solution.nodes.length + offset + 1]).toEqual({ tapOn: { id: `game-connect-${id}` } });
      boards++;
    }
    expect(boards).toBe(9);
  });
  it("returns from results through nearby controls on code and pipe screens", () => {
    const campaign = JSON.parse(readFileSync("content/game/restore-the-signal.json", "utf8")) as {
      levels: { id: string; scenarios: { kind: string; pieces?: { ports: { id: string }[] }[] }[] }[];
    };
    const source = readFileSync("apps/mobile/.maestro/game-chapter.regression.yaml", "utf8");
    const steps: (string | Record<string, unknown>)[] = JSON.parse(source.split("\n---\n")[1]!);
    let level: (typeof campaign.levels)[number] | undefined;
    let returns = 0;
    for (const [index, step] of steps.entries()) {
      if (typeof step !== "object") continue;
      if (typeof step.openLink === "string") level = campaign.levels.find(item => step.openLink === `codematica://play/restore-the-signal/${item.id}`);
      const id = (step.tapOn as { id?: string } | undefined)?.id;
      if (!level || !id?.startsWith("game-scenario-mastery-")) continue;
      const previous = level.scenarios[Number(id.slice(-1)) - 1]!;
      if (previous.kind === "system") continue;
      const waypoint = previous.kind === "pipes" ? `game-port-${previous.pieces![0]!.ports[0]!.id}` : "game-code";
      expect(steps[index - 3]).toMatchObject({ scrollUntilVisible: { element: { id: "game-run" }, direction: "UP", timeout: 20000, centerElement: false } });
      expect(steps[index - 2]).toMatchObject({ scrollUntilVisible: { element: { id: waypoint }, direction: "UP", timeout: 20000, centerElement: false } });
      returns++;
    }
    expect(returns).toBe(18);
  });
  it("returns through nearby board and component waypoints on long system screens", () => {
    const campaign = JSON.parse(readFileSync("content/game/restore-the-signal.json", "utf8")) as {
      levels: { id: string; kind: string; scenarios: { components?: { id: string }[] }[] }[];
    };
    const source = readFileSync("apps/mobile/.maestro/game-chapter.regression.yaml", "utf8");
    const steps: (string | Record<string, unknown>)[] = JSON.parse(source.split("\n---\n")[1]!);
    let level: (typeof campaign.levels)[number] | undefined;
    let returns = 0;
    let assists = 0;
    for (const [index, step] of steps.entries()) {
      if (typeof step !== "object") continue;
      if (typeof step.openLink === "string") level = campaign.levels.find(item => step.openLink === `codematica://play/restore-the-signal/${item.id}`);
      const id = (step.tapOn as { id?: string } | undefined)?.id;
      if (level?.kind === "system" && id?.startsWith("game-scenario-mastery-")) {
        expect(steps[index - 3]).toMatchObject({ scrollUntilVisible: { element: { id: "game-board" }, direction: "UP", timeout: 20000, centerElement: false } });
        expect(steps[index - 2]).toMatchObject({ scrollUntilVisible: { element: { id: `game-piece-${level.scenarios[0]!.components![0]!.id}` }, direction: "UP", timeout: 20000, centerElement: false } });
        returns++;
      }
      if (id === "game-assist") {
        expect(steps[index + 1]).toMatchObject({ scrollUntilVisible: { element: { id: "game-board" }, direction: "UP", timeout: 20000, centerElement: false } });
        assists++;
      }
    }
    expect(returns).toBe(6);
    expect(assists).toBe(4);
  });
  it("keeps spatial rows in view throughout the direct connection sequence", () => {
    const source = readFileSync("apps/mobile/.maestro/game-chapter.regression.yaml", "utf8");
    const steps: (string | Record<string, unknown>)[] = JSON.parse(source.split("\n---\n")[1]!);
    let boardVisible = false;
    let boards = 0;
    let connections = 0;
    for (const step of steps) {
      if (typeof step !== "object") continue;
      const search = step.scrollUntilVisible as { element?: { id?: string }; visibilityPercentage?: number; direction?: string } | undefined;
      if (search) {
        boardVisible = search.element?.id?.startsWith("game-connect-") === true;
        if (boardVisible) {
          expect(search.visibilityPercentage ?? 100).toBe(100);
          if (search.direction === "UP") boards++;
        }
      }
      const id = (step.tapOn as { id?: string } | undefined)?.id;
      if (id?.startsWith("game-connect-")) {
        expect(boardVisible, `${id} needs the entire spatial board in view`).toBe(true);
        connections++;
      }
    }
    expect(boards).toBe(9);
    expect(connections).toBe(122);
  });
  it("keeps a fully visible target in place instead of adding a centering swipe", () => {
    const source = readFileSync("apps/mobile/.maestro/game-chapter.regression.yaml", "utf8");
    const steps: (string | { scrollUntilVisible?: { element?: { id?: string }; centerElement?: boolean; timeout?: number; speed?: number; direction?: string } })[] = JSON.parse(source.split("\n---\n")[1]!);
    const searches = steps.flatMap(step => typeof step === "object" && step.scrollUntilVisible?.timeout === 20000 ? [step.scrollUntilVisible] : []);
    expect(searches.length).toBeGreaterThan(100);
    for (const search of searches) {
      expect(search.centerElement ?? false).toBe(false);
      const spatialControl = /^(game-connect-|game-piece-|game-port-)/.test(search.element?.id ?? "") || (search.element?.id === "game-run" && search.direction === "UP");
      expect(search.speed, `${search.element?.id ?? "text target"} must keep its spatial row reachable`).toBe(spatialControl ? 20 : 80);
    }
  });
  it("selects all starter code before replacing it regardless of the caret position", () => {
    const source = readFileSync("apps/mobile/.maestro/game-chapter.regression.yaml", "utf8");
    const steps: (string | Record<string, unknown>)[] = JSON.parse(source.split("\n---\n")[1]!);
    const campaign = JSON.parse(readFileSync("content/game/restore-the-signal.json", "utf8")) as { levels: { scenarios: { kind: string; solution: string }[] }[] };
    const expected = campaign.levels.flatMap(level => level.scenarios).filter(scenario => scenario.kind === "grid" || scenario.kind === "sql").map(scenario => scenario.solution);
    const entries = steps.map((step, index) => typeof step === "object" && "eraseText" in step ? index : -1).filter(index => index >= 0);
    expect(entries).toHaveLength(expected.length);
    for (const [position, index] of entries.entries()) {
      expect(steps[index]).toEqual({ eraseText: 1 });
      expect(steps[index - 1]).toEqual({ tapOn: "Select [Aa]ll" });
      expect(steps[index - 2]).toEqual({ runFlow: {
        when: { platform: "Android", notVisible: "Select [Aa]ll" },
        commands: [{ tapOn: { id: "android:id/overflow" } }],
      } });
      expect(steps[index - 3]).toMatchObject({ longPressOn: { id: "game-code" } });
      let entered = "";
      let assertion: { id?: string; text?: string } | undefined;
      for (const step of steps.slice(index + 1)) {
        if (typeof step !== "object") break;
        if (typeof step.inputText === "string") {
          expect(step.inputText).not.toMatch(/[\r\n]/); // Android inputText drops line breaks.
          entered += step.inputText;
        }
        if (step.pressKey === "Enter") entered += "\n";
        if (step.assertVisible) {
          assertion = step.assertVisible as typeof assertion;
          break;
        }
      }
      expect(entered).toBe(expected[position]);
      expect(assertion?.id).toBe("game-code");
      const exact = new RegExp(assertion?.text ?? "$^");
      expect(exact.test(entered)).toBe(true);
      expect(exact.test(entered + " old starter")).toBe(false);
    }
  });

  it("waits for the React navigator before each deep link after a cold launch", () => {
    const source = readFileSync("apps/mobile/.maestro/game-chapter.regression.yaml", "utf8");
    const steps: (string | Record<string, unknown>)[] = JSON.parse(source.split("\n---\n")[1]!);
    let ready = false;
    let links = 0;
    for (const step of steps) {
      if (step === "launchApp" || (typeof step === "object" && "launchApp" in step && (step.launchApp as { stopApp?: boolean }).stopApp !== false)) ready = false;
      if (typeof step !== "object") continue;
      if ((step.assertVisible as { id?: string } | undefined)?.id === "mobile-nav-learn") ready = true;
      if ("openLink" in step) {
        expect(ready, `Navigator was not ready before ${step.openLink}`).toBe(true);
        links++;
      }
    }
    expect(links).toBeGreaterThan(1);
  });
});
