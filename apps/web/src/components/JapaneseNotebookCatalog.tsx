"use client";
import { Button } from "./Button";
import { ButtonLink } from "./ButtonLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Languages, Pencil } from "lucide-react";
import {
  createCustomNotebook,
  createExerciseNotebook,
  getContentIndex,
  getNotebookCatalogPreview,
  resolveNotebookCharacters,
  type WritingNotebook,
} from "@codematica/core";
import { createWebNotebookStorage } from "@/lib/notebooks/storage";
import { JapaneseWritingPractice } from "./JapaneseWritingPractice";
import { useNotebookRomaji } from "@codematica/ui/notebook-session";

export function JapaneseNotebookCatalog() {
  const storage = useMemo(() => createWebNotebookStorage(), []),
    router = useRouter(),
    params = useSearchParams();
  const { showRomaji, toggleRomaji } = useNotebookRomaji(storage);
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
  const creatingRef = useRef(false);
  const [creating, setCreating] = useState(false);
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
    if (creatingRef.current) return;
    let notebook: WritingNotebook;
    try {
      notebook = createCustomNotebook(text, getContentIndex());
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    creatingRef.current = true;
    setCreating(true);
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
    creatingRef.current = false;
    setCreating(false);
  }
  function notebookCard(notebook: WritingNotebook, saved: boolean) {
    const prompts = getNotebookCatalogPreview(notebook);
    return (
      <button
        type="button"
        key={notebook.id}
        onClick={() => open(notebook)}
        aria-label={prompts.map(p => p.label).join("、") + " · " + notebook.title}
        data-testid={saved ? "notebook-saved-" + notebook.id : "notebook-curated-" + notebook.id.replaceAll("/", "-")}
      >
        <span className="notebook-catalog-prompts" aria-hidden="true">
          {prompts.map(prompt => (
            <ruby key={prompt.label} lang="ja" className="notebook-catalog-prompt">
              {prompt.label}
              <rt lang="en" aria-hidden="true" style={{ visibility: showRomaji ? "visible" : "hidden" }}>{prompt.romaji}</rt>
            </ruby>
          ))}
        </span>
        <span className="notebook-catalog-meta">
          {saved ? "Continue on this device · " : ""}{notebook.sheets.length} practice sheets
        </span>
        <ArrowRight size={20} aria-hidden="true" />
      </button>
    );
  }
  if (current)
    return (
      <section className="ui-page max-w-5xl">
        <Button label="All notebooks" icon={ArrowLeft} variant="quiet"
          onClick={() => {
            setSelected(null);
            router.replace("/languages/japanese/notebooks", { scroll: false });
            void storage
              .list()
              .then(setSaved)
              .catch(() => undefined);
          }}
          data-testid="notebooks-back" />
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
      className="ui-page max-w-5xl"
      data-testid="japanese-notebooks"
    >
      <nav aria-label="Japanese learning">
        <ButtonLink href="/languages/japanese" label="Japanese" icon={ArrowLeft} variant="quiet" />
      </nav>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#7a5200]">
        Japanese writing
      </p>
      <h1 className="mt-2 text-3xl font-semibold">
        Japanese notebooks
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
            disabled={creating}
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
          <Button label="Create notebook" icon={ArrowRight} type="submit" tone="info" variant="primary" busy={creating} disabled={!text || Boolean(validation)} data-testid="notebook-create" />
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
            <Button label={value} key={value} lang="ja" tone="info" disabled={creating}
              onClick={() => {
                setText(value);
                setError("");
              }}
            />
          ))}
        </div>
      </form>
      <div className="notebook-catalog-options">
        <button
          type="button"
          role="switch"
          aria-checked={showRomaji}
          onClick={toggleRomaji}
          className="notebook-romaji-toggle"
          data-testid="notebook-romaji-toggle"
        >
          <Languages size={18} aria-hidden="true" />
          Show romaji
          <span className="notebook-toggle-track" aria-hidden="true"><span /></span>
        </button>
      </div>
      {saved.some((n) => n.id.startsWith("custom-")) ? (
        <>
          <h2 className="mt-7 text-xl font-semibold">Your saved notebooks</h2>
          <div className="notebook-catalog-list">
            {saved
              .filter((n) => n.id.startsWith("custom-"))
              .map((n) => notebookCard(n, true))}
          </div>
        </>
      ) : null}
      <h2 className="mt-8 flex items-center gap-2 text-xl font-semibold">
        <BookOpen size={21} aria-hidden="true" />
        Guided notebooks
      </h2>
      <div className="notebook-catalog-list">
        {curated.map((n) => notebookCard(n, false))}
      </div>
      {error ? (
        <Button label="Retry saved notebooks" icon={ArrowRight} tone="warning"
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
        />
      ) : null}
    </section>
  );
}
