import { clampPosition } from "./board";
import {
  createAttempt,
  evaluatePipes,
  evaluateSystemScenarios,
  evaluateSystem,
  transitionAttempt,
  waveAt,
  toggleEdge,
  type GameAttempt,
} from "./engine";
import type {
  EvaluationResult,
  GameBoard,
  GameEdge,
  GameLevel,
  GameScenario,
} from "./schema";
export type SessionSnapshot = {
  scenario: GameScenario;
  attempt: GameAttempt;
  code: string;
  board: GameBoard;
  edges: GameEdge[];
  hints: number;
  failures: number;
  result: EvaluationResult | null;
  revision: number;
};
/** Kept in memory across lesson navigation; process restarts begin at the briefing. */
export class GameSession {
  private listeners = new Set<() => void>();
  private state: SessionSnapshot;
  private pendingAward: {
    scenario: string;
    mode: "standard" | "assisted";
    at: Date;
  } | null = null;
  constructor(readonly level: GameLevel) {
    this.state = this.initial(level.scenarios[0]);
  }
  private initial(scenario: GameScenario): SessionSnapshot {
    return {
      scenario,
      attempt: createAttempt(this.level.mode),
      code:
        scenario.kind === "grid" || scenario.kind === "sql"
          ? scenario.starter
          : "",
      board: { nodes: [], edges: [], invalidate: false },
      edges: [],
      hints: 0,
      failures: 0,
      result: null,
      revision: 0,
    };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<SessionSnapshot>) {
    if (patch.attempt?.phase === "won" && this.state.attempt.phase !== "won")
      this.pendingAward = {
        scenario: this.state.scenario.id,
        mode: patch.attempt.assisted ? "assisted" : "standard",
        at: new Date(),
      };
    else if (patch.attempt && patch.attempt.phase !== "won")
      this.pendingAward = null;
    this.state = { ...this.state, ...patch };
    for (const fn of this.listeners) fn();
  }
  takeAward() {
    const pending = this.pendingAward;
    this.pendingAward = null;
    return pending;
  }
  get editable() {
    return !["paused", "won", "lost"].includes(this.state.attempt.phase);
  }
  choose(id: string) {
    const scenario = this.level.scenarios.find((s) => s.id === id);
    if (scenario) this.update(this.initial(scenario));
  }
  reset() {
    const assisted = this.state.attempt.assisted;
    this.update({
      ...this.initial(this.state.scenario),
      attempt: { ...createAttempt(this.level.mode), assisted },
    });
  }
  edit(code: string) {
    if (this.editable)
      this.update({ code, revision: this.state.revision + 1, result: null });
  }
  place(id: string) {
    if (!this.editable) return;
    const b = this.state.board;
    const nodes = b.nodes.includes(id)
      ? b.nodes.filter((n) => n !== id)
      : [...b.nodes, id];
    this.update({
      board: {
        ...b,
        nodes,
        edges: b.edges.filter(
          (e) => nodes.includes(e.from) && nodes.includes(e.to),
        ),
      },
      result: null,
    });
  }
  connect(edge: GameEdge) {
    if (!this.editable) return;
    this.update(
      this.state.scenario.kind === "pipes"
        ? { edges: toggleEdge(this.state.edges, edge), result: null }
        : {
            board: {
              ...this.state.board,
              edges: toggleEdge(this.state.board.edges, edge),
            },
            result: null,
          },
    );
  }
  invalidate(value: boolean) {
    if (this.editable)
      this.update({
        board: { ...this.state.board, invalidate: value },
        result: null,
      });
  }
  move(id: string, x: number, y: number) {
    if (this.editable && this.state.board.nodes.includes(id))
      this.update({
        board: {
          ...this.state.board,
          positions: {
            ...this.state.board.positions,
            [id]: clampPosition(x, y),
          },
        },
      });
  }
  configure(patch: Pick<GameBoard, "routing" | "healthChecks">) {
    if (this.editable)
      this.update({ board: { ...this.state.board, ...patch }, result: null });
  }
  hint() {
    this.update({ hints: Math.min(3, this.state.hints + 1) });
  }
  pause() {
    this.update({
      attempt: transitionAttempt(this.state.attempt, { type: "pause" }),
    });
  }
  resume() {
    this.update({
      attempt: transitionAttempt(this.state.attempt, { type: "resume" }),
    });
  }
  assist() {
    this.update({
      ...this.initial(this.state.scenario),
      attempt: { ...createAttempt(this.level.mode), assisted: true },
    });
  }
  submit(result: EvaluationResult) {
    if (!this.editable) return;
    this.update({
      result,
      failures: this.state.failures + (result.passed ? 0 : 1),
      attempt: result.passed
        ? transitionAttempt(this.state.attempt, { type: "win" })
        : this.state.attempt,
    });
  }
  run() {
    if (!this.editable) return;
    const s = this.state.scenario;
    if (s.kind === "pipes") this.submit(evaluatePipes(s, this.state.edges));
    if (s.kind === "system") {
      if (this.level.mode === "defense" && !this.state.attempt.assisted) {
        this.update({
          attempt: transitionAttempt(this.state.attempt, { type: "start" }),
        });
        return;
      }
      this.submit(evaluateSystemScenarios(s, this.state.board));
    }
  }
  tick() {
    const { scenario: s, attempt: a, board } = this.state;
    if (s.kind !== "system" || a.phase !== "running" || a.assisted) return;
    const wave = waveAt(s, a.elapsed);
    const result = evaluateSystem(s, board, wave.rps, wave.failed);
    const attempt = transitionAttempt(a, {
      type: "tick",
      elapsed: 1,
      damage: result.passed ? 0 : 12,
    });
    const complete =
      attempt.elapsed >= s.waves.reduce((n, w) => n + w.seconds, 0);
    const final = complete ? evaluateSystemScenarios(s, board) : result;
    this.update({
      attempt:
        attempt.phase === "lost"
          ? attempt
          : complete
            ? { ...attempt, phase: final.passed ? "won" : "lost" }
            : attempt,
      result: final,
      failures:
        this.state.failures +
        (attempt.phase === "lost" || (complete && !final.passed) ? 1 : 0),
    });
  }
}
const sessions = new Map<string, GameSession>();
export function getGameSession(campaign: string, level: GameLevel) {
  const key = `${campaign}/${level.id}`;
  let session = sessions.get(key);
  if (!session) {
    session = new GameSession(level);
    sessions.set(key, session);
  }
  return session;
}
