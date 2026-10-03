import { getExerciseBySlug } from "@codematica/core";

// iPad's native back recognizer can start within the paper, not just its edge.
// These routes retain the persistent navigation and explicit notebook back button.
export function isNativeHandwritingRoute(pathname: string): boolean {
  if (
    pathname === "/languages/japanese/notebooks" ||
    pathname === "/languages/japanese/review/writing" ||
    pathname.startsWith("/languages/japanese/characters/") ||
    pathname.startsWith("/languages/japanese/vocabulary/")
  ) return true;
  return pathname.startsWith("/practice/") &&
    getExerciseBySlug(pathname.slice("/practice/".length))?.type === "writing";
}
