import assert from "node:assert/strict";
import { log } from "node:console";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: {
  session: { type: "string" },
  "pixel-ratio": { type: "string", default: "1" },
} });
assert(values.session, "Open a notebook with agent-device and pass --session");
const ratio = Number(values["pixel-ratio"]);
assert(Number.isFinite(ratio) && ratio > 0, "Pass the device pixel ratio (iOS snapshots use points; Android uses physical pixels)");
const artifacts = resolve("test-results/native-notebook-layout", values.session, new Date().toISOString().replaceAll(":", "-"));
mkdirSync(artifacts, { recursive: true });
const device = (...args) => execFileSync("agent-device", [...args, "--session", values.session], { encoding: "utf8", timeout: 60000 });
const raw = device("snapshot", "--raw", "--json");
writeFileSync(resolve(artifacts, "snapshot.json"), raw);
device("screenshot", resolve(artifacts, "notebook.png"));
const result = JSON.parse(raw);
assert(result.success, raw);
const nodes = result.data.nodes;
const paper = nodes.find(n => n.identifier === "mobile-writing-notebook-viewport");
assert(paper, "Open a notebook before checking its layout");
const navigation = nodes.find(n => n.identifier === "mobile-navigation-bar") || nodes.find(n => n.identifier === "mobile-navigation-rail");
assert(navigation, "Expected persistent navigation");
const frame = nodes.find(n => n.type === "Application")?.rect;
const bottom = navigation.identifier === "mobile-navigation-bar" ? navigation.rect.y : (frame?.y ?? navigation.rect.y) + (frame?.height ?? navigation.rect.height);
const visiblePaper = Math.max(0, Math.min(paper.rect.y + paper.rect.height, bottom) - Math.max(0, paper.rect.y));
const visiblePoints = visiblePaper / ratio;
writeFileSync(resolve(artifacts, "measurements.json"), JSON.stringify({ paper, navigation, visiblePaper, visiblePoints, ratio }, null, 2));
assert(visiblePoints >= 180, `Notebook needs at least 180pt/dp of visible paper on entry; found ${visiblePoints.toFixed(1)}. Evidence: ${artifacts}`);
assert(paper.rect.x >= (navigation.identifier === "mobile-navigation-rail" ? navigation.rect.x + navigation.rect.width : 0), "Paper must clear the navigation rail");
if (frame) assert(paper.rect.x + paper.rect.width <= frame.width, "Paper must stay inside the screen");
log(`Notebook entry layout passed (${visiblePoints.toFixed(1)}pt/dp of paper). Evidence: ${artifacts}`);
