import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ContentSource } from "@/lib/content/schema";
import { SourceReferences } from "./SourceReferences";

const source: ContentSource = {
  id: "harvard-volume-one",
  title: "Machine Learning Systems, Volume I",
  provider: "Harvard University",
  url: "https://mlsysbook.ai/vol1/",
  attribution: "Vijay Janapa Reddi and the ML Systems book contributors",
  license: { name: "CC BY-NC-SA 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
  lastVerifiedAt: "2026-08-07",
  upstream: { version: "v0.7.1", maturity: "published" },
  sourcePath: "content/sources/harvard-ml-systems.json",
  contentHash: "source-reference-test-hash",
};

describe("SourceReferences", () => {
  it("renders nothing without authoritative sources", () => {
    const { container } = render(<SourceReferences sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links to the authoritative source with attribution and version", () => {
    render(<SourceReferences sources={[source]} title="Read upstream first" />);

    expect(screen.getByRole("heading", { name: "Read upstream first" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Machine Learning Systems, Volume I/i })).toHaveAttribute("href", source.url);
    expect(screen.getByTestId("source-references")).toHaveTextContent(/v0\.7\.1/i);
  });
});
