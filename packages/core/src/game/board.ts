export type BoardPositions = Record<string, { x: number; y: number }>;
export function clampPosition(x: number, y: number) {
  return {
    x: Math.min(0.86, Math.max(0.14, Number.isFinite(x) ? x : 0.5)),
    y: Math.min(0.85, Math.max(0.15, Number.isFinite(y) ? y : 0.5)),
  };
}
export function boardPosition(
  id: string,
  nodes: string[],
  positions?: BoardPositions,
) {
  const position = positions?.[id];
  if (position) return clampPosition(position.x, position.y);
  const i = Math.max(0, nodes.indexOf(id));
  return { x: [0.18, 0.5, 0.82][i % 3], y: 0.22 + Math.floor(i / 3) * 0.28 };
}
