import { AdaptiveText as Text } from "./AdaptiveText";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Switch, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  createCustomNotebook,
  createExerciseNotebook,
  getNotebookCatalogPreview,
  resolveNotebookCharacters,
  type ContentIndex,
  type WritingNotebook,
} from "@codematica/core";
import { Button } from "./Button";
import { colors } from "./tokens";
import { AppScreen, Header } from "./screens";
import { JapaneseNotebookPractice } from "./JapaneseNotebookPractice";
import type { CodematicaAdapters } from "./adapters";
import { useNotebookRomaji } from "./notebook-session";
export function JapaneseNotebookCatalogScreen({
  index,
  adapters,
}: {
  index: ContentIndex;
  adapters: CodematicaAdapters;
}) {
  const { showRomaji, toggleRomaji } = useNotebookRomaji(adapters.notebooks);
  const curated = useMemo(
    () =>
      index.exercises
        .filter((e) => e.type === "writing")
        .map((e) =>
          createExerciseNotebook(
            e as Extract<typeof e, { type: "writing" }>,
            index,
          ),
        ),
    [index],
  );
  const creatingRef = useRef(false);
  const [creating, setCreating] = useState(false);
  const [text, setText] = useState(""),
    [saved, setSaved] = useState<WritingNotebook[]>([]),
    [selected, setSelected] = useState<WritingNotebook>(),
    [error, setError] = useState("");
  async function load() {
    try {
      setSaved((await adapters.notebooks?.list()) ?? []);
      setError("");
    } catch {
      setError("Couldn't open saved notebooks. Retry opening them.");
    }
  }
  useEffect(() => {
    let cancelled = false;
    void adapters.notebooks
      ?.list()
      .then((rows) => {
        if (!cancelled) setSaved(rows);
      })
      .catch(() => {
        if (!cancelled)
          setError("Couldn't open saved notebooks. Retry opening them.");
      });
    return () => {
      cancelled = true;
    };
  }, [adapters.notebooks]); // Storage belongs to the adapter, shared with lesson and dictionary writing.
  let validation = "";
  try {
    if (text) resolveNotebookCharacters(text, index);
  } catch (e) {
    validation = (e as Error).message;
  }
  async function start() {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const notebook = createCustomNotebook(text, index);
      await adapters.notebooks?.saveDefinition(notebook);
      setSelected(notebook);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }
  function button(
    label: string,
    id: string,
    action: () => void,
    disabled = false,
  ) {
    return <Button key={id} label={label} disabled={disabled || creating} busy={id === "mobile-notebook-create" && creating} onPress={action} tone={id.includes("retry") ? "warning" : "info"} variant={id.includes("create") ? "primary" : "secondary"} testID={id} />;
  }
  function notebookCard(notebook: WritingNotebook, saved: boolean) {
    const prompts = getNotebookCatalogPreview(notebook);
    return (
      <Pressable
        key={notebook.id}
        accessibilityRole="button"
        accessibilityLabel={prompts.map(p => p.label).join("、") + " · " + notebook.title}
        onPress={() => setSelected(notebook)}
        testID={(saved ? "mobile-notebook-saved-" : "mobile-notebook-curated-") + notebook.id}
        style={{ minHeight: 120, padding: 18, borderWidth: 1, borderRadius: 18, borderColor: "#abcbd4", backgroundColor: "#fffdf7", gap: 16 }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {prompts.map(prompt => (
            <View key={prompt.label} style={{ alignItems: "center" }}>
              <Text
                accessibilityElementsHidden={!showRomaji}
                importantForAccessibility={showRomaji ? "auto" : "no"}
                style={{ minHeight: 18, fontSize: 11, lineHeight: 18, color: "#53616c", opacity: showRomaji ? 1 : 0 }}
              >
                {prompt.romaji}
              </Text>
              <Text accessibilityLanguage="ja-JP" style={{ fontSize: 27, lineHeight: 40, color: "#263238" }}>{prompt.label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: "#53616c", fontSize: 12 }}>{saved ? "Continue on this device · " : ""}{notebook.sheets.length} practice sheets</Text>
      </Pressable>
    );
  }
  return (
    <AppScreen keyboardAware>
      {selected ? (
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <Button label="All notebooks" tone="neutral" variant="ghost" testID="mobile-notebook-back" onPress={() => { setSelected(undefined); void load(); }}
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}><Path d="M19 12H5m7-7-7 7 7 7" stroke="#263238" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>} />
            <Text
              accessibilityRole="header"
              style={{ flex: 1, fontSize: 24, color: "#263238" }}
            >
              {selected.title}
            </Text>
          </View>
          <JapaneseNotebookPractice
            key={selected.id}
            notebook={selected}
            adapters={adapters}
          />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Header adapters={adapters} subtitle="Japanese · Notebook practice" />
          <Text
            accessibilityRole="header"
            style={{ fontSize: 28, color: "#263238" }}
          >
            Japanese notebooks
          </Text>
          <Text>
            Repeat a character, word or short expression in a page of
            handwriting.
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textStrong }}>Japanese text</Text>
          <TextInput
            accessibilityLabel="Japanese text"
            autoCapitalize="none"
            autoCorrect={false}
            value={text}
            editable={!creating}
            onChangeText={setText}
            placeholder="あい · おはよう"
            maxLength={32}
            testID="mobile-notebook-input"
            style={{
              minHeight: 48,
              borderWidth: 1,
              borderRadius: 10,
              padding: 12,
              borderColor: colors.controlBorder,
              fontSize: 16,
              color: "#263238",
            }}
          />
          <Text accessibilityLiveRegion="polite">
            {validation || "Choose 1–5 supported Japanese characters."}
          </Text>
          <Button label="Create notebook" tone="info" variant="primary"
            testID="mobile-notebook-create" onPress={() => { void start(); }} busy={creating}
            disabled={creating || !text || Boolean(validation)} />
          {error ? (
            <>
              <Text accessibilityLiveRegion="polite">{error}</Text>
              {button("Retry", "mobile-notebook-retry", () => {
                void load();
              })}
            </>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12, minHeight: 44 }}>
            <Text style={{ color: "#33434b", fontSize: 14, fontWeight: "600" }}>Show romaji</Text>
            <Switch
              accessibilityLabel="Show romaji"
              accessibilityRole="switch"
              accessibilityState={{ checked: showRomaji }}
              value={showRomaji}
              onValueChange={toggleRomaji}
              trackColor={{ false: "#667680", true: "#007c78" }}
              hitSlop={8}
              testID="mobile-notebook-romaji-toggle"
            />
          </View>
          {saved.filter((n) => n.id.startsWith("custom-")).length ? (
            <Text accessibilityRole="header">Saved notebooks</Text>
          ) : null}
          {saved
            .filter((n) => n.id.startsWith("custom-"))
            .map((n) => notebookCard(n, true))}
          <Text accessibilityRole="header">Practice notebooks</Text>
          {curated.map((n) => notebookCard(n, false))}
        </View>
      )}
    </AppScreen>
  );
}
