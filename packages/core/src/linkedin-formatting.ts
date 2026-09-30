export type PostFormat = "bold" | "italic" | "plain" | "bullet";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const bold = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(0x1d5d4 + i)).join("") + Array.from({ length: 26 }, (_, i) => String.fromCodePoint(0x1d5ee + i)).join("") + Array.from({ length: 10 }, (_, i) => String.fromCodePoint(0x1d7ec + i)).join("");
const italic = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(0x1d608 + i)).join("") + Array.from({ length: 26 }, (_, i) => String.fromCodePoint(0x1d622 + i)).join("") + "0123456789";
const styles = { bold: Array.from(bold), italic: Array.from(italic), plain: Array.from(alphabet) };
const plain = new Map([...Array.from(bold), ...Array.from(italic)].map((char, i) => [char, alphabet[i % alphabet.length]]));

/** Selection offsets use UTF-16, matching textarea, TextInput and Buffer. */
export function formatPostSelection(text: string, start: number, end: number, format: PostFormat) {
  start = Math.max(0, Math.min(text.length, start));
  end = Math.max(start, Math.min(text.length, end));
  if (format === "bullet") {
    start = text.lastIndexOf("\n", start - 1) + 1;
    const next = text.indexOf("\n", Math.max(start, end - 1));
    end = next < 0 ? text.length : next;
    const lines = text.slice(start, end).split("\n");
    const remove = lines.every((line) => line.startsWith("• "));
    const replacement = lines.map((line) => remove ? line.slice(2) : `• ${line.replace(/^• /, "")}`).join("\n");
    return { text: text.slice(0, start) + replacement + text.slice(end), start, end: start + replacement.length };
  }
  // Protect links, tags and unresolved facts, including partial selections.
  const protectedRanges = [...text.matchAll(/https?:\/\/\S+|[#@][\p{L}\p{N}_]+|\[(?:ADD|VERIFY|TODO)\b[^\]]*\]/giu)].map((match) => [match.index, match.index + match[0].length]);
  let offset = start;
  const replacement = Array.from(text.slice(start, end)).map((char) => {
    const protectedChar = protectedRanges.some(([a, b]) => offset >= a && offset < b);
    offset += char.length;
    const normalized = plain.get(char) ?? char;
    const index = alphabet.indexOf(normalized);
    return protectedChar || index < 0 ? char : styles[format][index];
  }).join("");
  return { text: text.slice(0, start) + replacement + text.slice(end), start, end: start + replacement.length };
}
