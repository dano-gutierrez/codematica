import type {
  EvaluationResult,
  GameBoard,
  GameEdge,
  PipeScenario,
  SystemScenario,
} from "./schema";

export type GameAttempt = {
  phase: "briefing" | "running" | "paused" | "won" | "lost";
  mode: "untimed" | "defense";
  elapsed: number;
  health: number;
  input: string;
  assisted: boolean;
};
export type AttemptAction =
  | { type: "start" | "pause" | "resume" | "win" | "lose" | "reset" }
  | { type: "edit"; input: string }
  | { type: "assist" }
  | { type: "tick"; elapsed: number; damage?: number };
export function createAttempt(mode: GameAttempt["mode"]): GameAttempt {
  return {
    phase: "briefing",
    mode,
    elapsed: 0,
    health: 100,
    input: "",
    assisted: false,
  };
}
export function transitionAttempt(
  a: GameAttempt,
  e: AttemptAction,
): GameAttempt {
  if (e.type === "reset")
    return { ...createAttempt(a.mode), assisted: a.assisted };
  if (e.type === "assist") return { ...createAttempt(a.mode), assisted: true };
  if (e.type === "pause")
    return a.phase === "running" ? { ...a, phase: "paused" } : a;
  if (e.type === "resume")
    return a.phase === "paused" ? { ...a, phase: "running" } : a;
  if (e.type === "start")
    return a.phase === "briefing" ? { ...a, phase: "running" } : a;
  if (e.type === "edit")
    return a.phase === "paused" || a.phase === "won" || a.phase === "lost"
      ? a
      : { ...a, input: e.input };
  if (e.type === "tick") {
    if (a.phase !== "running" || a.assisted || a.mode !== "defense") return a;
    const health = Math.max(0, a.health - Math.max(0, e.damage ?? 0));
    return {
      ...a,
      elapsed: a.elapsed + Math.max(0, e.elapsed),
      health,
      phase: health === 0 ? "lost" : a.phase,
    };
  }
  if (e.type === "win")
    return a.phase === "paused" ? a : { ...a, phase: "won" };
  if (e.type === "lose") return { ...a, phase: "lost" };
  return a;
}
const edgeKey = (e: GameEdge) => `${e.from}>${e.to}`;
export function toggleEdge(edges: GameEdge[], edge: GameEdge) {
  return edges.some((e) => edgeKey(e) === edgeKey(edge))
    ? edges.filter((e) => edgeKey(e) !== edgeKey(edge))
    : [...edges, edge];
}
export function evaluatePipes(
  s: PipeScenario,
  edges: GameEdge[],
): EvaluationResult {
  const reasons: string[] = [];
  const keys = new Set(edges.map(edgeKey));
  const ports = s.pieces.flatMap((p) => p.ports);
  for (const edge of edges) {
    const from = ports.find((p) => p.id === edge.from),
      to = ports.find((p) => p.id === edge.to);
    if (
      !from ||
      !to ||
      from.direction !== "out" ||
      to.direction !== "in" ||
      from.signal !== to.signal
    )
      reasons.push(`Incompatible connection: ${edge.from} → ${edge.to}.`);
    if (
      !s.required.some((e) => edgeKey(e) === edgeKey(edge)) &&
      !s.forbidden.some((e) => edgeKey(e) === edgeKey(edge))
    )
      reasons.push(
        `Unexpected delivery: ${edge.from} → ${edge.to} sends an event to the wrong destination.`,
      );
    if (s.forbidden.some((e) => edgeKey(e) === edgeKey(edge)))
      reasons.push(
        `Feedback loop: ${edge.from} → ${edge.to} turns rendering into another command.`,
      );
  }
  for (const e of s.required)
    if (!keys.has(edgeKey(e))) reasons.push(`Missing ${e.from} → ${e.to}.`);
  // Each event is an ordered list of output/input hops, not an undirected drawing.
  const events = s.events.map((event) => {
    for (let i = 0; i < event.route.length; i += 2)
      if (!keys.has(`${event.route[i]}>${event.route[i + 1]}`))
        return `${event.label}: stopped at ${event.route[i]}.`;
    return `${event.label}: completed.`;
  });
  return { passed: reasons.length === 0, reasons, events };
}
export function evaluateSystem(
  s: SystemScenario,
  board: GameBoard,
  rps = s.rps,
  failed: string[] = [],
): EvaluationResult {
  const reasons: string[] = [];
  const nodes = s.components.filter((c) => board.nodes.includes(c.id));
  const nodeIds = new Set(nodes.map((c) => c.id));
  if (
    new Set(board.nodes).size !== board.nodes.length ||
    board.nodes.some((id) => !s.components.some((c) => c.id === id))
  )
    reasons.push("Place only available components, once each.");
  const has = (from: string, to: string) =>
    board.edges.some(
      (e) =>
        e.from === from && e.to === to && nodeIds.has(from) && nodeIds.has(to),
    );
  const clients = nodes.filter(
    (c) => c.kind === "client" && !failed.includes(c.id),
  );
  const proxies = nodes.filter(
    (c) =>
      c.kind === "proxy" &&
      !failed.includes(c.id) &&
      clients.some((x) => has(x.id, c.id)),
  );
  const apis = nodes.filter(
    (c) =>
      c.kind === "api" &&
      (clients.some((x) => has(x.id, c.id)) ||
        proxies.some((p) => has(p.id, c.id))),
  );
  const healthy = apis.filter((a) => !failed.includes(a.id));
  const databases = nodes.filter((c) => c.kind === "database");
  const db = databases.find((c) => !failed.includes(c.id));
  if (clients.length === 0 || !db || healthy.length === 0)
    reasons.push("Connect a client to a healthy API and a database.");
  if (databases.length > 1)
    reasons.push(
      "Choose one database tier; replication is not configured by drawing two storage nodes.",
    );
  const allowed = new Set([
    "client:api",
    "client:proxy",
    "proxy:api",
    "api:database",
    "api:cache",
  ]);
  for (const edge of board.edges) {
    const from = nodes.find((n) => n.id === edge.from),
      to = nodes.find((n) => n.id === edge.to);
    if (!from || !to || !allowed.has(`${from.kind}:${to.kind}`))
      reasons.push(`Invalid request route: ${edge.from} → ${edge.to}.`);
  }
  if (
    apis.length > 1 &&
    (!proxies.some((p) => apis.every((a) => has(p.id, a.id))) ||
      clients.some((c) => apis.some((a) => has(c.id, a.id))))
  )
    reasons.push(
      "Multiple APIs need an explicit load-balancing route; direct routes bypass its distribution.",
    );
  if (proxies.length > 1)
    reasons.push(
      "Choose one balancer tier; multiple independent ingress routes have no traffic split configured.",
    );
  if (s.requiredAvailability && (apis.length < 2 || proxies.length === 0))
    reasons.push(
      "This scenario needs redundant APIs behind a health-checking balancer.",
    );
  const healthChecks = board.healthChecks !== false && proxies.length > 0;
  const routed = healthChecks ? healthy : apis;
  const totalCapacity = routed.reduce((n, c) => n + c.capacity, 0);
  const cache = nodes.find((c) => c.kind === "cache" && !failed.includes(c.id));
  let throughput = 0,
    databaseDemand = 0,
    cacheDemand = 0,
    stale = 0,
    queue = 0,
    latency = 0;
  for (const api of routed) {
    const offered =
      rps *
      (board.routing === "capacity-weighted"
        ? totalCapacity
          ? api.capacity / totalCapacity
          : 0
        : 1 / routed.length);
    if (failed.includes(api.id)) {
      reasons.push(
        `${api.label} is unhealthy but still receives ${Math.round(offered)} requests/sec. Enable health checks.`,
      );
      continue;
    }
    if (!db || !has(api.id, db.id))
      reasons.push(`${api.label} has no database route.`);
    const cached = !!cache && has(api.id, cache.id);
    const demand = offered * (1 - (cached ? s.readRatio * s.hitRatio : 0));
    databaseDemand += demand;
    if (cached) {
      cacheDemand +=
        offered * s.readRatio +
        offered * s.readRatio * (1 - s.hitRatio) +
        (board.invalidate ? offered * (1 - s.readRatio) : 0);
      if (!board.invalidate) stale += (offered * (1 - s.readRatio)) / rps;
    }
    const backlog = Math.max(0, offered - api.capacity);
    queue += backlog;
    if (backlog > 0)
      reasons.push(
        `${api.label} receives ${Math.round(offered)}/sec but serves ${api.capacity}/sec; its queue grows by ${Math.ceil(backlog)} each second.`,
      );
    throughput +=
      db && has(api.id, db.id) ? Math.min(offered, api.capacity) : 0;
    // Worst request-path latency includes a cache miss and one second of queue buildup.
    latency = Math.max(
      latency,
      api.latency +
        (db?.latency ?? 0) +
        (proxies[0]?.latency ?? 0) +
        (cached ? cache!.latency : 0) +
        (api.capacity ? (backlog / api.capacity) * 1000 : 1000),
    );
  }
  const cost = nodes.reduce((n, c) => n + c.cost, 0),
    proxyCapacity = proxies[0]?.capacity ?? Infinity;
  if (cost > s.budget)
    reasons.push(`Cost ${cost} exceeds the ${s.budget} unit budget.`);
  if (proxyCapacity < rps) reasons.push("The balancer is overloaded.");
  if (databaseDemand > (db?.capacity ?? 0))
    reasons.push(
      `Database demand ${Math.round(databaseDemand)}/sec exceeds storage capacity ${db?.capacity ?? 0}/sec.`,
    );
  if (cache && cacheDemand > cache.capacity)
    reasons.push(
      `The cache is overloaded: ${Math.round(cacheDemand)} operations/sec exceeds ${cache.capacity}/sec.`,
    );
  if (stale > s.maxStale)
    reasons.push(
      "Writes leave stale targeting data in the cache. Enable invalidation.",
    );
  if (latency > s.maxLatency)
    reasons.push(
      `Modeled latency ${Math.round(latency)} ms exceeds ${s.maxLatency} ms.`,
    );
  throughput = Math.min(
    throughput,
    proxyCapacity,
    rps *
      (databaseDemand ? Math.min(1, (db?.capacity ?? 0) / databaseDemand) : 1),
    rps * (cacheDemand ? Math.min(1, (cache?.capacity ?? 0) / cacheDemand) : 1),
  );
  return {
    passed: reasons.length === 0,
    reasons,
    events: [
      `Offered ${Math.round(rps)}/sec; served ${Math.round(throughput)}/sec.`,
      `Database receives ${Math.round(databaseDemand)} operations/sec; queue growth ${Math.ceil(queue)}/sec.`,
      ...failed.map(
        (id) =>
          `${id} is unavailable${healthChecks && apis.some((a) => a.id === id) ? "; health checks remove it from routing" : ""}.`,
      ),
    ],
    metrics: {
      rps,
      throughput,
      cost,
      latency,
      databaseDemand,
      cacheDemand,
      stale,
      queue,
    },
  };
}
export function evaluateSystemScenarios(s: SystemScenario, board: GameBoard) {
  const checks = [
    evaluateSystem(s, board),
    ...s.waves.map((w) => evaluateSystem(s, board, w.rps, w.failed)),
  ];
  return {
    passed: checks.every((c) => c.passed),
    reasons: [...new Set(checks.flatMap((c) => c.reasons))],
    events: checks.flatMap((c) => c.events),
    metrics: checks[0].metrics,
  };
}
export function waveAt(s: SystemScenario, elapsed: number) {
  let until = 0;
  const wave =
    s.waves.find((w) => {
      until += w.seconds;
      return elapsed < until;
    }) ?? s.waves[s.waves.length - 1];
  // Stateless seeded samples make dropped rendering frames irrelevant to traffic.
  const seed =
    (Math.imul(s.seed + Math.floor(elapsed), 1664525) + 1013904223) >>> 0;
  const fraction = (seed % 1009) / 1009;
  return { ...wave, rps: Math.round(wave.rps * (0.95 + fraction * 0.05)) };
}
export { sampleAnimation } from "./animation";
