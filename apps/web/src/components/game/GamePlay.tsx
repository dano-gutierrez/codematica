"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Star,
} from "lucide-react";
import {
  getGameSession,
  gameSandboxHtml,
  awardScenario,
  awardKey,
  isLevelUnlocked,
  type GameCampaign,
  type GameLevel,
  type EvaluationResult,
} from "@codematica/core/game";
import { webGameStore } from "@/lib/game/store";
import { GameBoard } from "./GameBoard";
import { GameScene } from "./GameScene";
export function GamePlay({
  campaign,
  level,
}: {
  campaign: GameCampaign;
  level: GameLevel;
}) {
  const [store] = useState(() => webGameStore(campaign)),
    [session] = useState(() => getGameSession(campaign.id, level));
  const storageStatus = useSyncExternalStore(
    store.subscribe,
    store.getStatus,
    store.getStatus,
  );
  const progress = useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot,
    ),
    s = useSyncExternalStore(
      session.subscribe,
      session.getSnapshot,
      session.getSnapshot,
    );
  const [loaded, setLoaded] = useState(false),
    [from, setFrom] = useState(""),
    [frame, setFrame] = useState<{ html: string; nonce: string } | null>(null),
    [busy, setBusy] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null),
    run = useRef(0),
    expectedNonce = useRef<string | null>(null);
  useEffect(() => {
    void store.load().finally(() => setLoaded(true));
    return () => session.pause();
  }, [store, session]);
  useEffect(() => {
    const timer = setInterval(() => session.tick(), 1000);
    const pause = () => {
      if (document.hidden) session.pause();
    };
    document.addEventListener("visibilitychange", pause);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", pause);
    };
  }, [session]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.source !== iframe.current?.contentWindow ||
        event.data?.channel !== "codematica-game" ||
        event.data.nonce !== expectedNonce.current
      )
        return;
      const result = event.data.result as EvaluationResult;
      if (typeof result?.passed !== "boolean" || !Array.isArray(result.reasons))
        return;
      setBusy(false);
      session.submit(result);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [session]);
  useEffect(() => {
    if (!loaded || s.attempt.phase !== "won") return;
    const award = session.takeAward();
    if (award)
      void store.save(
        awardScenario(
          store.getSnapshot(),
          campaign,
          level.id,
          award.scenario,
          award.mode,
          award.at,
        ),
      );
  }, [loaded, s.attempt.phase, session, store, campaign, level.id]);
  useEffect(() => {
    if (!busy) return;
    const timeout = setTimeout(() => {
      setBusy(false);
      setFrame(null);
      session.submit({
        passed: false,
        reasons: ["The local runner timed out. Retry your solution."],
        events: [],
      });
    }, 10000);
    return () => clearTimeout(timeout);
  }, [busy, session]);
  const execute = async () => {
    if (busy || !session.editable) return;
    if (s.scenario.kind === "grid" || s.scenario.kind === "sql") {
      setBusy(true);
      const id = ++run.current;
      try {
        const worker =
          s.scenario.kind === "sql"
            ? await fetch("/game/sql-worker.js").then((r) => {
                if (!r.ok) throw new Error();
                return r.text();
              })
            : "";
        if (id !== run.current) return;
        const nonce = crypto.randomUUID();
        expectedNonce.current = nonce;
        setFrame({
          html: gameSandboxHtml(s.scenario, s.code, worker, nonce),
          nonce,
        });
      } catch {
        setBusy(false);
        session.submit({
          passed: false,
          reasons: ["The local runner failed to load. Please retry."],
          events: [],
        });
      }
    } else session.run();
  };
  if (!loaded)
    return <main className="game-loading">Preparing Patch’s workshop…</main>;
  if (!isLevelUnlocked(campaign, level.id, progress))
    return (
      <main className="game-play">
        <h1>This signal is still out of reach.</h1>
        <p>Complete the preceding level to unlock {level.title}.</p>
        <Link href="/" className="game-button">
          Return to the map
        </Link>
      </main>
    );
  const editable = session.editable && !busy,
    next = campaign.levels[level.order];
  const ports =
    s.scenario.kind === "pipes"
      ? s.scenario.pieces.flatMap((p) => p.ports)
      : [];
  const reset = () => {
    run.current++;
    expectedNonce.current = null;
    setBusy(false);
    setFrame(null);
    setFrom("");
    session.reset();
  };
  return (
    <main className="game-play" data-testid="game-play">
      {storageStatus ? <p role="status">{storageStatus}</p> : null}
      <Link href="/" className="game-link">
        <ArrowLeft size={17} /> Story map
      </Link>
      <header className="game-level-header">
        <span className="game-eyebrow">
          LEVEL {level.order} / {level.district.toUpperCase()} ·{" "}
          {level.mode === "defense" ? "LIVE DEFENSE" : "TAKE YOUR TIME"}
        </span>
        <h1>{level.title}</h1>
        <p>{level.story}</p>
      </header>
      <div className="game-variants" role="group" aria-label="Scenario">
        <>
          {level.scenarios.map((scenario, i) => (
            <button
              key={scenario.id}
              data-testid={`game-scenario-${scenario.id}`}
              disabled={
                i > 0 &&
                !progress.awards[awardKey(campaign.id, level.id, "main")]
              }
              aria-pressed={scenario.id === s.scenario.id}
              onClick={() => {
                run.current++;
                expectedNonce.current = null;
                setBusy(false);
                setFrame(null);
                setFrom("");
                session.choose(scenario.id);
              }}
            >
              <Star
                size={15}
                fill={
                  progress.awards[awardKey(campaign.id, level.id, scenario.id)]
                    ? "currentColor"
                    : "none"
                }
              />
              {i === 0 ? "Story" : `Mastery ${i}`}
            </button>
          ))}
        </>
      </div>
      <div className="game-play-layout">
        <section className="game-workspace">
          <GameScene
            district={level.district}
            cosmetic={progress.cosmetic}
            paused={s.attempt.phase === "paused"}
            state={
              s.attempt.phase === "won"
                ? "celebrate"
                : (s.attempt.phase === "running" || s.attempt.phase === "paused")
                  ? "attack"
                  : s.failures
                    ? "reaction"
                    : "idle"
            }
          />
          <div className="game-objective">
            <span className="game-eyebrow">YOUR OBJECTIVE</span>
            <h2>{s.scenario.title}</h2>
            <p>{s.scenario.objective}</p>
          </div>
          {s.scenario.kind === "grid" ? (
            <iframe
              ref={iframe}
              key={frame?.nonce ?? "preview"}
              srcDoc={
                frame?.html ??
                gameSandboxHtml(s.scenario, s.code, "", "preview")
              }
              sandbox="allow-scripts"
              title="CSS defense grid"
              className="game-sandbox"
              style={{
                height:
                  s.scenario.kind === "grid"
                    ? s.scenario.widths.length * (s.scenario.rows * 42 + 24) +
                      24
                    : 240,
              }}
              data-testid="game-sandbox"
            />
          ) : null}
          {s.scenario.kind === "grid" || s.scenario.kind === "sql" ? (
            <>
              <label className="game-editor-label" htmlFor="game-code">
                {s.scenario.kind === "sql" ? "SQL query" : "CSS declarations"}
              </label>
              <textarea
                id="game-code"
                data-testid="game-code"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                maxLength={4096}
                value={s.code}
                disabled={!editable}
                onChange={(e) => {
                  run.current++;
                  expectedNonce.current = null;
                  setFrame(null);
                  session.edit(e.target.value);
                }}
              />
              <p className="game-editor-note">
                {s.scenario.kind === "grid"
                  ? "The dashed outline is your target. Solid tiles marked SAFE must stay clear."
                  : "Return zombie IDs. Your query runs against disposable demo tables."}
              </p>
              {s.scenario.kind === "sql" ? (
                <div className="game-tables">
                  {[
                    { name: "zombies", rows: s.scenario.zombies },
                    { name: "zones", rows: s.scenario.zones },
                  ].map(({ name, rows }) => (
                    <div key={name}>
                      <h3>{name}</h3>
                      <table>
                        <thead>
                          <tr>
                            {Object.keys(rows[0]).map((k) => (
                              <th key={k}>{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).map((v, j) => (
                                <td key={j}>
                                  {v === null ? "NULL" : String(v)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
          {s.scenario.kind === "pipes" ? (
            <div className="game-pieces">
              {s.scenario.pieces.map((piece) => (
                <div className="game-piece" key={piece.id}>
                  <h3>{piece.label}</h3>
                  {piece.ports.map((port) => (
                    <button
                      className={`game-port ${from === port.id ? "selected" : ""}`}
                      key={port.id}
                      disabled={
                        !editable ||
                        (port.direction === "in" &&
                          (!from ||
                            ports.find((p) => p.id === from)?.signal !==
                              port.signal))
                      }
                      data-testid={`game-port-${port.id}`}
                      onClick={() => {
                        if (port.direction === "out") setFrom(port.id);
                        else {
                          session.connect({ from, to: port.id });
                          setFrom("");
                        }
                      }}
                    >
                      <span>
                        {port.direction === "out" ? "↗" : "↘"} {port.label}
                      </span>
                      <small>{port.signal}</small>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
          {s.scenario.kind === "system" ? (
            <>
              <div className="game-model">
                <span>{s.scenario.rps.toLocaleString()} requests/sec</span>
                <span>{Math.round(s.scenario.readRatio * 100)}% reads</span>
                <span>Budget {s.scenario.budget}</span>
                <span>{Math.round(s.scenario.hitRatio * 100)}% cache hits</span>
              </div>
              <p className="game-editor-note">
                Scenario assumptions, not production benchmarks. Tap components
                to place them; select an origin and then a destination to
                connect a request route.
              </p>
              <div className="game-palette">
                {s.scenario.components.map((c) => (
                  <button
                    key={c.id}
                    data-testid={`game-piece-${c.id}`}
                    draggable={editable}
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", c.id)
                    }
                    disabled={!editable}
                    aria-pressed={s.board.nodes.includes(c.id)}
                    onClick={() => session.place(c.id)}
                  >
                    <strong>{c.label}</strong>
                    <small>
                      {c.cost} cost · {c.capacity}/sec
                    </small>
                  </button>
                ))}
              </div>
              <GameBoard
                scenario={s.scenario}
                board={s.board}
                selected={from}
                disabled={!editable}
                onPlace={(id) => session.place(id)}
                onMove={(id, x, y) => session.move(id, x, y)}
                onConnect={(id) => {
                  if (!from) setFrom(id);
                  else if (from === id) setFrom("");
                  else {
                    session.connect({ from, to: id });
                    setFrom("");
                  }
                }}
              />
              <fieldset className="game-routing">
                <legend>Traffic distribution</legend>
                {["round-robin", "capacity-weighted"].map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="routing"
                      value={value}
                      checked={(s.board.routing ?? "round-robin") === value}
                      disabled={!editable}
                      onChange={() =>
                        session.configure({
                          routing: value as "round-robin" | "capacity-weighted",
                        })
                      }
                    />
                    {value === "round-robin"
                      ? "Round robin (equal shares)"
                      : "Capacity weighted"}
                  </label>
                ))}
              </fieldset>
              <label className="game-checkbox">
                <input
                  type="checkbox"
                  checked={s.board.healthChecks !== false}
                  disabled={!editable}
                  onChange={(e) =>
                    session.configure({ healthChecks: e.target.checked })
                  }
                />
                Remove unhealthy APIs with health checks
              </label>
              <label className="game-checkbox">
                <input
                  type="checkbox"
                  disabled={!editable}
                  checked={s.board.invalidate}
                  onChange={(e) => session.invalidate(e.target.checked)}
                />
                Invalidate cached targeting data after writes
              </label>
            </>
          ) : null}
          {s.scenario.kind === "pipes" || s.scenario.kind === "system" ? (
            <div
              className="game-connections"
              role="group"
              aria-label="Connections"
            >
              {(s.scenario.kind === "pipes" ? s.edges : s.board.edges).map(
                (e) => (
                  <button
                    disabled={!editable}
                    key={`${e.from}-${e.to}`}
                    onClick={() => session.connect(e)}
                    aria-label={`Remove ${e.from} to ${e.to}`}
                  >
                    {e.from} → {e.to} ×
                  </button>
                ),
              )}
            </div>
          ) : null}
          {frame && s.scenario.kind === "sql" ? (
            <iframe
              key={frame.nonce}
              ref={iframe}
              srcDoc={frame.html}
              sandbox="allow-scripts"
              title="Local challenge output"
              className="game-sandbox"
              style={{ height: 240 }}
              data-testid="game-sandbox"
            />
          ) : null}
          <div className="game-controls">
            {s.attempt.phase === "running" ? (
              <button
                className="game-button"
                onClick={() => session.pause()}
                data-testid="game-pause"
              >
                <Pause size={17} />
                Pause
              </button>
            ) : s.attempt.phase === "paused" ? (
              <button
                className="game-button"
                onClick={() => session.resume()}
                data-testid="game-resume"
              >
                <Play size={17} />
                Resume
              </button>
            ) : (
              <button
                className="game-button"
                disabled={!editable}
                onClick={() => void execute()}
                data-testid="game-run"
              >
                <Play size={17} />
                {busy
                  ? "Running…"
                  : level.mode === "defense" && !s.attempt.assisted
                    ? "Start defense"
                    : "Run solution"}
              </button>
            )}
            <button
              className="game-button secondary"
              onClick={reset}
              data-testid="game-reset"
            >
              <RotateCcw size={17} />
              Reset
            </button>
          </div>
          {level.mode === "defense" ? (
            <div className="game-defense">
              <span>
                <Shield size={17} /> Integrity {Math.round(s.attempt.health)}% ·{" "}
                {s.attempt.elapsed}s
              </span>
              <button
                className="game-link"
                onClick={() => {
                  setFrame(null);
                  session.assist();
                }}
              >
                Use assisted untimed mode
              </button>
              <p>
                {s.attempt.assisted
                  ? "Untimed mode earns the same stars and XP."
                  : s.attempt.phase === "paused"
                    ? "Paused. Editing is frozen; hints and lessons remain available."
                    : "Three waves, 24 seconds. Waves continue while you edit."}
              </p>
            </div>
          ) : null}
        </section>
        <aside className="game-help">
          <span className="game-eyebrow">PATCH’S FIELD NOTES</span>
          <h2>Every attempt teaches us something.</h2>
          <button
            className="game-button secondary"
            onClick={() => session.hint()}
            data-testid="game-hint"
          >
            <Lightbulb size={18} /> {s.hints ? "Next hint" : "Need a hint?"}
          </button>
          {s.scenario.hints.slice(0, s.hints).map((hint, i) => (
            <p className="game-hint" key={i}>
              {hint}
            </p>
          ))}
          <div
            className={
              s.failures >= 2 ? "game-lesson prominent" : "game-lesson"
            }
          >
            <h3>
              <BookOpen size={18} /> Learn the idea
            </h3>
            {level.lessonSlugs.map((slug) => (
              <Link
                key={slug}
                onClick={() => session.pause()}
                href={`/docs/${slug}?returnTo=${encodeURIComponent(`/play/${campaign.id}/${level.id}`)}`}
              >
                {slug.split("/").at(-1)?.replaceAll("-", " ")}{" "}
                <ArrowRight size={15} />
              </Link>
            ))}
            {level.pathSlug ? (
              <Link
                href={`/paths/${level.pathSlug}`}
                onClick={() => session.pause()}
              >
                Related learning path <ArrowRight size={15} />
              </Link>
            ) : null}
          </div>
          {s.result ? (
            <section
              className={`game-result ${s.attempt.phase === "won" ? "success" : ""}`}
              aria-live="polite"
              data-testid="game-result"
            >
              <h2>
                {s.attempt.phase === "won" ? (
                  <>
                    <Check size={22} /> Signal restored!
                  </>
                ) : s.attempt.phase === "lost" ? (
                  "The defense needs another try"
                ) : s.result.passed ? (
                  "System holding"
                ) : (
                  "Inspect the result"
                )}
              </h2>
              {s.result.reasons.map((r) => (
                <p key={r}>{r}</p>
              ))}
              {s.result.events.slice(0, 6).map((e, i) => (
                <p key={i}>{e}</p>
              ))}
              {s.attempt.phase === "won" ? (
                <>
                  <p>{s.scenario.explanation}</p>
                  {next ? (
                    <Link
                      className="game-button"
                      href={`/play/${campaign.id}/${next.id}`}
                    >
                      Next level <ArrowRight size={17} />
                    </Link>
                  ) : (
                    <Link className="game-button" href="/">
                      The city is awake <Star size={17} />
                    </Link>
                  )}
                </>
              ) : null}
            </section>
          ) : (
            <p>
              Run your solution to see what happens. Patch will help you trace
              the result.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
