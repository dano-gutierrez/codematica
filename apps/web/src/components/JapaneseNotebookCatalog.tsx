"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Pencil } from "lucide-react";
import {
  createCustomNotebook,
  createExerciseNotebook,
  getContentIndex,
  resolveNotebookCharacters,
  type WritingNotebook,
} from "@codematica/core";
import { createWebNotebookStorage } from "@/lib/notebooks/storage";
import { JapaneseWritingPractice } from "./JapaneseWritingPractice";

export function JapaneseNotebookCatalog() {
  const storage = useMemo(() => createWebNotebookStorage(), []),
    router = useRouter(),
    params = useSearchParams();
  const curated = useMemo(
    () =>
      getContentIndex()
        .exercises.filter(
          (e) => e.type === "writing" && e.status === "published",
        )
        .map((e) => {
          if (e.type !== "writing") throw new Error("writing exercise");
          return createExerciseNotebook(e, getContentIndex());
        }),
    [],
  );
  const [saved, setSaved] = useState<WritingNotebook[]>([]),
    [selected, setSelected] = useState<WritingNotebook | null>(),
    [text, setText] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    storage
      .list()
      .then((rows) => {
        if (!cancelled) setSaved(rows);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Couldn't open saved notebooks. Retry to keep your saved pages available.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [storage]);
  let validation = "";
  try {
    if (text) resolveNotebookCharacters(text, getContentIndex());
  } catch (e) {
    validation = (e as Error).message;
  }
  const current =
    selected === null
      ? undefined
      : (selected ??
        [...curated, ...saved].find((n) => n.id === params.get("notebook")));
  function open(notebook: WritingNotebook) {
    setSelected(notebook);
    router.replace(
      "/languages/japanese/notebooks?notebook=" +
        encodeURIComponent(notebook.id),
      { scroll: false },
    );
  }
  async function create() {
    let notebook: WritingNotebook;
    try {
      notebook = createCustomNotebook(text, getContentIndex());
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    setError("");
    try {
      await storage.saveDefinition(notebook);
      setSaved((old) => [notebook, ...old.filter((n) => n.id !== notebook.id)]);
    } catch {
      setError(
        "Your notebook can open, but saving is unavailable. Use Retry saving inside the notebook.",
      );
    }
    open(notebook);
  }
  if (current)
    return (
      <section className="mx-auto max-w-5xl px-4 py-6">
        <button
          type="button"
          className="notebook-catalog-back"
          onClick={() => {
            setSelected(null);
            router.replace("/languages/japanese/notebooks", { scroll: false });
            void storage
              .list()
              .then(setSaved)
              .catch(() => undefined);
          }}
          data-testid="notebooks-back"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          All notebooks
        </button>
        <h1 className="mt-4 text-3xl font-semibold">Notebook practice</h1>
        <JapaneseWritingPractice
          key={current.id}
          notebook={current}
          storage={storage}
        />
      </section>
    );
  return (
    <section
      className="mx-auto max-w-5xl px-4 py-7"
      data-testid="japanese-notebooks"
    >
      <nav aria-label="Japanese learning">
        <Link href="/languages/japanese" className="notebook-catalog-back">
          <ArrowLeft size={18} aria-hidden="true" />
          Japanese
        </Link>
      </nav>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#7a5200]">
        Japanese · planas
      </p>
      <h1 className="mt-2 text-3xl font-semibold">
        A little ink. A lasting memory.
      </h1>
      <p className="mt-3 max-w-2xl text-[#53616c]">
        Fill notebook pages with characters, words, and short expressions. Draw
        with a finger or write with a pen. Each sheet repeats your prompt 24
        times.
      </p>
      <form
        className="notebook-create"
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <label htmlFor="notebook-text">
          <Pencil size={18} aria-hidden="true" />
          Make your own notebook
        </label>
        <div>
          <input
            id="notebook-text"
            lang="ja"
            value={text}
            maxLength={32}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="あい or ありがとう"
            onChange={(event) => {
              setText(event.target.value);
              setError("");
            }}
            aria-describedby="notebook-text-help notebook-create-error"
            data-testid="notebook-custom-text"
          />
          <button
            type="submit"
            className="writing-primary"
            disabled={!text || Boolean(validation)}
            data-testid="notebook-create"
          >
            Create notebook
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
        <p id="notebook-text-help">
          Choose 1–5 characters with writing guides. Three sheets gradually fade
          the hints.
        </p>
        <p id="notebook-create-error" role="status">
          {validation || error}
        </p>
        <div className="notebook-preset-prompts">
          {["あい", "カメラ", "おはよう", "ありがとう"].map((value) => (
            <button
              key={value}
              type="button"
              lang="ja"
              onClick={() => {
                setText(value);
                setError("");
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </form>
      {saved.some((n) => n.id.startsWith("custom-")) ? (
        <>
          <h2 className="mt-7 text-xl font-semibold">Your saved notebooks</h2>
          <div className="notebook-catalog-list">
            {saved
              .filter((n) => n.id.startsWith("custom-"))
              .map((n) => (
                <button
                  type="button"
                  key={n.id}
                  onClick={() => open(n)}
                  data-testid={"notebook-saved-" + n.id}
                >
                  <span lang="ja">{n.sheets[0]!.label}</span>
                  <span>Continue on this device · 3 sheets</span>
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              ))}
          </div>
        </>
      ) : null}
      <h2 className="mt-8 flex items-center gap-2 text-xl font-semibold">
        <BookOpen size={21} aria-hidden="true" />
        Guided notebooks
      </h2>
      <div className="notebook-catalog-list">
        {curated.map((n) => (
          <button
            type="button"
            key={n.id}
            onClick={() => open(n)}
            data-testid={"notebook-curated-" + n.id.replaceAll("/", "-")}
          >
            <span>{n.title}</span>
            <span>{n.sheets.length} sheets · characters and words</span>
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        ))}
      </div>
      {error ? (
        <button
          type="button"
          className="notebook-catalog-back"
          onClick={() =>
            void storage
              .list()
              .then((rows) => {
                setSaved(rows);
                setError("");
              })
              .catch(() =>
                setError(
                  "Saved notebooks are still unavailable. Your pages haven't been replaced.",
                ),
              )
          }
        >
          Retry saved notebooks
        </button>
      ) : null}
    </section>
  );
}
