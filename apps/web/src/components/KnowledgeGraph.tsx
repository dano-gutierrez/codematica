"use client";
import { useEffect, useRef, useState } from "react";
import type { KnowledgeResource, KnowledgeRelationship } from "@codematica/core/knowledge";

export function KnowledgeGraph({ resources, relationships, onSelect }: { resources: KnowledgeResource[]; relationships: KnowledgeRelationship[]; onSelect: (resource: KnowledgeResource) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false; let dispose: (() => void) | undefined;
    void import("cytoscape").then(({ default: cytoscape }) => {
      if (cancelled || !host.current) return;
      const shown = resources.slice(0,100);
      const ids = new Set(shown.map(r => r.id));
      const graph = cytoscape({ container: host.current, elements: [
        ...shown.map(r => ({ data: { id: r.id, label: r.title, color: r.visibility === "private" ? "#a34b00" : r.kind === "concept" ? "#6650a1" : "#007c78" } })),
        ...relationships.filter(e => ids.has(e.source) && ids.has(e.target)).map(e => ({ data: { id: "edge:" + e.id, source: e.source, target: e.target, label: e.type, inferred: e.provenance === "inferred" } })),
      ], style: [{ selector: "node", style: { label: "data(label)", "background-color": "data(color)", "font-size": 11, color: "#263238", "text-wrap": "ellipsis", "text-max-width": "110px" } }, { selector: "edge", style: { width: 1.5, "line-color": "#7d8b94", "target-arrow-color": "#7d8b94", "target-arrow-shape": "triangle", "curve-style": "bezier" } }, { selector: "edge[inferred = true]", style: { "line-style": "dashed", "line-color": "#6650a1" } }], layout: { name: "cose", animate: false }, minZoom: .2, maxZoom: 3 });
      graph.on("tap", "node", event => { const r = resources.find(v => v.id === event.target.id()); if (r) onSelect(r); });
      dispose = () => graph.destroy();
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; dispose?.(); };
  }, [resources, relationships, onSelect]);
  return <div><p className="mb-2 text-sm text-[#46535d]">Drag to pan, scroll to zoom, select a node to inspect. Dashed links are inferred. The table below provides keyboard access.</p>{failed ? <p role="status">Graph rendering unavailable. Use the resource table.</p> : <div ref={host} role="img" aria-label="Knowledge relationships; use the resource table for keyboard access" className="h-96 rounded-xl border border-[#7d8b94] bg-[#f6fbfc]" data-testid="knowledge-graph" />}</div>;
}
