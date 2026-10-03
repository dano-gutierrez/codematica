import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { log } from "node:console";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

// Use a disposable simulator notebook with the single-character prompt あ.
// This dispatches real native gestures, not events directly to the React component.
const { values } = parseArgs({ options: {
  session: { type: "string" },
  "pixel-ratio": { type: "string", default: "1" },
} });
assert(values.session, "Open an あ notebook and pass --session");
const ratio = Number(values["pixel-ratio"]);
assert(Number.isFinite(ratio) && ratio > 0, "Expected a positive device pixel ratio");
const artifacts = resolve("test-results/native-notebook-gestures", values.session, new Date().toISOString().replaceAll(":", "-"));
mkdirSync(artifacts, { recursive: true });
const device = (...args) => execFileSync("agent-device", [...args.map(String), "--session", values.session], {
  encoding: "utf8", timeout: 60000, maxBuffer: 16 * 1024 * 1024,
});
function snapshot(name) {
  const raw = device("snapshot", "--raw", "--json");
  writeFileSync(resolve(artifacts, name + ".json"), raw);
  const result = JSON.parse(raw);
  assert(result.success, raw);
  return result.data.nodes;
}
const byId = (nodes, id) => nodes.find(n => n.identifier === id);
function repetitions(nodes) {
  const label = byId(nodes, "mobile-writing-sheet-progress")?.label;
  const match = label?.match(/(\d+) \/ 24 repetitions/);
  assert(match, "Expected a notebook repetition counter");
  return Number(match[1]);
}
function samePaper(nodes, original) {
  const paper = byId(nodes, "mobile-writing-notebook-viewport");
  assert(paper, "A writing stroke must not navigate away from the notebook");
  for (const key of ["x", "y", "width", "height"])
    assert(Math.abs(paper.rect[key] - original[key]) <= ratio, "Drawing/feedback moved the paper: " + key);
}
const strokes = [
  [[25,37],[38,38],[56,33],[68,31]],
  [[52,18],[48,43],[49,68],[54,84]],
  [[63,39],[63,51],[54,65],[40,80],[27,82],[21,75],[22,65],[34,53],[48,49],[61,49],[77,55],[84,65],[80,78],[64,87]],
];
let isIOS, paper, initial;
function draw(ink, name) {
  const x = paper.x + paper.width * 0.48, y = paper.y + 20 * ratio;
  const steps = [];
  for (const points of ink) for (let i = 1; i < points.length; i++) {
    const from = { x: Math.round(x + points[i - 1][0] * ratio), y: Math.round(y + points[i - 1][1] * ratio) };
    const to = { x: Math.round(x + points[i][0] * ratio), y: Math.round(y + points[i][1] * ratio) };
    // agent-device 0.20.3's Android fling can cancel a vertical contact; timed
    // pans provide the continuous sampling path. iOS uses its swipe primitive.
    steps.push(isIOS ? { command: "swipe", input: { from, to } } : {
      command: "gesture", positionals: ["pan", String(from.x), String(from.y), String(to.x - from.x), String(to.y - from.y), "300"],
    });
  }
  const path = resolve(artifacts, name + "-steps.json");
  writeFileSync(path, JSON.stringify(steps, null, 2));
  writeFileSync(resolve(artifacts, name + "-result.json"), device("batch", "--steps-file", path, "--json"));
}
try {
  const before = snapshot("before");
  isIOS = before.some(n => n.type === "Application");
  paper = byId(before, "mobile-writing-notebook-viewport")?.rect;
  assert(paper && byId(before, "mobile-writing-notebook-viewport").label === "Notebook paper for a", "Open a single-character あ notebook");
  initial = repetitions(before);
  assert(initial < 22, "Use a sheet with room for this QA exercise");
  device("screenshot", resolve(artifacts, "before.png"));
  device("press", 'id="mobile-writing-clear"', "--settle");
  draw(strokes.slice(0, 2), "incomplete");
  device("wait", "text", "Try again · write the whole character.", 10000);
  const incomplete = snapshot("incomplete-cleared");
  assert.equal(repetitions(incomplete), initial, "Missing the loop must not count as あ");
  samePaper(incomplete, paper);
  device("screenshot", resolve(artifacts, "incomplete-cleared.png"));
  draw(strokes, "rough-a");
  device("wait", "text", `${initial + 1} / 24 repetitions`, 10000);
  samePaper(snapshot("accepted"), paper);
  device("screenshot", resolve(artifacts, "accepted.png"));
  // Once expired ink is gone, Undo must reach the accepted character.
  device("press", Math.round(paper.x + paper.width * 0.65), Math.round(paper.y + 60 * ratio));
  device("wait", "text", "Try again · write the whole character.", 10000);
  assert.equal(repetitions(snapshot("tap-cleared")), initial + 1, "A tap must not advance the cursor");
  device("press", 'id="mobile-writing-undo"', "--settle");
  assert.equal(repetitions(snapshot("undo")), initial, "Rejected ink must expire so Undo reaches the saved cell");
  draw(strokes, "retained-a");
  device("wait", "text", `${initial + 1} / 24 repetitions`, 10000);
  const frame = before.find(n => n.type === "Application")?.rect;
  const nav = byId(before, "mobile-navigation-bar");
  const bottom = nav?.rect.y ?? frame.y + frame.height;
  // Leave room for both synthesized contacts, including iPad landscape.
  const panX = Math.round(paper.x + paper.width * 0.25);
  const panY = Math.round((paper.y + Math.min(bottom, paper.y + paper.height)) / 2);
  device("gesture", "pan", panX, panY, 0, -100 * ratio, 500, "--pointer-count", 2);
  device("diff", "snapshot", "-i");
  assert.equal(repetitions(snapshot("scrolled")), initial + 1, "Two-finger scrolling must not add ink");
  device("screenshot", resolve(artifacts, "scrolled.png"));
  device("gesture", "pan", panX, panY, 0, 100 * ratio, 500, "--pointer-count", 2);
  device("diff", "snapshot", "-i");
  device("screenshot", resolve(artifacts, "returned.png"));
  assert.equal(repetitions(snapshot("returned")), initial + 1);
  log(`Native notebook gestures passed. Review the scroll screenshots: ${artifacts}`);
} catch (error) {
  try { device("screenshot", resolve(artifacts, "failure.png")); } catch { /* Keep the original failure. */ }
  throw error;
}
