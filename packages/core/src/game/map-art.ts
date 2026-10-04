/** Art capacity is independent of the authored campaign and its awards. Top to bottom. */
export const MAP_CAPACITY = 50;
export const MAP_PANELS = [
  { id: "summit-0", first: 46, last: 50, name: "The quiet summit" },
  { id: "summit-1", first: 41, last: 45, name: "Crystal terraces" },
  { id: "summit-2", first: 37, last: 40, name: "The weather station" },
  { id: "woodland-0", first: 33, last: 36, name: "The old reservoir" },
  { id: "woodland-1", first: 29, last: 32, name: "Lantern woods" },
  { id: "woodland-2", first: 25, last: 28, name: "Root bridges" },
  { id: "highlands-0", first: 21, last: 24, name: "The observatory" },
  { id: "highlands-1", first: 17, last: 20, name: "Glasshouse heights" },
  { id: "highlands-2", first: 13, last: 16, name: "The hanging aqueduct" },
  {
    id: "city-0",
    first: 9,
    last: 12,
    name: "The signal tower",
    district: "tower",
  },
  {
    id: "city-1",
    first: 5,
    last: 8,
    name: "The canal works",
    district: "canal",
  },
  {
    id: "city-2",
    first: 1,
    last: 4,
    name: "The garden outpost",
    district: "garden",
  },
] as const;
export type MapPanel = (typeof MAP_PANELS)[number];
/** No modulo: long-map scrolling must never snap a layer at a district boundary. */
export function parallaxOffset(
  scroll: number,
  top: number,
  height: number,
  speed: number,
  reduced: boolean,
) {
  "worklet";
  return reduced
    ? 0
    : Math.max(-48, Math.min(48, (scroll - top + height / 2) * speed));
}
