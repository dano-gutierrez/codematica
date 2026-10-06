import { AdaptiveText as Text } from "../AdaptiveText";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { WebView } from "react-native-webview";
import {
  awardKey,
  MAP_PANELS,
  awardScenario,
  gameTotals,
  getStreak,
  isLevelUnlocked,
  levelStars,
  getGameSession,
  gameSandboxHtml,
  type GameStore,
  type GameCampaign,
  type GameLevel,
  type EvaluationResult,
} from "@codematica/core/game";
import { useSharedValue } from "react-native-reanimated";
import { SaveProgressPrompt } from "../screens";
import { NativeDistrictArt } from "./NativeDistrictArt";
import { NativeGameBoard } from "./NativeGameBoard";
import { NativeGameScene } from "./NativeGameScene";
type Props = {
  campaign: GameCampaign;
  store: GameStore;
  navigate: (route: string) => void;
  isAuthConfigured?: boolean;
};
function Action({
  label,
  onPress,
  disabled = false,
  id,
  selected = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  id?: string;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      accessibilityLabel={label}
      testID={id}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        selected && styles.selected,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[styles.buttonText, selected && { color: "#fff4d6" }]}>
        {label}
      </Text>
    </Pressable>
  );
}
let mapOffset: number | undefined;
function useSceneVisibility() {
  const measurements = useRef<{
    bounds: { y: number; height: number } | null;
    offset: number;
    height: number | null;
  }>({ bounds: null, offset: 0, height: null });
  const [visible, setVisible] = useState(true);
  const refresh = () => {
    const { bounds, offset, height } = measurements.current;
    setVisible(bounds === null || height === null || (
      bounds.y + bounds.height > offset && bounds.y < offset + height
    ));
  };
  return {
    visible,
    onSceneLayout: ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      measurements.current.bounds = { y: layout.y, height: layout.height };
      refresh();
    },
    onViewportLayout: ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      measurements.current.height = layout.height;
      refresh();
    },
    onScroll: ({ nativeEvent: { contentOffset } }: NativeSyntheticEvent<NativeScrollEvent>) => {
      measurements.current.offset = contentOffset.y;
      refresh();
    },
  };
}
export function NativeGameMap({ campaign, store, navigate, isAuthConfigured = false, active = true }: Props & { active?: boolean }) {
  const { fontScale } = useWindowDimensions();
  const sceneViewport = useSceneVisibility();
  const storageStatus = useSyncExternalStore(
    store.subscribe,
    store.getStatus,
    store.getStatus,
  );
  const p = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const [loaded, setLoaded] = useState(false),
    [list, setList] = useState(false);
  const terrainToken = useMemo(() => ({ fontScale, list }), [fontScale, list]);
  const currentTerrain = useRef(terrainToken);
  const scroll = useRef<ScrollView>(null),
    scrollValue = useSharedValue(0),
    [viewport, setViewport] = useState(0),
    [panelHeight, setPanelHeight] = useState(620),
    [panelLayouts, setPanelLayouts] = useState<Record<string, { y: number; height: number }>>({}),
    [screenHeight, setScreenHeight] = useState(700);
  const positioned = useRef(false),
    initialOffset = useRef(mapOffset),
    measurements = useRef<{
      height: number;
      contentHeight: number;
      districts: Record<string, number>;
      nodes: Record<string, { y: number; height: number }>;
    }>({ height: 700, contentHeight: 0, districts: {}, nodes: {} });
  useLayoutEffect(() => {
    if (currentTerrain.current === terrainToken) return;
    currentTerrain.current = terrainToken;
    positioned.current = false;
    initialOffset.current = undefined;
    mapOffset = undefined;
    measurements.current.contentHeight = 0;
    measurements.current.districts = {};
    measurements.current.nodes = {};
  }, [terrainToken]);
  const totals = gameTotals(p),
    current =
      campaign.levels.find(
        (l) => !p.awards[awardKey(campaign.id, l.id, "main")],
      ) ?? campaign.levels.at(-1)!;
  const centerCurrent = useCallback(() => {
    if (currentTerrain.current !== terrainToken) return;
    const m = measurements.current,
      target = list ? campaign.levels[0] : current,
      node = m.nodes[target.id],
      districtY = m.districts[target.district];
    if (
      !loaded ||
      positioned.current ||
      !node ||
      districtY === undefined ||
      m.contentHeight < districtY + node.y + node.height
    )
      return;
    positioned.current = true;
    scroll.current?.scrollTo({
      y:
        (list ? undefined : initialOffset.current) ??
        Math.max(0, districtY + node.y + node.height / 2 - m.height / 2),
      animated: false,
    });
  }, [loaded, list, current, campaign.levels, terrainToken]);
  useEffect(() => {
    void store.load().finally(() => setLoaded(true));
  }, [store]);
  useEffect(() => {
    centerCurrent();
  }, [centerCurrent]);
  const recordPanelLayout = (id: string, layout: LayoutChangeEvent["nativeEvent"]["layout"]) => {
    const { y } = layout;
    const height = layout.height ?? panelHeight;
    setPanelLayouts(previous => previous[id]?.y === y && previous[id]?.height === height
      ? previous
      : { ...previous, [id]: { y, height } });
  };
  return (
    <View style={styles.screen}>
      <View style={styles.mapToolbar}>
        <Action
          label={list ? "Map" : "Level list"}
          id="game-map-view"
          onPress={() => setList(!list)}
        />
        <Action label="Explore lessons" onPress={() => navigate("/learn")} />
      </View>
    <ScrollView
      key={`${fontScale}:${list}`}
      ref={scroll}
      testID="game-map"
      style={styles.screen}
      contentContainerStyle={styles.content}
      onScroll={(e) => {
        if (currentTerrain.current !== terrainToken) return;
        sceneViewport.onScroll(e);
        const offset = e.nativeEvent.contentOffset.y;
        if (!list && positioned.current) mapOffset = offset;
        scrollValue.value = offset;
        setViewport(Math.floor(offset / 400) * 400);
      }}
      scrollEventThrottle={16}
      onLayout={(e) => {
        if (currentTerrain.current !== terrainToken) return;
        sceneViewport.onViewportLayout(e);
        measurements.current.height = e.nativeEvent.layout.height;
        setScreenHeight(e.nativeEvent.layout.height);
        setPanelHeight(
          Math.max(620, (e.nativeEvent.layout.width ?? 390) * 1.5),
        );
        centerCurrent();
      }}
      onContentSizeChange={(_width, height) => {
        if (currentTerrain.current !== terrainToken) return;
        measurements.current.contentHeight = height;
        centerCurrent();
      }}
    >
      {storageStatus ? (
        <Text accessibilityLiveRegion="polite">{storageStatus}</Text>
      ) : null}
      <Text style={styles.eyebrow}>CODEMATICA · CHAPTER ONE</Text>
      <Text style={styles.title}>Restore the signal.</Text>
      <Text style={styles.body}>
        A city gone quiet. A little robot with a big repair list.
      </Text>
      <Text style={styles.stats}>
        ★ {totals.stars}/36 · {totals.xp} XP · {getStreak(p)} day streak
      </Text>
      <View testID="game-scene-region" onLayout={sceneViewport.onSceneLayout}>
        <NativeGameScene cosmetic={p.cosmetic} visible={active && sceneViewport.visible} />
      </View>
      <Text style={styles.heading}>Small fixes. A brighter city.</Text>
      <Action
        label="Continue the story"
        id="game-continue"
        onPress={() => navigate(`/play/${campaign.id}/${current.id}`)}
      />
      {!list &&
        MAP_PANELS.filter((panel) => !("district" in panel)).map((panel, i) => (
          <View
            key={panel.id}
            testID={`game-frontier-${panel.id}`}
            style={[styles.district, { minHeight: panelHeight }]}
            onLayout={(e) => {
              if (currentTerrain.current !== terrainToken) return;
              const y = e.nativeEvent.layout.y;
              measurements.current.districts[panel.id] = y;
              recordPanelLayout(panel.id, e.nativeEvent.layout);
            }}
          >
            {Math.abs(
              viewport - (panelLayouts[panel.id]?.y ?? 700 + i * panelHeight),
            ) <
              (panelLayouts[panel.id]?.height ?? panelHeight) + screenHeight + 400 && (
              <NativeDistrictArt
                district="tower"
                panel={panel.id}
                panelTop={panelLayouts[panel.id]?.y ?? 700 + i * panelHeight}
                scroll={scrollValue}
                restored={false}
                details={0}
              />
            )}
            {i % 3 === 0 && (
              <View style={styles.frontierLabel}>
                <Text style={styles.eyebrow}>
                  BEYOND THE SIGNAL · SCENERY PREVIEW
                </Text>
                <Text style={styles.heading}>
                  {i === 0
                    ? "The quiet summit"
                    : i === 3
                      ? "Lantern woods"
                      : "Glasshouse heights"}
                </Text>
                <Text style={styles.body}>
                  Trail space for levels{" "}
                  {i === 0 ? "37–50" : i === 3 ? "25–36" : "13–24"}
                </Text>
                <Action
                  label="Return to current level"
                  onPress={() => {
                    positioned.current = false;
                    initialOffset.current = undefined;
                    mapOffset = undefined;
                    centerCurrent();
                  }}
                />
              </View>
            )}
          </View>
        ))}
      {(list ? ["garden", "canal", "tower"] : ["tower", "canal", "garden"]).map(
        (district, index) => {
          const levels = campaign.levels.filter((l) => l.district === district);
          const landmark = levels.at(-1)!;
          const restored =
            !!p.awards[awardKey(campaign.id, landmark.id, "main")];
          return (
            <View
              key={district}
              testID={`game-district-${district}`}
              onLayout={(e) => {
                if (currentTerrain.current !== terrainToken) return;
                measurements.current.districts[district] =
                  e.nativeEvent.layout.y;
                recordPanelLayout(district, e.nativeEvent.layout);
                centerCurrent();
              }}
              style={[
                styles.district,
                list ? { minHeight: 0 } : { minHeight: panelHeight },
              ]}
            >
              {!list &&
              Math.abs(
                viewport -
                  (panelLayouts[district]?.y ?? 700 + (9 + index) * panelHeight),
              ) <
                (panelLayouts[district]?.height ?? panelHeight) + screenHeight + 400 ? (
                <NativeDistrictArt
                  district={district as "garden" | "canal" | "tower"}
                  panel={`city-${index}` as "city-0" | "city-1" | "city-2"}
                  panelTop={
                    panelLayouts[district]?.y ?? 700 + (9 + index) * panelHeight
                  }
                  scroll={scrollValue}
                  restored={restored}
                  details={
                    levels.filter(
                      (l) => p.awards[awardKey(campaign.id, l.id, "main")],
                    ).length
                  }
                />
              ) : null}
              <Text style={styles.districtTitle}>
                {district === "garden"
                  ? "The garden outpost"
                  : district === "canal"
                    ? "The canal works"
                    : "The signal tower"}
                {restored ? " · Restored" : ""}
              </Text>
              {(list ? levels : [...levels].reverse()).map((l, i) => (
                <View
                  key={l.id}
                  testID={`game-stop-${l.order}`}
                  onLayout={(e) => {
                    if (currentTerrain.current !== terrainToken) return;
                    measurements.current.nodes[l.id] = {
                      y: e.nativeEvent.layout.y,
                      height: e.nativeEvent.layout.height,
                    };
                    centerCurrent();
                  }}
                  style={[
                    styles.stop,
                    !list && { alignSelf: i % 2 ? "flex-end" : "flex-start" },
                  ]}
                >
                  <Action
                    label={`${l.order}. ${l.title}`}
                    id={`game-level-${l.order}`}
                    disabled={!loaded || !isLevelUnlocked(campaign, l.id, p)}
                    onPress={() => navigate(`/play/${campaign.id}/${l.id}`)}
                  />
                  {!isLevelUnlocked(campaign, l.id, p) ? (
                    <Text style={styles.stopText}>
                      Complete the preceding level to unlock
                    </Text>
                  ) : null}
                  <Text style={styles.stopText}>
                    {"★".repeat(levelStars(p, campaign.id, l.id))}
                    {"☆".repeat(3 - levelStars(p, campaign.id, l.id))} ·{" "}
                    {l.kind}
                    {l.mode === "defense" ? " · LIVE" : ""}
                  </Text>
                </View>
              ))}
            </View>
          );
        },
      )}
      <SaveProgressPrompt
        itemCount={store.isAnonymous() ? totals.stars : 0}
        adapters={{ navigation: { navigate }, auth: { isConfigured: isAuthConfigured } }}
      />
      <Text style={styles.heading}>Patch’s workshop</Text>
      <Text style={styles.body}>
        Attachments unlock at 6, 18, and 30 stars.
      </Text>
      <View style={styles.row}>
        {totals.cosmetics.map((c) => (
          <Action
            key={c}
            label={c}
            selected={c === p.cosmetic}
            onPress={() =>
              void store.save({
                ...p,
                cosmetic: c as typeof p.cosmetic,
                updatedAt: new Date().toISOString(),
              })
            }
          />
        ))}
      </View>
    </ScrollView>
    </View>
  );
}
export function NativeGamePlay({
  campaign,
  level,
  store,
  navigate,
  workerSource,
  active = true,
}: Props & { level: GameLevel; workerSource: string; active?: boolean }) {
  const [session] = useState(() => getGameSession(campaign.id, level)),
    [loaded, setLoaded] = useState(false),
    [from, setFrom] = useState(""),
    [output, setOutput] = useState<{ html: string; nonce: string } | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [runnerLoaded, setRunnerLoaded] = useState(false),
    [editor, setEditor] = useState(() => ({ generation: 0, text: session.getSnapshot().code }));
  const runnerNonce = useRef<string | null>(null);
  const editorGeneration = useRef(0);
  const cancelRunner = useCallback(() => {
    runnerNonce.current = null;
    setBusy(false);
    setRunnerLoaded(false);
    setOutput(null);
  }, []);
  const storageStatus = useSyncExternalStore(
    store.subscribe,
    store.getStatus,
    store.getStatus,
  );
  const p = useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot,
    ),
    s = useSyncExternalStore(
      session.subscribe,
      session.getSnapshot,
      session.getSnapshot,
    );
  useEffect(() => {
    if (!active) return;
    void store.load().finally(() => setLoaded(true));
    const timer = setInterval(() => session.tick(), 1000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") session.pause();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
      cancelRunner();
      session.pause();
    };
  }, [store, session, active, cancelRunner]);
  useEffect(() => {
    if (!active || !loaded || s.attempt.phase !== "won") return;
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
  }, [active, loaded, s.attempt.phase, session, store, campaign, level.id]);
  useEffect(() => {
    if (!active || !busy) return;
    const timeout = setTimeout(() => {
      cancelRunner();
      session.submit({
        passed: false,
        reasons: [runnerLoaded
          ? "The local runner timed out. Retry your solution."
          : "The local runner could not start. Retry your solution."],
        events: [],
      });
    }, runnerLoaded ? 10000 : 30000);
    return () => clearTimeout(timeout);
  }, [active, busy, runnerLoaded, session, cancelRunner]);
  const sceneViewport = useSceneVisibility();
  const editable = active && session.editable && !busy,
    sc = s.scenario;
  const reseedEditor = () => {
    setEditor({ generation: ++editorGeneration.current, text: session.getSnapshot().code });
  };
  const run = () => {
    if (!editable) return;
    const current = session.getSnapshot();
    if (current.scenario.kind === "grid" || current.scenario.kind === "sql") {
      const nonce = `${Date.now()}-${Math.random()}`;
      runnerNonce.current = nonce;
      setRunnerLoaded(false);
      setBusy(true);
      setOutput({
        nonce,
        html: gameSandboxHtml(current.scenario, current.code, workerSource, nonce),
      });
    } else session.run();
  };
  const reset = () => {
    cancelRunner();
    setFrom("");
    session.reset();
    reseedEditor();
  };
  if (!loaded) return <Text>Preparing the workshop…</Text>;
  if (!isLevelUnlocked(campaign, level.id, p))
    return (
      <View style={styles.content}>
        <Text style={styles.heading}>
          Complete the preceding level to unlock {level.title}.
        </Text>
        <Action label="Story map" onPress={() => navigate("/")} />
      </View>
    );
  const ports =
    sc.kind === "pipes" ? sc.pieces.flatMap((piece) => piece.ports) : [];
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        onScroll={sceneViewport.onScroll}
        onLayout={sceneViewport.onViewportLayout}
        scrollEventThrottle={100}
        testID="game-play"
        keyboardShouldPersistTaps="handled"
        style={styles.screen}
        contentContainerStyle={styles.content}
      >
        {storageStatus ? (
          <Text accessibilityLiveRegion="polite">{storageStatus}</Text>
        ) : null}
        <Action
          label="← Story map"
          onPress={() => {
            session.pause();
            navigate("/");
          }}
        />
        <Text style={styles.eyebrow}>
          LEVEL {level.order} ·{" "}
          {level.mode === "defense" ? "LIVE DEFENSE" : "TAKE YOUR TIME"}
        </Text>
        <Text style={styles.title}>{level.title}</Text>
        <Text style={styles.body}>{level.story}</Text>
        <View style={styles.row}>
          {level.scenarios.map((variant, i) => (
            <Action
              key={variant.id}
              id={`game-scenario-${variant.id}`}
              label={i === 0 ? "Story" : `Mastery ${i}`}
              selected={sc.id === variant.id}
              disabled={
                i > 0 && !p.awards[awardKey(campaign.id, level.id, "main")]
              }
              onPress={() => {
                cancelRunner();
                setFrom("");
                session.choose(variant.id);
                reseedEditor();
              }}
            />
          ))}
        </View>
        <View
          testID="game-scene-region"
          onLayout={sceneViewport.onSceneLayout}
        >
          <NativeGameScene
            visible={active && sceneViewport.visible}
            cosmetic={p.cosmetic}
            state={
              s.attempt.phase === "won"
                ? "celebrate"
                : (s.attempt.phase === "running" || s.attempt.phase === "paused")
                  ? "attack"
                  : "idle"
            }
            paused={s.attempt.phase === "paused"}
          />
        </View>
        <Text style={styles.heading}>{sc.title}</Text>
        <Text style={styles.body}>{sc.objective}</Text>
        {sc.kind === "sql" || sc.kind === "grid" ? (
          <>
            <Text style={styles.eyebrow}>
              {sc.kind === "sql" ? "SQL QUERY" : "CSS DECLARATIONS"}
            </Text>
            <TextInput
              key={editor.generation}
              accessibilityLabel={
                sc.kind === "sql" ? "SQL query" : "CSS declarations"
              }
              testID="game-code"
              style={styles.code}
              multiline
              autoCorrect={false}
              autoCapitalize="none"
              maxLength={4096}
              // Native owns typing/caret; resetting or choosing reseeds once.
              defaultValue={editor.text}
              editable={editable}
              onChangeText={(text) => {
                if (editor.generation !== editorGeneration.current) return;
                cancelRunner();
                session.edit(text);
              }}
            />
            {sc.kind === "sql" ? (
              <ScrollView horizontal>
                <View>
                  <Text style={styles.mono}>
                    zombies: id | kind | zone | threat | shield
                  </Text>
                  {sc.zombies.map((z) => (
                    <Text style={styles.mono} key={z.id}>
                      {Object.values(z)
                        .map((v) => (v === null ? "NULL" : v))
                        .join(" | ")}
                    </Text>
                  ))}
                  <Text style={styles.mono}>zones: name | evacuated</Text>
                  {sc.zones.map((z) => (
                    <Text style={styles.mono} key={z.name}>
                      {z.name} | {z.evacuated}
                    </Text>
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </>
        ) : null}
        {sc.kind === "pipes"
          ? sc.pieces.map((piece) => (
              <View style={styles.piece} key={piece.id}>
                <Text style={styles.heading}>{piece.label}</Text>
                {piece.ports.map((port) => (
                  <Action
                    key={port.id}
                    id={`game-port-${port.id}`}
                    selected={from === port.id}
                    label={`${port.direction === "out" ? "↗" : "↘"} ${port.label} · ${port.signal}`}
                    disabled={
                      !editable ||
                      (port.direction === "in" &&
                        (!from ||
                          ports.find((p) => p.id === from)?.signal !==
                            port.signal))
                    }
                    onPress={() => {
                      if (port.direction === "out") setFrom(port.id);
                      else {
                        session.connect({ from, to: port.id });
                        setFrom("");
                      }
                    }}
                  />
                ))}
              </View>
            ))
          : null}
        {sc.kind === "system" ? (
          <>
            <Text style={styles.stats}>
              {sc.rps}/sec · {sc.readRatio * 100}% reads · budget {sc.budget}
            </Text>
            <Text style={styles.body}>
              Place components, then select an origin and a destination.
              Capacities are scenario assumptions.
            </Text>
            <View style={styles.row}>
              {sc.components.map((c) => (
                <Action
                  key={c.id}
                  id={`game-piece-${c.id}`}
                  disabled={!editable}
                  selected={s.board.nodes.includes(c.id)}
                  label={`${c.label} · ${c.cost} cost · ${c.capacity}/sec`}
                  onPress={() => session.place(c.id)}
                />
              ))}
            </View>
            <NativeGameBoard
              scenario={sc}
              board={s.board}
              selected={from}
              disabled={!editable}
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
            <Action
              label={`Routing: ${(s.board.routing ?? "round-robin") === "round-robin" ? "round robin" : "capacity weighted"}`}
              id="game-routing"
              disabled={!editable}
              onPress={() =>
                session.configure({
                  routing:
                    s.board.routing === "capacity-weighted"
                      ? "round-robin"
                      : "capacity-weighted",
                })
              }
            />
            <Action
              label={`Health checks: ${s.board.healthChecks !== false ? "on" : "off"}`}
              id="game-health-checks"
              disabled={!editable}
              onPress={() =>
                session.configure({
                  healthChecks: s.board.healthChecks === false,
                })
              }
            />
            <Action
              id="game-invalidate"
              label={`Invalidate after writes: ${s.board.invalidate ? "on" : "off"}`}
              disabled={!editable}
              selected={s.board.invalidate}
              onPress={() => session.invalidate(!s.board.invalidate)}
            />
          </>
        ) : null}
        <View style={styles.row}>
          {(sc.kind === "pipes" ? s.edges : s.board.edges).map((e) => (
            <Action
              key={`${e.from}-${e.to}`}
              disabled={!editable}
              label={`${e.from} → ${e.to} ×`}
              onPress={() => session.connect(e)}
            />
          ))}
        </View>
        {output || sc.kind === "grid" ? (
          <WebView
            key={output?.nonce ?? "preview"}
            testID="game-sandbox"
            source={{
              html:
                output?.html ??
                (sc.kind === "grid"
                  ? gameSandboxHtml(sc, s.code, "", "preview")
                  : ""),
            }}
            originWhitelist={["about:blank"]}
            onShouldStartLoadWithRequest={(request) =>
              request.url === "about:blank"
            }
            javaScriptEnabled
            allowFileAccess={false}
            allowUniversalAccessFromFileURLs={false}
            setSupportMultipleWindows={false}
            style={{ height: 350, backgroundColor: "#edf4e9" }}
            onLoadEnd={() => {
              if (runnerNonce.current && output?.nonce === runnerNonce.current)
                setRunnerLoaded(true);
            }}
            onMessage={(event) => {
              try {
                const message = JSON.parse(event.nativeEvent.data);
                if (
                  !runnerNonce.current ||
                  output?.nonce !== runnerNonce.current ||
                  message.channel !== "codematica-game" ||
                  message.nonce !== runnerNonce.current ||
                  typeof message.result?.passed !== "boolean"
                )
                  return;
                runnerNonce.current = null;
                setBusy(false);
                session.submit(message.result as EvaluationResult);
              } catch {
                // Ignore malformed messages; the bounded runner can still reply.
              }
            }}
            onError={() => {
              if (!runnerNonce.current || output?.nonce !== runnerNonce.current)
                return;
              cancelRunner();
              session.submit({
                passed: false,
                reasons: ["The local runner failed. Please retry."],
                events: [],
              });
            }}
          />
        ) : null}
        <View style={styles.row}>
          {s.attempt.phase === "running" ? (
            <Action
              label="Pause"
              id="game-pause"
              onPress={() => session.pause()}
            />
          ) : s.attempt.phase === "paused" ? (
            <Action
              label="Resume"
              id="game-resume"
              onPress={() => session.resume()}
            />
          ) : (
            <Action
              label={
                busy
                  ? runnerLoaded ? "Running…" : "Starting runner…"
                  : level.mode === "defense" && !s.attempt.assisted
                    ? "Start defense"
                    : "Run solution"
              }
              id="game-run"
              disabled={!editable}
              onPress={run}
            />
          )}
          <Action label="Reset" id="game-reset" onPress={reset} />
        </View>
        {level.mode === "defense" ? (
          <>
            <Text style={styles.stats}>
              Integrity {s.attempt.health}% · {s.attempt.elapsed}/24s ·{" "}
              {s.attempt.phase}
            </Text>
            <Text style={styles.body}>
              {s.attempt.phase === "paused"
                ? "Editing is frozen while paused."
                : "Waves continue while editing. Assisted mode earns the same rewards."}
            </Text>
            <Action
              id="game-assist"
              label="Use assisted untimed mode"
              onPress={() => session.assist()}
            />
          </>
        ) : null}
        <Text style={styles.heading}>Patch’s field notes</Text>
        <Action
          label="Next hint"
          id="game-hint"
          onPress={() => session.hint()}
        />
        {sc.hints.slice(0, s.hints).map((hint, i) => (
          <Text style={styles.hint} key={i}>
            {hint}
          </Text>
        ))}
        <Text style={styles.heading}>
          {s.failures >= 2 ? "Let’s revisit the idea" : "Learn the idea"}
        </Text>
        {level.lessonSlugs.map((slug) => (
          <Action
            key={slug}
            label={slug.split("/").at(-1)!.replaceAll("-", " ")}
            onPress={() => {
              session.pause();
              navigate(
                `/docs/${slug}?returnTo=${encodeURIComponent(`/play/${campaign.id}/${level.id}`)}`,
              );
            }}
          />
        ))}
        {level.pathSlug ? (
          <Action
            label="Related learning path"
            onPress={() => {
              session.pause();
              navigate(`/paths/${level.pathSlug}`);
            }}
          />
        ) : null}
        {s.result ? (
          <View
            style={styles.result}
            testID="game-result"
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.heading}>
              {s.attempt.phase === "won"
                ? "Signal restored!"
                : s.attempt.phase === "lost"
                  ? "Try the defense again"
                  : "Inspect the result"}
            </Text>
            {s.result.reasons
              .concat(s.result.events.slice(0, 6))
              .map((text, i) => (
                <Text key={i} style={styles.body}>
                  {text}
                </Text>
              ))}
            {s.attempt.phase === "won" ? (
              <>
                <Text style={styles.body}>{sc.explanation}</Text>
                <Action
                  label={level.order < 12 ? "Next level" : "The city is awake"}
                  onPress={() =>
                    navigate(
                      level.order < 12
                        ? `/play/${campaign.id}/${campaign.levels[level.order].id}`
                        : "/",
                    )
                  }
                />
              </>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f3e8" },
  content: { padding: 20, paddingBottom: 60, gap: 12 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#476357",
    marginTop: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1,
    color: "#20463f",
  },
  heading: {
    fontSize: 21,
    fontWeight: "600",
    color: "#20463f",
    marginVertical: 8,
  },
  body: { fontSize: 15, lineHeight: 24, color: "#486657" },
  stats: {
    fontSize: 14,
    fontWeight: "600",
    color: "#466444",
    paddingVertical: 12,
  },
  button: {
    minHeight: 48,
    minWidth: 48,
    maxWidth: "100%",
    flexShrink: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#647b65",
    backgroundColor: "#f9f7ed",
    justifyContent: "center",
  },
  buttonText: { fontSize: 15, fontWeight: "600", color: "#285340" },
  selected: { backgroundColor: "#305b4c" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginVertical: 8 },
  mapToolbar: { flexDirection: "row", gap: 8, flexWrap: "wrap", paddingHorizontal: 20, paddingVertical: 8 },
  district: {
    minHeight: 620,
    padding: 20,
    marginVertical: 0,
    justifyContent: "space-between",
  },
  frontierLabel: {
    backgroundColor: "#f7f1dfef",
    padding: 16,
    borderRadius: 14,
  },
  districtTitle: {
    backgroundColor: "#f7f1dfee",
    color: "#20463f",
    fontSize: 24,
    fontWeight: "600",
    padding: 16,
    borderRadius: 14,
  },
  stop: { maxWidth: "85%", marginVertical: 12 },
  stopText: {
    backgroundColor: "#f6f0dd",
    fontSize: 12,
    color: "#58673d",
    padding: 8,
    borderRadius: 8,
  },
  code: {
    minHeight: 140,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 14,
    lineHeight: 23,
    textAlignVertical: "top",
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#203f3e",
    color: "#f8eac7",
  },
  mono: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    lineHeight: 23,
    color: "#294a40",
  },
  piece: { backgroundColor: "#e7eddb", padding: 14, borderRadius: 14, gap: 8 },
  hint: {
    backgroundColor: "#ede8d2",
    padding: 15,
    color: "#425e48",
    lineHeight: 22,
  },
  result: { backgroundColor: "#e4edd7", padding: 20, borderRadius: 16, gap: 8 },
});
