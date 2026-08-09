import { describe, expect, it } from "vitest";
import { convertJapaneseInput, romajiToHiragana } from "./index";

describe("offline Japanese IME", () => {
  it("converts romaji aliases, doubled consonants, syllabic n, and punctuation", () => {
    expect(romajiToHiragana("konbanha")).toBe("こんばんは");
    expect(romajiToHiragana("kitte")).toBe("きって");
    expect(romajiToHiragana("hon")).toBe("ほん");
    expect(romajiToHiragana("sushi, kudasai.")).toBe("すし、 ください。");
  });

  it("ranks curriculum Japanese while retaining a kana fallback", () => {
    expect(convertJapaneseInput("watashi wa gakusei desu").candidates).toEqual(expect.arrayContaining(["私は学生です", "わたしはがくせいです"]));
    expect(convertJapaneseInput("kyou wa ame desu").candidates[0]).toBe("今日は雨です");
  });

  it("preserves direct Japanese and incomplete romaji safely", () => {
    expect(convertJapaneseInput("私は学生です").candidates).toEqual(["私は学生です"]);
    expect(romajiToHiragana("k")).toBe("k");
  });
});
