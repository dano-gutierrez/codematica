import { isNativeHandwritingRoute } from "../lib/handwriting-navigation";

it.each([
  "/languages/japanese/notebooks",
  "/languages/japanese/review/writing",
  "/languages/japanese/characters/hiragana-a",
  "/languages/japanese/vocabulary/tsuki",
  "/practice/languages/japanese-hiragana-vowels-writing",
])("protects handwriting on %s from native swipe-back", (path) => {
  expect(isNativeHandwritingRoute(path)).toBe(true);
});
it.each([
  "/", "/languages/japanese", "/languages/japanese/review",
  "/languages/japanese/review/flashcards", "/practice", "/practice/unknown",
  "/practice/programming/bfs-dfs-fundamentals-questionnaire",
  "/docs/languages/japanese-writing-systems", "/languages/japanese/notebooks-extra",
])("retains native swipe-back on %s", (path) => {
  expect(isNativeHandwritingRoute(path)).toBe(false);
});
