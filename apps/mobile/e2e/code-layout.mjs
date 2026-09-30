import assert from "node:assert/strict";
import { log } from "node:console";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

// This checks native layout and real gestures, which Jest's renderer cannot do.
// Run against a simulator session already opened with agent-device (see README).
const { values } = parseArgs({ options: {
  session: { type: "string" },
  app: { type: "string", default: "com.codematica.app" },
  url: { type: "string", default: "codematica://docs/programming/bfs-dfs-fundamentals" },
  artifacts: { type: "string", default: "test-results/native-code-layout" },
} });
assert(values.session, "Pass --session with an agent-device Android/iOS simulator session");
const runId = new Date().toISOString().replaceAll(":", "-");
const artifacts = resolve(values.artifacts, values.session, runId);
mkdirSync(artifacts, { recursive: true });

function device(...args) {
  return execFileSync("agent-device", [...args.map(String), "--session", values.session], {
    encoding: "utf8", timeout: 60000, maxBuffer: 16 * 1024 * 1024,
  });
}

function snapshot(name) {
  const raw = device("snapshot", "--raw", "--json");
  writeFileSync(resolve(artifacts, `${name}.json`), raw);
  const result = JSON.parse(raw);
  assert(result.success, raw);
  return result.data.nodes;
}

const sourcePrefix = "from collections import deque";
const prosePrefix = "Mark a node visited when it enters the queue.";
const byId = (nodes, id) => nodes.find((node) => node.identifier === id);
const bottom = (node) => node.rect.y + node.rect.height;
let isIOS = false;

function drag(x, y, dx, dy) {
  // Use iOS's swipe primitive: timed pan can leave a stationary touch there.
  if (isIOS) device("swipe", Math.round(x), Math.round(y), Math.round(x + dx), Math.round(y + dy));
  else device("gesture", "pan", Math.round(x), Math.round(y), Math.round(dx), Math.round(dy), 600);
  device("wait", "stable", 300, 10000);
}

function elements(nodes) {
  const source = nodes.find((node) => node.identifier === "mobile-code-source" && node.label?.startsWith(sourcePrefix));
  const prose = nodes.find((node) => node.label?.startsWith(prosePrefix));
  const navigation = byId(nodes, "mobile-navigation-bar");
  assert(navigation, "Expected phone bottom navigation");
  const page = nodes.find((node) => /ScrollView/.test(node.type) && node.rect.width === navigation.rect.width);
  assert(page, "Expected a vertical page viewport");
  const scroll = source && nodes.find((node) => node.identifier === "mobile-code-scroll" &&
    node.rect.y <= source.rect.y + 1 && bottom(node) >= bottom(source) - 1);
  const block = scroll && nodes.find((node) => node.identifier === "mobile-code-block" &&
    node.rect.y <= scroll.rect.y + 1 && bottom(node) >= bottom(scroll) - 1);
  return { source, prose, navigation, page, scroll, block };
}

function sameRect(actual, expected, message) {
  for (const key of ["x", "y", "width", "height"]) {
    assert(Math.abs(actual.rect[key] - expected.rect[key]) <= 1, `${message}: ${key} changed`);
  }
}

function assertContained({ block, scroll, source, prose, navigation }) {
  assert(block && scroll && source && prose, "Expected code, horizontal viewport, and adjacent prose");
  assert(block.rect.x >= 0 && block.rect.x + block.rect.width <= navigation.rect.width, "Code must not widen the page");
  assert(prose.rect.x >= 0 && prose.rect.x + prose.rect.width <= navigation.rect.width, "Prose must stay inside the page");
  assert(source.rect.y >= scroll.rect.y && bottom(source) <= bottom(scroll) + 1, "All source lines must fit vertically in the code viewport");
  assert(bottom(block) < navigation.rect.y, "Code must not overlap the bottom navigation");
}

try {
  device("open", values.app, "--relaunch");
  device("open", values.url);
  device("wait", 'id="mobile-markdown-renderer"', 20000);
  let before;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const nodes = snapshot(`position-${attempt}`);
    isIOS = nodes.some((node) => node.type === "Application");
    const current = elements(nodes);
    const { block, source, prose, navigation, page } = current;
    const pageHeight = navigation.rect.y - page.rect.y;
    const margin = navigation.rect.width * 0.06;
    if (block && source && prose && block.rect.y > page.rect.y + 2 && bottom(prose) < navigation.rect.y) {
      before = current;
      break;
    }
    // Stay in the page's gutter so the positioning gesture cannot target code.
    const delta = block
      ? Math.max(-pageHeight * 0.55, Math.min(pageHeight * 0.55, page.rect.y + margin - block.rect.y))
      : -pageHeight * 0.55;
    drag(navigation.rect.width * 0.02, page.rect.y + pageHeight * (delta < 0 ? 0.8 : 0.2), 0, delta * (isIOS ? 0.2 : 0.5));
  }
  assert(before, "Could not position the first BFS code block and its following paragraph together");
  assertContained(before);
  device("screenshot", resolve(artifacts, "before.png"));
  const { scroll } = before;
  const y = Math.round(scroll.rect.y + scroll.rect.height / 2);
  const left = Math.round(scroll.rect.x + scroll.rect.width * 0.12);
  const right = Math.round(scroll.rect.x + scroll.rect.width * 0.88);
  drag(right, y, left - right, 0);
  const after = elements(snapshot("after-horizontal-swipe"));
  device("screenshot", resolve(artifacts, "after-horizontal-swipe.png"));
  assertContained(after);
  assert(after.source.rect.x < before.source.rect.x - 4, "A horizontal swipe must move the code source");
  sameRect(after.prose, before.prose, "Horizontal code scrolling moved surrounding prose");
  sameRect(after.navigation, before.navigation, "Horizontal code scrolling moved navigation");
  sameRect(after.block, before.block, "Horizontal code scrolling moved or resized the code container");
  assert(Math.abs(after.source.rect.y - before.source.rect.y) <= 1, "Horizontal code scrolling moved the page vertically");

  drag(left, y, right - left, 0);
  const restored = elements(snapshot("restored"));
  sameRect(restored.source, before.source, "Reverse swipe did not restore the start of the source");
  sameRect(restored.prose, before.prose, "Reverse swipe moved surrounding prose");

  // A vertical drag starting on the code must still scroll the article.
  drag((left + right) / 2, y, 0, -100);
  const vertical = elements(snapshot("after-vertical-swipe"));
  assert(vertical.prose.rect.y < before.prose.rect.y - 10, "Code trapped the page's vertical scrolling");
  sameRect(vertical.navigation, before.navigation, "Vertical scrolling moved navigation");
  device("screenshot", resolve(artifacts, "after-vertical-swipe.png"));
  writeFileSync(resolve(artifacts, "result.json"), JSON.stringify({ passed: true, before, after, restored, vertical }, null, 2));
  log(`Native code layout passed: ${values.session}. Evidence: ${artifacts}`);
} catch (error) {
  try { device("screenshot", resolve(artifacts, "failure.png")); } catch { /* Preserve the original failure. */ }
  throw error;
}
