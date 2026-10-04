import { describe, expect, it } from "vitest";
import { codeMirrorSelectAll } from "../../apps/web/e2e/code-editor";

describe("CodeMirror keyboard platform", () => {
  it.each([
    ["Linux desktop", "Linux x86_64", "Google Inc.", "Chrome/130", 0, "Control+A"],
    ["Windows desktop", "Win32", "Google Inc.", "Chrome/130", 0, "Control+A"],
    ["Mac desktop", "MacIntel", "Google Inc.", "Chrome/130", 0, "Meta+A"],
    ["emulated iPhone on Linux", "Linux x86_64", "Apple Computer, Inc.", "Mobile/15E148 Safari/604.1", 1, "Meta+A"],
    ["touch iPad without Mobile UA", "Linux x86_64", "Apple Computer, Inc.", "Version/17.0 Safari/605.1", 5, "Meta+A"],
    ["Android touch", "Linux armv8l", "Google Inc.", "Mobile/15E148 Chrome/130", 5, "Control+A"],
    ["Safari with two touch points", "Linux x86_64", "Apple Computer, Inc.", "Safari/605.1", 2, "Control+A"],
    ["unknown desktop", "", "", "", 0, "Control+A"],
  ])("uses the editor shortcut for %s", (_label, platform, vendor, userAgent, maxTouchPoints, expected) => {
    expect(codeMirrorSelectAll({ platform: String(platform), vendor: String(vendor), userAgent: String(userAgent), maxTouchPoints: Number(maxTouchPoints) })).toBe(expected);
  });
});
