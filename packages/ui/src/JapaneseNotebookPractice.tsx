import { AdaptiveText as Text } from "./AdaptiveText";
import { Button } from "./Button";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  ScrollView,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import Svg, { G, Path, Rect, Text as SvgText } from "react-native-svg";
import {
  checkNotebookCharacter,
  notebookDifficultyOptions,
  getNotebookGeometry,
  getNotebookPhase,
  getWritingStrokePath,
  isNotebookSheetUnlocked,
  type WritingNotebook,
  type WritingStroke,
  type NotebookDifficulty,
} from "@codematica/core";
import type { CodematicaAdapters } from "./adapters";
import {
  useNotebookInkRejection,
  useNotebookSession,
} from "./notebook-session";

export const NotebookDrawingContext = createContext<(drawing: boolean) => void>(
  () => undefined,
);
export const NotebookScrollContext = createContext<(deltaY: number) => void>(
  () => undefined,
);
export type HandwritingCanvasProps = {
  resetKey: number;
  strokeCount: number;
  disabled: boolean;
  style: ViewStyle;
  onBegin: (pen?: boolean) => void;
  onEnd: (strokes: WritingStroke[]) => void;
  onPan: (deltaY: number, phase: "began" | "changed" | "ended") => void;
};
export function JapaneseNotebookPractice({
  notebook,
  adapters,
  nextHref,
  onProgress,
}: {
  notebook: WritingNotebook;
  adapters: CodematicaAdapters;
  nextHref?: string;
  onProgress?: (
    status: "started" | "completed",
    position: Record<string, unknown>,
  ) => void | Promise<void>;
}) {
  const session = useNotebookSession(notebook, adapters.notebooks, onProgress),
    { sheet, page } = session;
  const [width, setWidth] = useState(320),
    [peek, setPeek] = useState(false),
    [feedback, setFeedback] = useState("");
  const [strokes, setStrokes] = useState<WritingStroke[]>([]),
    [live, setLive] = useState<WritingStroke>(),
    [resetKey, setResetKey] = useState(0);
  const pending = useRef<WritingStroke[]>([]),
    active = useRef<WritingStroke | undefined>(undefined),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    pointer = useRef("touch"),
    pointerPressure = useRef(0.5),
    penSuppressed = useRef(false),
    penTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    panning = useRef(false),
    panY = useRef(0),
    strokePointer = useRef("touch");
  const serial = useRef(0),
    [origin] = useState(
      () => Date.now().toString(36) + Math.random().toString(36).slice(2),
    );
  const scroll = useRef<ScrollView>(null),
    scrollY = useRef(0),
    height = 460;
  const setDrawing = useContext(NotebookDrawingContext);
  const scrollPage = useContext(NotebookScrollContext);
  const geometry = useMemo(
    () => getNotebookGeometry(width, sheet?.characters.length ?? 1),
    [width, sheet?.characters.length],
  );
  const count = page?.cells.length ?? 0,
    character = sheet?.characters[count % (sheet?.characters.length ?? 1)],
    phase = sheet ? getNotebookPhase(sheet, count) : "Trace";
  const Canvas = adapters.handwritingCanvas;
  const rejection = useNotebookInkRejection(() => {
    pending.current = [];
    setStrokes([]);
    setResetKey((k) => k + 1);
    setDrawing(false);
    setFeedback("Try again · write the whole character.");
  });
  const [reduceMotion, setReduceMotion] = useState(false);
  const [bounce] = useState(() => new Animated.Value(0));
  const [inkOpacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    const fade = Animated.timing(inkOpacity, {
      toValue: rejection.phase === "fading" ? 0 : 1,
      duration: rejection.phase === "fading" && !reduceMotion ? 250 : 0,
      useNativeDriver: true,
    });
    fade.start();
    return () => fade.stop();
  }, [inkOpacity, reduceMotion, rejection.phase]);
  useEffect(() => {
    bounce.setValue(0);
    if (reduceMotion || rejection.phase !== "rejected") return;
    const animation = Animated.sequence(
      [-4, 3, -1, 0].map((toValue) =>
        Animated.timing(bounce, {
          toValue,
          duration: 55,
          useNativeDriver: true,
        }),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [bounce, reduceMotion, rejection.phase, rejection.attempt]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(penTimer.current);
      setDrawing(false);
    },
    [setDrawing],
  );
  function pause() {
    clearTimeout(timer.current);
    timer.current = undefined;
  }
  function holdPen() {
    clearTimeout(penTimer.current);
    penSuppressed.current = true;
    penTimer.current = setTimeout(() => { penSuppressed.current = false; }, 800);
  }
  function clear() {
    pause();
    rejection.cancel();
    pending.current = [];
    active.current = undefined;
    panning.current = false;
    setStrokes([]);
    setLive(undefined);
    setResetKey((k) => k + 1);
    setDrawing(false);
    setFeedback("");
  }
  function check(difficulty = session.difficulty) {
    pause();
    if (
      !character ||
      active.current ||
      panning.current ||
      session.complete ||
      !pending.current.length
    )
      return;
    const result = checkNotebookCharacter(
      character,
      pending.current,
      difficulty,
    );
    if (!result.isCorrect) {
      rejection.reject(() =>
        setFeedback(
          result.feedback.includes("tiny")
            ? "Write the whole character · a tiny mark isn't enough."
            : "Not quite yet · add the missing shape, or try again.",
        ),
      );
      return;
    }
    if (session.commit(origin + "-" + serial.current++, result.ink)) {
      clear();
      setPeek(false);
      setFeedback("Correct · your handwriting is saved in the next space.");
      const next = geometry.cells[count + 1];
      if (
        next &&
        (next.y < scrollY.current ||
          next.y + next.size > scrollY.current + height)
      ) {
        scrollY.current = Math.max(0, next.y - 110);
        scroll.current?.scrollTo({ y: scrollY.current, animated: false });
      }
    }
  }
  function begin(pen = false) {
    rejection.cancel();
    strokePointer.current = pen ? "pen" : pointer.current;
    if (Canvas) {
      active.current = { points: [] };
      setLive(active.current);
    }
    pause();
    setDrawing(true);
    setFeedback("");
  }
  function ended(ink: WritingStroke[]) {
    active.current = undefined;
    setLive(undefined);
    setDrawing(false);
    if (strokePointer.current === "pen") holdPen();
    pending.current = ink;
    setStrokes(ink);
    timer.current = setTimeout(() => check(), 400);
  }
  function point(event: GestureResponderEvent) {
    return [event.nativeEvent.locationX, event.nativeEvent.locationY] as [
      number,
      number,
    ];
  }
  function resumeCheck() {
    pause();
    if (pending.current.length && !active.current && !panning.current)
      timer.current = setTimeout(() => check(), 400);
  }
  function panPaper(deltaY: number, phase: "began" | "changed" | "ended") {
    if (phase === "began") {
      pause();
      rejection.cancel();
      active.current = undefined;
      setLive(undefined);
      panning.current = true;
      setDrawing(true);
    } else if (phase === "changed") {
      const before = scrollY.current;
      scrollY.current = Math.max(0, Math.min(Math.max(0, geometry.height - height), before + deltaY));
      scroll.current?.scrollTo({ y: scrollY.current, animated: false });
      const remainder = deltaY - (scrollY.current - before);
      if (remainder) scrollPage(remainder);
    } else {
      panning.current = false;
      setDrawing(false);
      resumeCheck();
    }
  }
  function touchPan(event: GestureResponderEvent, ending = false) {
    const touches = event.nativeEvent.touches ?? [];
    if (touches.length >= 2 && strokePointer.current !== "pen") {
      const y = touches.reduce((sum, t) => sum + t.pageY, 0) / touches.length;
      if (!panning.current) panPaper(0, "began");
      else if (!ending) panPaper(panY.current - y, "changed");
      panY.current = y;
    }
    if (!panning.current) return false;
    if (ending && !touches.length) panPaper(0, "ended");
    return true;
  }
  function touchStart(event: GestureResponderEvent) {
    // Adding a finger establishes a new centroid without moving the paper.
    const touches = event.nativeEvent.touches ?? [];
    if (touches.length >= 2 && strokePointer.current !== "pen") {
      if (!panning.current) panPaper(0, "began");
      panY.current = touches.reduce((sum, t) => sum + t.pageY, 0) / touches.length;
    }
  }
  function grant(event: GestureResponderEvent) {
    strokePointer.current = pointer.current;
    if (touchPan(event)) return;
    if (session.loading || session.loadFailed || session.complete ||
      (pointer.current !== "pen" && penSuppressed.current)) return;
    begin();
    active.current = { points: [point(event)], pressures: [event.nativeEvent.force ?? pointerPressure.current] };
    setLive(active.current);
  }
  function move(event: GestureResponderEvent) {
    if (touchPan(event)) return;
    if (!active.current) return;
    active.current = {
      points: [...active.current.points, point(event)],
      pressures: [...(active.current.pressures ?? []), event.nativeEvent.force ?? pointerPressure.current],
    };
    setLive({ ...active.current });
  }
  function release(event: GestureResponderEvent) {
    if (touchPan(event, true)) return;
    if (!active.current) return;
    move(event);
    const stroke = active.current!;
    active.current = undefined;
    setLive(undefined);
    ended([...pending.current, stroke]);
  }
  function cancel() {
    active.current = undefined;
    setLive(undefined);
    setDrawing(false);
  }
  function cancelAndCheck() {
    pause();
    cancel();
    panning.current = false;
    resumeCheck();
  }
  function choose(index: number) {
    clear();
    setPeek(false);
    session.selectSheet(index);
    scrollY.current = 0;
    scroll.current?.scrollTo({ y: 0, animated: false });
  }
  function undo() {
    pause();
    rejection.cancel();
    cancel();
    if (pending.current.length) {
      pending.current = pending.current.slice(0, -1);
      setStrokes(pending.current);
      if (!pending.current.length) setDrawing(false);
      else timer.current = setTimeout(() => check(), 400);
    } else session.undo();
    setFeedback("");
  }
  function changeDifficulty(difficulty: NotebookDifficulty) {
    session.setDifficulty(difficulty);
    pause();
    rejection.cancel();
    if (pending.current.length && !active.current)
      timer.current = setTimeout(() => check(difficulty), 400);
  }
  if (!sheet || !character || !page)
    return <Text>This writing exercise has no available characters.</Text>;
  const index = notebook.sheets.findIndex((s) => s.id === sheet.id),
    visible = phase !== "Recall" || peek;

  const cellMarks = geometry.cells.map((cell, i) => {
    const written = page.cells[i],
      model = sheet.characters[cell.characterIndex]!,
      guide = sheet.phases[cell.repetition] === "Trace" && !written;
    return (
      <G
        key={i}
        transform={`translate(${cell.x} ${cell.y})`}
        testID={"mobile-writing-cell-" + i}
      >
        <Rect
          width={cell.size}
          height={cell.size}
          rx={i === count ? 7 : 0}
          fill={
            i === count && !session.complete
              ? rejection.phase !== "idle"
                ? "#fbede6"
                : "#eef6ec"
              : "none"
          }
          stroke={
            i === count
              ? rejection.phase !== "idle"
                ? "#a34935"
                : "#007c78"
              : "#abcbd4"
          }
          strokeWidth={i === count ? 1.8 : 0.6}
        />
        <Path
          d={`M 0 ${cell.size / 2} H ${cell.size} M ${cell.size / 2} 0 V ${cell.size}`}
          stroke="#bed6db"
          strokeWidth={0.6}
          strokeDasharray="2 4"
        />
        <G transform={`scale(${cell.size / 100})`}>
          {guide
            ? model.strokes.map((s) => (
                <Path
                  key={s.id}
                  d={getWritingStrokePath(s.points)}
                  fill="none"
                  stroke="#608c86"
                  strokeWidth={2}
                  strokeDasharray="1 4"
                  strokeLinecap="round"
                />
              ))
            : null}
          {written?.strokes.map((s, k) => (
            <Path
              key={k}
              testID={`mobile-writing-cell-${i}-ink-${k}`}
              d={getWritingStrokePath(s.points)}
              fill="none"
              stroke="#263238"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </G>
        {written && !written.strokes.length ? (
          <SvgText
            x={cell.size / 2}
            y={cell.size / 2 + 7}
            fontSize={20}
            textAnchor="middle"
            fill="#00645f"
          >
            ✓
          </SvgText>
        ) : null}
      </G>
    );
  });

  return (
    <View style={styles.stack} testID="mobile-writing-notebook">
      <ScrollView
        horizontal
        contentContainerStyle={styles.toolbar}
        testID="mobile-writing-sheet-picker"
      >
        {notebook.sheets.map((s, i) => (
          <View key={s.id}>
            {
              <NotebookButton
                label={`${i + 1} · ${visible ? s.label : s.romaji}${session.snapshot.pages[s.id]!.bestCount >= 24 * s.characters.length ? " ✓" : ""}`}
                id={"sheet-" + s.id}
                onPress={() => choose(i)}
                disabled={
                  !isNotebookSheetUnlocked(notebook, session.snapshot, i) ||
                  session.loading ||
                  session.loadFailed
                }
                selected={index === i}
              />
            }
          </View>
        ))}
      </ScrollView>
      <Text style={styles.caption} testID="mobile-writing-sheet-progress">
        {phase} · Sheet {index + 1} of {notebook.sheets.length} ·{" "}
        {Math.floor(count / sheet.characters.length)} / 24 repetitions
      </Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Sheet progress"
        accessibilityValue={{
          min: 0,
          max: 24 * sheet.characters.length,
          now: count,
        }}
        style={styles.track}
      >
        <View
          style={[
            styles.fill,
            { width: `${(100 * count) / (24 * sheet.characters.length)}%` },
          ]}
        />
      </View>
      <View style={styles.example} testID="mobile-writing-example">
        <View style={styles.exampleSummary}>
          <Text style={styles.glyph} accessibilityLanguage="ja-JP">
            {visible ? sheet.label : "Write from memory"}
          </Text>
          <View style={{ flex: 1, minWidth: 120 }}>
            <Text style={styles.caption}>
              {sheet.romaji} · {sheet.meaning}
            </Text>
            <Text style={styles.caption}>
              {character.romaji} /{character.ipa}/
            </Text>
          </View>
        </View>
        {phase === "Recall" ? (
          <NotebookButton
            label={peek ? "Hide example" : "Show example"}
            id={"peek"}
            onPress={() => setPeek((v) => !v)}
          />
        ) : null}
      </View>
      <Text style={styles.caption}>Handwriting difficulty</Text>
      <View style={styles.toolbar}>
        {notebookDifficultyOptions.map((option) => (
          <NotebookButton
            key={option.value}
            id={"difficulty-" + option.value}
            label={option.label}
            onPress={() => changeDifficulty(option.value)}
            selected={session.difficulty === option.value}
            disabled={session.loading || session.loadFailed}
          />
        ))}
      </View>
      <View style={styles.toolbar}>
        {
          <NotebookButton
            label={"Undo"}
            id={"undo"}
            onPress={undo}
            disabled={!strokes.length && !count}
          />
        }
        {
          <NotebookButton
            label={"Clear current character"}
            id={"clear"}
            onPress={clear}
          />
        }
      </View>
      <View
        style={styles.feedback}
        accessibilityLiveRegion="polite"
        testID="mobile-writing-feedback-slot"
      >
        <Text style={styles.caption}>
          {session.loading
            ? "Opening your notebook…"
            : session.saveError ||
              (session.complete
                ? "Sheet complete! All 24 repetitions. Your next sheet is unlocked."
                : feedback ||
                  "One finger or stylus writes. Two fingers scroll. Pause to check the character.")}
        </Text>
        {session.saveError ? (
          <NotebookButton label="Retry" id="save-retry" onPress={session.retry} />
        ) : null}
      </View>
      <ScrollView
        ref={scroll}
        nestedScrollEnabled
        // One contact draws. Native scrolling would move the coordinates under
        // that stroke; two-finger pan and accessibility actions scroll explicitly.
        scrollEnabled={false}
        accessible
        accessibilityLabel={"Notebook paper for " + sheet.romaji}
        accessibilityActions={[
          { name: "scrollForward", label: "Scroll down" },
          { name: "scrollBackward", label: "Scroll up" },
        ]}
        onAccessibilityAction={(event) => {
          if (!["scrollForward", "scrollBackward"].includes(event.nativeEvent.actionName)) return;
          panPaper(0, "began");
          panPaper(event.nativeEvent.actionName === "scrollForward" ? 300 : -300, "changed");
          panPaper(0, "ended");
        }}
        style={styles.viewport}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        testID="mobile-writing-notebook-viewport"
      >
        <View
          onLayout={(event) => {
            setWidth(Math.max(280, event.nativeEvent.layout.width));
          }}
          style={{ height: geometry.height, backgroundColor: "#fffdf5" }}
          testID="mobile-writing-pad"
          collapsable={false}
          onPointerMove={(event) => {
            if (Number.isFinite(event.nativeEvent.pressure))
              pointerPressure.current = event.nativeEvent.pressure;
          }}
          onPointerDown={(event) => {
            pointerPressure.current = Number.isFinite(
              event.nativeEvent.pressure,
            )
              ? event.nativeEvent.pressure
              : 0.5;
            pointer.current = event.nativeEvent.pointerType;
            if (pointer.current === "pen") {
              cancel();
              holdPen();
            }
          }}
          onPointerUp={() => { pointer.current = "touch"; }}
          onStartShouldSetResponder={(event) =>
            !Canvas && ((event?.nativeEvent.touches?.length ?? 0) >= 2 ||
            (!session.complete && !session.loading && !session.loadFailed))
          }
          onResponderStart={touchStart}
          onResponderEnd={(event) => { if (panning.current) touchPan(event, true); }}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(event) => {
            grant(event);
            // Match PanResponder's native-blocking grant. Android otherwise
            // lets an ancestor ScrollView cancel vertical handwriting.
            return true;
          }}
          onResponderMove={move}
          onResponderRelease={release}
          onResponderTerminate={cancelAndCheck}
        >
          <View pointerEvents="none">
            <Svg
              width="100%"
              height={geometry.height}
              viewBox={`0 0 ${width} ${geometry.height}`}
            >
              <Path
                d={`M 30 0 V ${geometry.height}`}
                stroke="#deb8a8"
                strokeWidth={1}
              />
              <SvgText x={48} y={32} fontSize={11} fill="#526873">
                MY JAPANESE NOTEBOOK
              </SvgText>
              <SvgText x={48} y={76} fontSize={32} fill="#263238">
                {visible ? sheet.label : sheet.romaji}
              </SvgText>
              {cellMarks.filter((_, i) => session.complete || i !== count)}
            </Svg>
          </View>

          {!session.complete ? (
            <Animated.View
              pointerEvents="none"
              testID={`mobile-writing-cell-${count}-feedback`}
              accessibilityState={{ busy: rejection.phase !== "idle" }}
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateX: bounce }] },
              ]}
            >
              <Svg
                width="100%"
                height={geometry.height}
                viewBox={`0 0 ${width} ${geometry.height}`}
              >
                {cellMarks[count]}
              </Svg>
            </Animated.View>
          ) : null}
          <Animated.View
            pointerEvents={Canvas ? "auto" : "none"}
            testID="mobile-writing-pending-ink"
            accessibilityState={{ busy: rejection.phase !== "idle" }}
            style={[StyleSheet.absoluteFill, { opacity: inkOpacity }]}
          >
            {Canvas ? (
              <Canvas
                resetKey={resetKey}
                strokeCount={strokes.length}
                disabled={
                  session.loading || session.loadFailed || session.complete
                }
                style={StyleSheet.absoluteFill}
                onBegin={begin}
                onEnd={ended}
                onPan={panPaper}
              />
            ) : (
              <Svg
                width="100%"
                height={geometry.height}
                viewBox={`0 0 ${width} ${geometry.height}`}
              >
                {[...strokes, ...(live ? [live] : [])].map((s, i) => (
                  <Path
                    key={i}
                    testID={"mobile-writing-ink-" + i}
                    d={getWritingStrokePath(s.points, false)}
                    fill="none"
                    stroke={rejection.phase === "idle" ? "#263238" : "#a34935"}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </Svg>
            )}
          </Animated.View>
        </View>
      </ScrollView>
      <View style={styles.toolbar}>
        {index + 1 < notebook.sheets.length ? (
          <NotebookButton
            label={"Next sheet"}
            id={"next-sheet"}
            onPress={() => choose(index + 1)}
            disabled={!session.complete}
          />
        ) : null}
        {session.allRequiredComplete && nextHref ? (
          <NotebookButton
            label={"Next activity"}
            id={"next-node"}
            onPress={() => adapters.navigation.navigate(nextHref)}
          />
        ) : null}
        {
          <NotebookButton
            label={"Clear and restart sheet"}
            id={"repeat"}
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
                <Path d="M3 11a9 9 0 1 1 9 9M3 3v8h8" stroke="#33434b" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
            onPress={() => {
              clear();
              session.restart();
              setPeek(false);
              scroll.current?.scrollTo({ y: 0, animated: false });
            }}
            disabled={session.loading || session.loadFailed}
          />
        }
      </View>
      <View style={styles.toolbar}>
        <Text
          accessibilityRole="link"
          style={styles.caption}
          testID="mobile-writing-source"
          onPress={() =>
            adapters.navigation.openExternalUrl?.(
              "https://kanjivg.tagaini.net/",
            )
          }
        >
          Stroke guides: KanjiVG · Ulrich Apel and contributors
        </Text>
        <Text
          accessibilityRole="link"
          style={styles.caption}
          onPress={() =>
            adapters.navigation.openExternalUrl?.(
              "https://creativecommons.org/licenses/by-sa/3.0/",
            )
          }
        >
          CC BY-SA 3.0
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  stack: { gap: 10 },
  toolbar: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  caption: { fontSize: 14, lineHeight: 21, color: "#455966" },
  glyph: { fontSize: 32, color: "#263238" },
  example: { gap: 8, alignItems: "flex-start" },
  exampleSummary: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  track: { height: 5, backgroundColor: "#dce8e4", borderRadius: 3 },
  fill: { height: 5, backgroundColor: "#007c78", borderRadius: 3 },
  viewport: {
    height: 460,
    borderWidth: 1,
    borderColor: "#8da9aa",
    borderRadius: 16,
  },
  feedback: { minHeight: 64, justifyContent: "center", gap: 4 },
});

function NotebookButton({
  label,
  id,
  onPress,
  disabled = false,
  selected = false,
  icon,
}: {
  label: string;
  id: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  icon?: ReactNode;
}) {
  const tone = id === "repeat" || id === "clear" || id === "save-retry" ? "warning" : id.startsWith("next-") ? "success" : id === "peek" ? "assist" : selected ? "info" : "neutral";
  return <Button label={label} icon={icon} tone={tone} variant={id.startsWith("next-") ? "primary" : "secondary"} selected={selected} disabled={disabled} onPress={onPress} testID={"mobile-writing-" + id} />;
}
