import { z } from "zod";

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const finite = z.number().finite().nonnegative();
export const edgeSchema = z
  .object({ from: z.string(), to: z.string() })
  .strict();
export const boardSchema = z
  .object({
    nodes: z.array(id).max(16),
    edges: z.array(edgeSchema).max(64),
    invalidate: z.boolean().default(false),
    positions: z
      .record(
        z.string(),
        z.object({ x: z.number().finite(), y: z.number().finite() }),
      )
      .optional(),
    healthChecks: z.boolean().optional(),
    routing: z.enum(["round-robin", "capacity-weighted"]).optional(),
  })
  .strict();
const base = {
  id: z.enum(["main", "mastery-1", "mastery-2"]),
  title: z.string(),
  objective: z.string(),
  explanation: z.string(),
  hints: z.array(z.string()).min(3),
  seed: z.number().int(),
};
export const gridScenarioSchema = z.object({
  ...base,
  kind: z.literal("grid"),
  columns: z.number().int().min(2).max(8),
  rows: z.number().int().min(1).max(6),
  widths: z.array(z.number().min(200).max(900)).min(1),
  target: z.object({
    column: z.number().int().positive(),
    row: z.number().int().positive(),
    columnSpan: z.number().int().positive(),
    rowSpan: z.number().int().positive(),
  }),
  forbidden: z.array(z.number().int()),
  starter: z.string(),
  solution: z.string(),
  template: z.string(),
  expectedColumnFractions: z.array(z.number().positive()).optional(),
});
export const sqlScenarioSchema = z.object({
  ...base,
  kind: z.literal("sql"),
  zombies: z.array(
    z.object({
      id: z.number().int(),
      kind: z.string(),
      zone: z.string(),
      threat: z.number(),
      shield: z.number().nullable(),
    }),
  ),
  zones: z.array(
    z.object({ name: z.string(), evacuated: z.number().int().min(0).max(1) }),
  ),
  expectedIds: z.array(z.number().int()),
  starter: z.string(),
  solution: z.string(),
});
const port = z.object({
  id: z.string(),
  label: z.string(),
  direction: z.enum(["in", "out"]),
  signal: z.enum([
    "request",
    "response",
    "miss",
    "hit",
    "write",
    "invalidate",
    "command",
    "render",
  ]),
});
export const pipeScenarioSchema = z.object({
  ...base,
  kind: z.literal("pipes"),
  pieces: z.array(z.object({ id, label: z.string(), ports: z.array(port) })),
  required: z.array(edgeSchema).min(1),
  forbidden: z.array(edgeSchema),
  solution: z.array(edgeSchema),
  events: z
    .array(z.object({ label: z.string(), route: z.array(z.string()).min(2) }))
    .min(1),
});
export const componentSchema = z.object({
  id,
  label: z.string(),
  kind: z.enum(["client", "proxy", "api", "cache", "database"]),
  capacity: finite,
  latency: finite,
  cost: finite,
});
export const systemScenarioSchema = z.object({
  ...base,
  kind: z.literal("system"),
  population: z.number().int().positive(),
  rps: z.number().positive(),
  readRatio: z.number().min(0).max(1),
  hitRatio: z.number().min(0).max(1),
  maxStale: z.number().min(0).max(1),
  maxLatency: finite,
  budget: finite,
  requiredAvailability: z.boolean(),
  components: z.array(componentSchema),
  solution: boardSchema,
  waves: z
    .array(
      z.object({
        seconds: z.number().int().positive(),
        rps: z.number().positive(),
        failed: z.array(id),
      }),
    )
    .min(1),
});
export const gameScenarioSchema = z.discriminatedUnion("kind", [
  gridScenarioSchema,
  sqlScenarioSchema,
  pipeScenarioSchema,
  systemScenarioSchema,
]);
export const gameLevelSchema = z.object({
  id,
  order: z.number().int().positive(),
  title: z.string(),
  district: z.enum(["garden", "canal", "tower"]),
  kind: z.enum(["grid", "sql", "pipes", "system"]),
  mode: z.enum(["untimed", "defense"]),
  story: z.string(),
  sceneRef: z.enum(["garden", "canal", "tower"]),
  restoration: z.object({ landmark: z.boolean(), detail: z.string() }),
  lessonSlugs: z.array(z.string()).min(1),
  pathSlug: z.string().optional(),
  scenarios: z.array(gameScenarioSchema).length(3),
});
export const gameCampaignSchema = z
  .object({
    id,
    title: z.string(),
    summary: z.string(),
    version: z.literal(1),
    levels: z.array(gameLevelSchema).min(1),
    districts: z
      .array(
        z.object({
          id: z.enum(["garden", "canal", "tower"]),
          title: z.string(),
          sceneRef: z.enum(["garden", "canal", "tower"]),
          landmarkLevel: id,
        }),
      )
      .length(3),
  })
  .superRefine((c, ctx) => {
    const seen = new Set<string>();
    if (
      new Set(c.districts.map((d) => d.id)).size !== 3 ||
      c.districts.some(
        (d) =>
          !c.levels.some(
            (l) =>
              l.id === d.landmarkLevel &&
              l.district === d.id &&
              l.restoration.landmark,
          ),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "District landmarks must resolve",
      });
    c.levels.forEach((l, i) => {
      if (seen.has(l.id) || l.order !== i + 1)
        ctx.addIssue({
          code: "custom",
          message: "Levels require unique IDs and consecutive order",
          path: ["levels", i],
        });
      seen.add(l.id);
      const issue = (message: string) =>
        ctx.addIssue({ code: "custom", message, path: ["levels", i] });
      if (
        !c.districts.some(
          (d) => d.id === l.district && d.sceneRef === l.sceneRef,
        )
      )
        issue("District scene reference does not resolve");
      for (const s of l.scenarios) {
        if (s.kind === "grid") {
          const t = s.target;
          if (
            t.column + t.columnSpan - 1 > s.columns ||
            t.row + t.rowSpan - 1 > s.rows ||
            s.forbidden.some((n) => n < 0 || n >= s.rows * s.columns)
          )
            issue("Grid target or protected tile is outside the board");
          if (
            s.expectedColumnFractions &&
            s.expectedColumnFractions.length !== s.columns
          )
            issue("Responsive grid proportions must match columns");
        }
        if (s.kind === "sql") {
          const ids = new Set(s.zombies.map((z) => z.id));
          if (
            ids.size !== s.zombies.length ||
            s.expectedIds.some((id) => !ids.has(id))
          )
            issue("SQL target IDs must resolve to unique rows");
          if (
            new Set(s.zones.map((z) => z.name)).size !== s.zones.length ||
            s.zombies.some((z) => !s.zones.some((zone) => zone.name === z.zone))
          )
            issue("SQL zone references must resolve");
        }
        if (s.kind === "pipes") {
          const ports = s.pieces.flatMap((p) => p.ports),
            ids = new Set(ports.map((p) => p.id));
          if (
            ids.size !== ports.length ||
            new Set(s.pieces.map((p) => p.id)).size !== s.pieces.length
          )
            issue("Pipe pieces and ports must be unique");
          const edges = [...s.required, ...s.forbidden, ...s.solution];
          if (
            edges.some((e) => !ids.has(e.from) || !ids.has(e.to)) ||
            s.events.some(
              (e) =>
                e.route.length % 2 !== 0 || e.route.some((p) => !ids.has(p)),
            )
          )
            issue("Pipe edges and event routes must resolve");
        }
        if (s.kind === "system") {
          const ids = new Set(s.components.map((c) => c.id));
          if (
            ids.size !== s.components.length ||
            s.solution.nodes.some((n) => !ids.has(n)) ||
            s.waves.some((w) => w.failed.some((n) => !ids.has(n)))
          )
            issue("System component references must resolve");
        }
      }
      if (
        l.scenarios.some((s) => s.kind !== l.kind) ||
        new Set(l.scenarios.map((s) => s.id)).size !== 3
      )
        ctx.addIssue({
          code: "custom",
          message: "Three distinct scenarios must match the level kind",
          path: ["levels", i],
        });
      if (l.mode === "defense" && l.kind !== "system")
        ctx.addIssue({
          code: "custom",
          message: "Defense requires a workload simulation",
          path: ["levels", i],
        });
    });
  });
export type GameCampaign = z.infer<typeof gameCampaignSchema>;
export type GameLevel = z.infer<typeof gameLevelSchema>;
export type GameScenario = z.infer<typeof gameScenarioSchema>;
export type GridScenario = z.infer<typeof gridScenarioSchema>;
export type SqlScenario = z.infer<typeof sqlScenarioSchema>;
export type PipeScenario = z.infer<typeof pipeScenarioSchema>;
export type SystemScenario = z.infer<typeof systemScenarioSchema>;
export type GameBoard = z.infer<typeof boardSchema>;
export type GameEdge = z.infer<typeof edgeSchema>;
export type EvaluationResult = {
  passed: boolean;
  reasons: string[];
  events: string[];
  metrics?: Record<string, number>;
};
export type SceneSnapshot = {
  time: number;
  district: GameLevel["district"];
  restored: boolean;
  actorState: AnimationState;
  health: number;
  cosmetic: string;
};
export type AnimationState =
  | "idle"
  | "walk"
  | "work"
  | "attack"
  | "reaction"
  | "recovery"
  | "celebrate";
