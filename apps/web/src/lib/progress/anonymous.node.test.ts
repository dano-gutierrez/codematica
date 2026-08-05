// @vitest-environment node

import { describe, expect, it } from "vitest";
import { addAnonymousProgressItem, clearAnonymousProgressItems, getAnonymousProgressItems } from "./anonymous";

describe("anonymous progress outside the browser", () => {
  it("keeps all storage helpers inert during server rendering", () => {
    expect(getAnonymousProgressItems()).toEqual([]);
    expect(() => addAnonymousProgressItem({
      input: { surface: "document", slug: "doc", pathSlug: "", status: "started", position: {} },
      display: { id: "doc", title: "Doc", summary: "Summary", href: "/doc", eyebrow: "Document", status: "started", lastSeenAt: "2026-08-05T00:00:00.000Z" },
    })).not.toThrow();
    expect(() => clearAnonymousProgressItems()).not.toThrow();
  });
});
