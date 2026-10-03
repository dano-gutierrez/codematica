import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  createCustomNotebook,
  createExerciseNotebook,
  resolveNotebookCharacters,
  type ContentIndex,
  type WritingNotebook,
} from "@codematica/core";
import { AppScreen, Header } from "./screens";
import { JapaneseNotebookPractice } from "./JapaneseNotebookPractice";
import type { CodematicaAdapters } from "./adapters";
export function JapaneseNotebookCatalogScreen({
  index,
  adapters,
}: {
  index: ContentIndex;
  adapters: CodematicaAdapters;
}) {
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
    try {
      const notebook = createCustomNotebook(text, index);
      await adapters.notebooks?.saveDefinition(notebook);
      setSelected(notebook);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function button(
    label: string,
    id: string,
    action: () => void,
    disabled = false,
  ) {
    return (
      <Pressable
        key={id}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        onPress={action}
        testID={id}
        style={{
          minHeight: 48,
          padding: 12,
          borderBottomWidth: 1,
          borderColor: "#abcbd4",
        }}
      >
        <Text style={{ color: "#263238", fontSize: 16 }}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Japanese · Notebook practice" />
      {selected ? (
        <View style={{ gap: 16 }}>
          {button("All notebooks", "mobile-notebook-back", () => {
            setSelected(undefined);
            void load();
          })}
          <Text
            accessibilityRole="header"
            style={{ fontSize: 24, color: "#263238" }}
          >
            {selected.title}
          </Text>
          <JapaneseNotebookPractice
            key={selected.id}
            notebook={selected}
            adapters={adapters}
          />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Text
            accessibilityRole="header"
            style={{ fontSize: 28, color: "#263238" }}
          >
            Your Japanese notebooks
          </Text>
          <Text>
            Repeat a character, word or short expression in a page of
            handwriting.
          </Text>
          <TextInput
            accessibilityLabel="Japanese text"
            value={text}
            onChangeText={setText}
            placeholder="あい · おはよう"
            maxLength={32}
            testID="mobile-notebook-input"
            style={{
              minHeight: 48,
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              borderColor: "#678680",
              color: "#263238",
            }}
          />
          <Text accessibilityLiveRegion="polite">
            {validation || "Choose 1–5 supported Japanese characters."}
          </Text>
          {button(
            "Create notebook",
            "mobile-notebook-create",
            () => {
              void start();
            },
            !text || Boolean(validation),
          )}
          {error ? (
            <>
              <Text accessibilityLiveRegion="polite">{error}</Text>
              {button("Retry", "mobile-notebook-retry", () => {
                void load();
              })}
            </>
          ) : null}
          {saved.filter((n) => n.id.startsWith("custom-")).length ? (
            <Text accessibilityRole="header">Saved notebooks</Text>
          ) : null}
          {saved
            .filter((n) => n.id.startsWith("custom-"))
            .map((n) =>
              button(n.title, "mobile-notebook-saved-" + n.id, () =>
                setSelected(n),
              ),
            )}
          <Text accessibilityRole="header">Practice notebooks</Text>
          {curated.map((n) =>
            button(n.title, "mobile-notebook-curated-" + n.id, () =>
              setSelected(n),
            ),
          )}
        </View>
      )}
    </AppScreen>
  );
}
