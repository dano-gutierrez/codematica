import { describe, expect, it } from "vitest";
import { formatPostSelection } from "./linkedin-formatting";

describe("LinkedIn plain-text formatting", () => {
  it("styles only the selection and preserves Unicode, links and tags", () => {
    expect(formatPostSelection("Hi world!", 3, 8, "bold")).toEqual({ text: "Hi 𝘄𝗼𝗿𝗹𝗱!", start: 3, end: 13 });
    expect(formatPostSelection("Hi 2 🚀 café https://a.test #Learn @Jane", 0, 42, "italic").text).toBe("𝘏𝘪 2 🚀 𝘤𝘢𝘧é https://a.test #Learn @Jane");
  });
  it("does not disguise unresolved factual placeholders", () => {
    expect(formatPostSelection("[VERIFY: metric]", 0, 16, "bold").text).toBe("[VERIFY: metric]");
  });
  it("changes styles without stacking, restores plain text and preserves cursor-only input", () => {
    expect(formatPostSelection("𝗛𝗶", 0, 4, "italic").text).toBe("𝘏𝘪");
    expect(formatPostSelection("𝘏𝘪 𝗯𝗼𝗹𝗱 𝟮", 0, 30, "plain").text).toBe("Hi bold 2");
    expect(formatPostSelection("Hi", 1, 1, "bold")).toEqual({ text: "Hi", start: 1, end: 1 });
  });
  it("formats whole selected lines as bullets, keeping adjacent lines intact", () => {
    expect(formatPostSelection("one\ntwo\nthree", 1, 7, "bullet")).toEqual({ text: "• one\n• two\nthree", start: 0, end: 11 });
    expect(formatPostSelection("• one\n• two", 0, 11, "bullet").text).toBe("one\ntwo");
    expect(formatPostSelection("", 0, 0, "bullet").text).toBe("• ");
  });
});
