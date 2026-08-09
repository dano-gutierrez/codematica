import commonDictionary from "../generated/japanese-ime-dictionary.json";

export type JapaneseImeResult = { source: string; reading: string; candidates: string[] };

const kana: Record<string, string> = {
  kya: "きゃ", kyu: "きゅ", kyo: "きょ", sha: "しゃ", shu: "しゅ", sho: "しょ", sya: "しゃ", syu: "しゅ", syo: "しょ",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ", tya: "ちゃ", tyu: "ちゅ", tyo: "ちょ", nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ", mya: "みゃ", myu: "みゅ", myo: "みょ", rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ", ja: "じゃ", ju: "じゅ", jo: "じょ", jya: "じゃ", jyu: "じゅ", jyo: "じょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ", pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ", shi: "し", chi: "ち", tsu: "つ",
  a: "あ", i: "い", u: "う", e: "え", o: "お", ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  sa: "さ", si: "し", su: "す", se: "せ", so: "そ", ta: "た", ti: "ち", tu: "つ", te: "て", to: "と",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の", ha: "は", hi: "ひ", fu: "ふ", hu: "ふ", he: "へ", ho: "ほ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も", ya: "や", yu: "ゆ", yo: "よ", ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  wa: "わ", wo: "を", ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご", za: "ざ", ji: "じ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  da: "だ", de: "で", do: "ど", ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ", pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
};

const phraseCandidates: Record<string, string[]> = {
  "わたし は がくせい です": ["私は学生です"],
  "きょう は あめ です": ["今日は雨です"],
  "わたし は せんせい です": ["私は先生です"],
  "これ は ほん です": ["これは本です"],
  "にほんご を べんきょう します": ["日本語を勉強します"],
};

const wordCandidates: Record<string, string> = {
  わたし: "私", がくせい: "学生", せんせい: "先生", きょう: "今日", あめ: "雨", ほん: "本", にほんご: "日本語", べんきょう: "勉強",
  がっこう: "学校", でんしゃ: "電車", えき: "駅", じかん: "時間", ともだち: "友達", かぞく: "家族", たべます: "食べます", のみます: "飲みます",
};
const jmdictCandidates = commonDictionary as Record<string, string[]>;

export function romajiToHiragana(value: string) {
  const source = value.normalize("NFKC").toLowerCase().replace(/,/g, "、").replace(/\./g, "。");
  let output = "";
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (!char || !/[a-z]/.test(char)) { output += char ?? ""; index += 1; continue; }
    const next = source[index + 1];
    if (char === next && /[bcdfghjklmpqrstvwxyz]/.test(char) && char !== "n") { output += "っ"; index += 1; continue; }
    if (char === "n" && (!next || next === " " || next === "'" || !/[aeiouy]/.test(next))) { output += "ん"; index += next === "'" ? 2 : 1; continue; }
    let matched = false;
    for (const size of [3, 2, 1]) {
      const part = source.slice(index, index + size);
      if (kana[part]) { output += kana[part]; index += size; matched = true; break; }
    }
    if (!matched) { output += char; index += 1; }
  }
  return output;
}

function containsJapanese(value: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(value);
}

export function convertJapaneseInput(value: string): JapaneseImeResult {
  const source = value.normalize("NFKC").trim();
  if (!source) return { source, reading: "", candidates: [] };
  if (containsJapanese(source) && !/[a-z]/i.test(source)) return { source, reading: source, candidates: [source] };
  const particleAwareSource = source
    .split(/\s+/)
    .map((token, index) => index > 0 && token.toLowerCase() === "wa" ? "ha" : index > 0 && token.toLowerCase() === "e" ? "he" : token)
    .join(" ");
  const reading = romajiToHiragana(particleAwareSource).replace(/\s+/g, " ").trim();
  const kanaFallback = reading.replace(/\s+/g, "");
  const exact = phraseCandidates[reading] ?? [];
  const words = reading.split(" ");
  const composed = words.map((word) => wordCandidates[word] ?? jmdictCandidates[word]?.[0] ?? word).join("");
  const alternatives = words.flatMap((word, wordIndex) => (jmdictCandidates[word] ?? []).slice(1, 4).map((candidate) => words.map((part, index) => index === wordIndex ? candidate : wordCandidates[part] ?? jmdictCandidates[part]?.[0] ?? part).join("")));
  return { source, reading, candidates: [...new Set([...exact, composed, ...alternatives, kanaFallback])].slice(0, 8) };
}
