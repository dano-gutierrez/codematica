"use client";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Eraser,
  Eye,
  LockKeyhole,
  Pencil,
  RotateCcw,
  Undo2,
} from "lucide-react";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  buildWritingPracticeSheets,
  createCharacterNotebook,
  createExerciseNotebook,
  getWritingMatchPairs,
  getContentIndex,
  checkNotebookCharacter,
  notebookDifficultyOptions,
  getNotebookPhase,
  getNotebookGeometry,
  getWritingStrokePath,
  isNotebookSheetUnlocked,
  type LanguageCharacter,
  type LanguageStrokePoint,
  type WritingStroke,
  type WritingNotebook,
  type NotebookStorage,
  type WritingExercise,
  type NotebookSheet,
  type NotebookCell,
  type NotebookDifficulty,
} from "@codematica/core";
import {
  useNotebookInkRejection,
  useNotebookSession,
} from "@codematica/ui/notebook-session";
import { createWebNotebookStorage } from "@/lib/notebooks/storage";
import { cn } from "@/lib/utils";
import { Dropdown } from "./Dropdown";

type WritingProgressHandler = (
  status: "started" | "completed",
  position: Record<string, unknown>,
) => void;
const noCharacters: LanguageCharacter[] = [];

export function JapaneseWritingPractice({
  characters = noCharacters,
  prompt = "Fill your notebook, one character at a time.",
  exercise,
  notebook: providedNotebook,
  storage: providedStorage,
  nextHref,
  onProgressEvent,
}: {
  characters?: LanguageCharacter[];
  prompt?: string;
  exercise?: WritingExercise;
  notebook?: WritingNotebook;
  storage?: NotebookStorage | false;
  nextHref?: string;
  onProgressEvent?: WritingProgressHandler;
}) {
  const notebook = useMemo(
    () =>
      providedNotebook ??
      (exercise
        ? createExerciseNotebook(exercise, getContentIndex())
        : createCharacterNotebook(characters, getContentIndex())),
    [providedNotebook, exercise, characters],
  );
  const storage = useMemo(
    () =>
      providedStorage === false
        ? undefined
        : (providedStorage ?? createWebNotebookStorage()),
    [providedStorage],
  );
  const session = useNotebookSession(notebook, storage, onProgressEvent);
  const { sheet, page } = session;
  const [activity, setActivity] = useState<"write" | "match">("write");
  const [strokes, setStrokes] = useState<WritingStroke[]>([]),
    [live, setLive] = useState<WritingStroke>();
  const pending = useRef<WritingStroke[]>([]),
    active = useRef<
      { id: number; type: string; stroke: WritingStroke } | undefined
    >(undefined);
  const contacts = useRef(new Map<number, number>());
  const pan = useRef<{ y: number } | undefined>(undefined);
  const penSuppressed = useRef(false);
  const penTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [showExample, setShowExample] = useState(false),
    [feedback, setFeedback] = useState("");
  const rejection = useNotebookInkRejection(() => {
    pending.current = [];
    setStrokes([]);
    setFeedback("Try again · write the whole character.");
  });
  const [paperWidth, setPaperWidth] = useState(600);
  const viewport = useRef<HTMLDivElement>(null);
  const token = useRef(0),
    [origin] = useState(
      () => Date.now().toString(36) + Math.random().toString(36).slice(2),
    );
  const geometry = useMemo(
    () => getNotebookGeometry(paperWidth, sheet?.characters.length ?? 1),
    [paperWidth, sheet?.characters.length],
  );
  const count = page?.cells.length ?? 0;
  const character = sheet?.characters[count % (sheet?.characters.length ?? 1)];
  const phase = sheet ? getNotebookPhase(sheet, count) : "Trace";
  const exampleVisible = phase !== "Recall" || showExample;
  const matchSheets = useMemo(
    () =>
      buildWritingPracticeSheets(
        exercise
          ? exercise.characterSlugs.flatMap((slug) => {
              const c = getContentIndex().languageCharacters.find(
                (c) => c.slug === slug,
              );
              return c ? [c] : [];
            })
          : characters,
        getContentIndex(),
      ),
    [exercise, characters],
  );
  function stopTimer() {
    clearTimeout(timer.current);
    timer.current = undefined;
  }
  function holdPen() {
    clearTimeout(penTimer.current);
    penSuppressed.current = true;
    penTimer.current = setTimeout(() => { penSuppressed.current = false; }, 800);
  }
  function clearInk() {
    stopTimer();
    rejection.cancel();
    active.current = undefined;
    pending.current = [];
    contacts.current.clear();
    pan.current = undefined;
    setStrokes([]);
    setLive(undefined);
    setFeedback("");
  }
  useEffect(() => {
    return () => { clearTimeout(timer.current); clearTimeout(penTimer.current); };
  }, []);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    function measure() {
      setPaperWidth(
        Math.max(280, element!.getBoundingClientRect().width || 600),
      );
    }
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [activity]);
  function evaluate(difficulty = session.difficulty) {
    stopTimer();
    if (
      !character ||
      !pending.current.length ||
      active.current ||
      session.complete
    )
      return;
    const checked = checkNotebookCharacter(
      character,
      pending.current,
      difficulty,
    );
    if (!checked.isCorrect) {
      rejection.reject(() =>
        setFeedback(
          checked.feedback.includes("tiny")
            ? "Write the whole character · a tiny mark isn't enough."
            : "Not quite yet · add the missing shape, or try again.",
        ),
      );
      return;
    }
    if (session.commit(origin + "-" + token.current++, checked.ink)) {
      rejection.cancel();
      pending.current = [];
      setStrokes([]);
      setLive(undefined);
      setShowExample(false);
      setFeedback("Correct · your handwriting is saved in the next space.");
      const next = geometry.cells[count + 1],
        element = viewport.current;
      if (
        next &&
        element &&
        (next.y < element.scrollTop ||
          next.y + next.size > element.scrollTop + element.clientHeight)
      )
        element.scrollTo({
          top: Math.max(0, next.y - 110),
          behavior: "instant",
        });
    }
  }
  function eventSamples(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const coalesced = event.nativeEvent.getCoalescedEvents?.() ?? [];
    const samples = coalesced.length ? coalesced : [event.nativeEvent];
    const last = samples.at(-1);
    const all =
      last?.clientX === event.clientX && last?.clientY === event.clientY
        ? samples
        : [...samples, event.nativeEvent];
    return {
      points: all.map(
        (p) =>
          [
            Math.max(
              0,
              Math.min(
                geometry.width,
                ((p.clientX - rect.left) * geometry.width) /
                  Math.max(1, rect.width),
              ),
            ),
            Math.max(
              0,
              Math.min(
                geometry.height,
                ((p.clientY - rect.top) * geometry.height) /
                  Math.max(1, rect.height),
              ),
            ),
          ] as LanguageStrokePoint,
      ),
      pressures: all.map((p) =>
        Number.isFinite(p.pressure) ? p.pressure : 0.5,
      ),
    };
  }
  function resumeCheck() {
    stopTimer();
    if (pending.current.length && !active.current && !pan.current)
      timer.current = setTimeout(() => evaluate(), 400);
  }
  function touchPan(event: PointerEvent<SVGSVGElement>, ending = false, starting = false) {
    if (!contacts.current.has(event.pointerId)) return false;
    if (ending) contacts.current.delete(event.pointerId);
    else contacts.current.set(event.pointerId, event.clientY);
    const ys = [...contacts.current.values()];
    if (ys.length >= 2) {
      const y = ys.reduce((sum, value) => sum + value, 0) / ys.length;
      if (!pan.current) {
        stopTimer();
        rejection.cancel();
        active.current = undefined;
        setLive(undefined);
        pan.current = { y };
      } else if (!ending && !starting) {
        const element = viewport.current;
        if (element) {
          const delta = pan.current.y - y;
          const before = element.scrollTop;
          element.scrollTop = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, before + delta));
          const remainder = delta - (element.scrollTop - before);
          if (remainder) window.scrollBy({ top: remainder });
        }
        pan.current.y = y;
      } else pan.current.y = y;
    }
    if (!pan.current) return false;
    event.preventDefault();
    // Once scrolling starts, the remaining finger never becomes a pen stroke.
    if (!ys.length) {
      pan.current = undefined;
      resumeCheck();
    }
    return true;
  }
  function start(event: PointerEvent<SVGSVGElement>) {
    if (event.pointerType === "touch") {
      if (active.current?.type === "pen" || penSuppressed.current) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      contacts.current.set(event.pointerId, event.clientY);
      if (touchPan(event, false, true)) return;
    }
    if (session.loading || session.loadFailed || session.complete ||
      (event.pointerType === "mouse" && event.button !== 0)) return;
    if (active.current && event.pointerType !== "pen") return;
    if (active.current?.type === "pen") return;
    stopTimer();
    rejection.cancel();
    if (event.pointerType === "pen") {
      contacts.current.clear();
      pan.current = undefined;
      holdPen();
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    active.current = { id: event.pointerId, type: event.pointerType, stroke: eventSamples(event) };
    setLive(active.current.stroke);
    setFeedback("");
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    if (touchPan(event)) return;
    if (!active.current || active.current.id !== event.pointerId) return;
    const samples = eventSamples(event);
    active.current.stroke = {
      points: [...active.current.stroke.points, ...samples.points],
      pressures: [...active.current.stroke.pressures!, ...samples.pressures],
    };
    setLive({ ...active.current.stroke });
  }
  function cancel(event: PointerEvent<SVGSVGElement>) {
    if (touchPan(event, true)) return;
    if (active.current?.id !== event.pointerId) return;
    if (active.current.type === "pen") holdPen();
    active.current = undefined;
    setLive(undefined);
    resumeCheck();
  }
  function end(event: PointerEvent<SVGSVGElement>) {
    if (pan.current) { touchPan(event, true); return; }
    if (!active.current || active.current.id !== event.pointerId) {
      contacts.current.delete(event.pointerId);
      return;
    }
    move(event);
    const stroke = active.current.stroke;
    if (active.current.type === "pen") holdPen();
    contacts.current.delete(event.pointerId);
    active.current = undefined;
    setLive(undefined);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    pending.current = [...pending.current, stroke];
    setStrokes(pending.current);
    resumeCheck();
  }
  function choose(index: number) {
    clearInk();
    setShowExample(false);
    session.selectSheet(index);
    viewport.current?.scrollTo({ top: 0 });
  }
  function undo() {
    stopTimer();
    rejection.cancel();
    active.current = undefined;
    setLive(undefined);
    if (pending.current.length) {
      pending.current = pending.current.slice(0, -1);
      setStrokes(pending.current);
      if (pending.current.length)
        timer.current = setTimeout(() => evaluate(), 400);
    } else session.undo();
    setFeedback("");
  }
  function changeDifficulty(value: string) {
    const difficulty = value as NotebookDifficulty;
    session.setDifficulty(difficulty);
    stopTimer();
    rejection.cancel();
    if (pending.current.length && !active.current)
      timer.current = setTimeout(() => evaluate(difficulty), 400);
  }
  if (!sheet || !character || !page)
    return (
      <p className="mt-6">No characters are available for this exercise.</p>
    );
  const sheetIndex = notebook.sheets.findIndex((s) => s.id === sheet.id);
  return (
    <div
      className="writing-session notebook-session mt-6"
      data-testid="writing-practice"
    >
      <p className="notebook-intro">{prompt}</p>
      <div className="notebook-activity" aria-label="Practice activity">
        <ModeButton
          active={activity === "write"}
          testId="writing-activity-write"
          onClick={() => {
            clearInk();
            setActivity("write");
          }}
        >
          Write · planas
        </ModeButton>
        {matchSheets.length ? (
          <ModeButton
            active={activity === "match"}
            testId="writing-activity-match"
            onClick={() => {
              clearInk();
              setActivity("match");
            }}
          >
            Match pairs
          </ModeButton>
        ) : null}
      </div>
      {activity === "match" ? (
        <MatchingPairs sheets={matchSheets} />
      ) : (
        <>
          <div className="notebook-sheet-picker" aria-label="Notebook sheets">
            {notebook.sheets.map((item, i) => {
              const unlocked = isNotebookSheetUnlocked(
                  notebook,
                  session.snapshot,
                  i,
                ),
                done =
                  session.snapshot.pages[item.id]!.bestCount >=
                  24 * item.characters.length;
              return (
                <button
                  type="button"
                  key={item.id}
                  disabled={!unlocked || session.loading || session.loadFailed}
                  aria-pressed={sheet.id === item.id}
                  onClick={() => choose(i)}
                  data-testid={"writing-sheet-" + item.id}
                >
                  <span>
                    {unlocked ? (
                      done ? (
                        <CheckCircle2 size={15} aria-label="Completed" />
                      ) : (
                        <Pencil size={15} aria-hidden="true" />
                      )
                    ) : (
                      <LockKeyhole size={15} aria-label="Locked" />
                    )}
                    {i + 1}
                  </span>
                  <span lang={exampleVisible ? "ja" : undefined}>
                    {exampleVisible ? item.label : item.romaji}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            className="notebook-progress-heading"
            data-testid="writing-sheet-progress"
          >
            <span>
              {phase} · Sheet {sheetIndex + 1} of {notebook.sheets.length}
            </span>
            <strong>
              {Math.floor(count / sheet.characters.length)} / 24 repetitions
            </strong>
          </div>
          <div
            className="writing-progress-track"
            role="progressbar"
            aria-label="Sheet progress"
            aria-valuemin={0}
            aria-valuemax={24 * sheet.characters.length}
            aria-valuenow={count}
          >
            <span
              style={{
                width: (100 * count) / (24 * sheet.characters.length) + "%",
              }}
            />
          </div>
          <div className="notebook-example" data-testid="writing-example">
            <div>
              <span className="notebook-eyebrow">
                {sheet.kind === "custom"
                  ? "Your notebook"
                  : "Japanese · " + sheet.kind}
              </span>
              <p lang="ja" className="notebook-prompt">
                {exampleVisible ? sheet.label : "Write from memory"}
              </p>
              <p>
                {sheet.romaji} · {sheet.meaning}
              </p>
            </div>
            <div className="notebook-character-hint">
              <strong>
                {character.romaji} /{character.ipa}/
              </strong>
              <span>
                {character.inputSequences.length
                  ? "IME: " + character.inputSequences.join(" or ")
                  : "Finger or stylus"}
              </span>
              <button
                type="button"
                className="writing-peek"
                onClick={() => setShowExample((v) => !v)}
                data-testid="writing-peek"
              >
                <Eye size={16} aria-hidden="true" />
                {showExample ? "Hide example" : "Show example"}
              </button>
            </div>
          </div>
          <div className="notebook-difficulty">
            <Dropdown
              label="Handwriting difficulty"
              value={session.difficulty}
              options={notebookDifficultyOptions}
              onValueChange={changeDifficulty}
              disabled={session.loading || session.loadFailed}
              testId="writing-difficulty"
            />
          </div>
          <div className="notebook-toolbar" aria-label="Drawing tools">
            <button
              type="button"
              disabled={!strokes.length && !count}
              onClick={undo}
              data-testid="writing-undo"
            >
              <Undo2 size={17} aria-hidden="true" />
              Undo
            </button>
            <button
              type="button"
              onClick={clearInk}
              data-testid="writing-clear"
            >
              <Eraser size={17} aria-hidden="true" />
              Clear current character
            </button>
          </div>
          <p className="notebook-instruction">
            Write anywhere with your mouse, finger or stylus. Scroll with two fingers on touch screens, or use your mouse wheel or trackpad. Characters check automatically when you pause.
          </p>
          <div
            ref={viewport}
            className="notebook-viewport"
            data-testid="writing-notebook-viewport"
            style={{ overflowY: "auto" }}
            tabIndex={0}
            role="region"
            aria-label="Scrollable notebook paper"
          >
            <svg
              width="100%"
              height={geometry.height}
              viewBox={"0 0 " + geometry.width + " " + geometry.height}
              role="img"
              aria-label={"Notebook paper for " + sheet.romaji}
              className="notebook-paper"
              style={{ touchAction: "none" }}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={cancel}
              onLostPointerCapture={cancel}
              data-testid="writing-pad"
            >
              <path
                d={"M 30 0 V " + geometry.height}
                stroke="#deb8a8"
                strokeWidth="1"
                data-testid="writing-margin-line"
              />
              <text
                x="48"
                y="32"
                fill="#526873"
                fontSize="11"
                letterSpacing="1.6"
              >
                MY JAPANESE NOTEBOOK
              </text>
              <text x="48" y="76" fill="#263238" fontSize="32" lang="ja">
                {exampleVisible ? sheet.label : sheet.romaji}
              </text>
              <NotebookMarks
                geometry={geometry}
                sheet={sheet}
                cells={page.cells}
                count={count}
                complete={session.complete}
                error={rejection.phase !== "idle"}
                errorAttempt={rejection.attempt}
              />
              <g
                className="notebook-pending-ink"
                data-phase={rejection.phase}
                data-testid="writing-pending-ink"
              >
                {[...strokes, ...(live ? [live] : [])].map((s, i) => (
                  <path
                    key={i}
                    d={getWritingStrokePath(s.points, false)}
                    fill="none"
                    stroke={rejection.phase === "idle" ? "#263238" : "#a34935"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    data-testid={"writing-ink-" + i}
                  />
                ))}
              </g>
            </svg>
          </div>
          <div
            className="notebook-feedback"
            role="status"
            data-testid="writing-feedback-slot"
          >
            <p data-testid="writing-feedback">
              {session.loading
                ? "Opening your notebook…"
                : session.saveError ||
                  (session.complete
                    ? "Sheet complete! All 24 repetitions. Your next sheet is unlocked."
                    : feedback ||
                      "Take your time. Recognizable shapes are enough.")}
            </p>
            {session.saveError ? (
              <button
                type="button"
                onClick={session.retry}
                data-testid="writing-save-retry"
              >
                Retry
              </button>
            ) : null}
          </div>
          <div className="notebook-footer">
            {sheetIndex + 1 < notebook.sheets.length ? (
              <button
                type="button"
                className="writing-primary"
                disabled={!session.complete}
                onClick={() => choose(sheetIndex + 1)}
                data-testid="writing-next-sheet"
              >
                Next sheet
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ) : null}
            {session.allRequiredComplete && nextHref ? (
              <Link href={nextHref} className="writing-primary">
                Next activity
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ) : null}
            <button
              type="button"
              className="notebook-restart"
              aria-label="Clear and restart sheet"
              title="Clear and restart sheet"
              disabled={session.loading || session.loadFailed}
              onClick={() => {
                clearInk();
                session.restart();
                setShowExample(false);
                viewport.current?.scrollTo({ top: 0 });
              }}
              data-testid="writing-repeat"
            >
              <RotateCcw size={20} aria-hidden="true" />
            </button>
          </div>
          <p className="notebook-attribution">
            Stroke guides:{" "}
            <a
              href="https://kanjivg.tagaini.net/"
              target="_blank"
              rel="noreferrer"
            >
              KanjiVG · Ulrich Apel and contributors
            </a>{" "}
            ·{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/3.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY-SA 3.0
            </a>
          </p>
        </>
      )}
    </div>
  );
}

function MatchingPairs({
  sheets,
}: {
  sheets: ReturnType<typeof buildWritingPracticeSheets>;
}) {
  const pairs = useMemo(() => getWritingMatchPairs(sheets), [sheets]);
  const [selected, setSelected] = useState<{ kana?: string; romaji?: string }>(
    {},
  );
  const [matched, setMatched] = useState<string[]>([]);
  const [message, setMessage] = useState(
    "Choose a Japanese tile and its reading.",
  );
  const [round, setRound] = useState(0);
  const readings = [
    ...pairs.slice((round + 1) % pairs.length),
    ...pairs.slice(0, (round + 1) % pairs.length),
  ];
  function choose(side: "kana" | "romaji", id: string) {
    const next = { ...selected, [side]: id };
    if (next.kana && next.romaji) {
      if (next.kana === next.romaji) {
        setMatched((value) => [...value, id]);
        setSelected({});
        setMessage(
          matched.length + 1 === pairs.length
            ? "Nicely done! Every pair matched."
            : "Nice match. Keep going!",
        );
      } else {
        setSelected({
          [side === "kana" ? "romaji" : "kana"]:
            selected[side === "kana" ? "romaji" : "kana"],
        });
        setMessage("Try another pair. You have time.");
      }
    } else {
      setSelected(next);
      setMessage("Now choose its matching tile.");
    }
  }
  return (
    <div className="writing-match" data-testid="writing-match">
      <h2 className="text-2xl font-semibold text-[#263238]">
        Tap the matching pairs
      </h2>
      <p className="mt-2 text-sm text-[#53616c]">
        Same sounds, another way to remember. {matched.length} / {pairs.length}{" "}
        matched
      </p>
      <div className="writing-match-grid">
        {(["kana", "romaji"] as const).map((side) => (
          <div key={side} className="writing-match-column">
            {(side === "kana" ? pairs : readings).map((pair) => (
              <button
                type="button"
                key={pair.id}
                lang={side === "kana" ? "ja" : undefined}
                aria-pressed={selected[side] === pair.id}
                disabled={matched.includes(pair.id)}
                onClick={() => choose(side, pair.id)}
                data-testid={`writing-match-${side}-${pair.id}`}
              >
                {side === "kana" ? pair.label : pair.romaji}
                {matched.includes(pair.id) ? (
                  <CheckCircle2 size={18} aria-label="Matched" />
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="writing-footer">
        <p
          className="writing-feedback-slot font-semibold text-[#00645f]"
          role="status"
        >
          {message}
        </p>
        <button
          type="button"
          className="writing-primary"
          disabled={matched.length !== pairs.length}
          onClick={() => {
            setRound((value) => value + 1);
            setMatched([]);
            setSelected({});
            setMessage("A fresh round. Match the same pairs again.");
          }}
          data-testid="writing-match-repeat"
        >
          <RotateCcw size={18} aria-hidden="true" />
          Practice again
        </button>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  testId,
  onClick,
  children,
}: {
  active: boolean;
  testId: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("writing-mode", active && "is-active")}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

const NotebookMarks = memo(function NotebookMarks({
  geometry,
  sheet,
  cells,
  count,
  complete,
  error,
  errorAttempt,
}: {
  geometry: ReturnType<typeof getNotebookGeometry>;
  sheet: NotebookSheet;
  cells: NotebookCell[];
  count: number;
  complete: boolean;
  error: boolean;
  errorAttempt: number;
}) {
  return (
    <>
      {geometry.cells.map((cell, i) => {
        const written = cells[i],
          model = sheet.characters[cell.characterIndex]!,
          guide = sheet.phases[cell.repetition] === "Trace" && !written,
          focused = i === count && !complete;
        return (
          <g
            key={i}
            transform={"translate(" + cell.x + " " + cell.y + ")"}
            data-testid={"writing-cell-" + i}
          >
            <g
              key={focused ? errorAttempt : 0}
              className={focused && error ? "notebook-cell-error" : undefined}
              data-error={focused && error}
              data-testid={"writing-cell-" + i + "-feedback"}
            >
              <rect
                width={cell.size}
                height={cell.size}
                fill={focused ? (error ? "#fbede6" : "#eef6ec") : "none"}
                stroke={focused ? (error ? "#a34935" : "#007c78") : "#abcbd4"}
                strokeWidth={focused ? 1.8 : 0.6}
                rx={focused ? 7 : 0}
              />
              <path
                d={
                  "M 0 " +
                  cell.size / 2 +
                  " H " +
                  cell.size +
                  " M " +
                  cell.size / 2 +
                  " 0 V " +
                  cell.size
                }
                fill="none"
                stroke="#bed6db"
                strokeWidth="0.6"
                strokeDasharray="2 4"
              />
              <g transform={"scale(" + cell.size / 100 + ")"}>
                {guide
                  ? model.strokes.map((s) => (
                      <path
                        key={s.id}
                        d={getWritingStrokePath(s.points)}
                        fill="none"
                        stroke="#608c86"
                        strokeWidth="2"
                        strokeDasharray="1 4"
                        strokeLinecap="round"
                      />
                    ))
                  : null}
                {written?.strokes.map((s, k) => (
                  <path
                    key={k}
                    d={getWritingStrokePath(s.points)}
                    fill="none"
                    stroke="#263238"
                    strokeWidth={
                      2 +
                      ((s.pressures?.reduce((sum, p) => sum + p, 0) ?? 0) /
                        (s.pressures?.length || 1)) *
                        2
                    }
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    data-testid={"writing-cell-" + i + "-ink-" + k}
                  />
                ))}
              </g>
              {written && !written.strokes.length ? (
                <text
                  x={cell.size / 2}
                  y={cell.size / 2 + 7}
                  textAnchor="middle"
                  fontSize="20"
                  fill="#00645f"
                >
                  ✓
                </text>
              ) : null}
            </g>
          </g>
        );
      })}
    </>
  );
});
