import { useCallback, useEffect, useRef, useState } from "react";
import {
  acceptNotebookCharacter,
  createNotebookSnapshot,
  getNotebookProgress,
  isNotebookSheetUnlocked,
  mergeNotebookProgress,
  restartNotebookSheet,
  undoNotebookCell,
  type NotebookSnapshot,
  type NotebookStorage,
  type WritingNotebook,
  type WritingStroke,
  type NotebookDifficulty,
} from "@codematica/core";

/** A new stroke or correction cancels expiry; only temporary rejected ink is cleared. */
export function useNotebookInkRejection(onExpire: () => void) {
  const [phase, setPhase] = useState<"idle" | "rejected" | "fading">("idle");
  const [attempt, setAttempt] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const expiry = useRef(onExpire);
  useEffect(() => {
    expiry.current = onExpire;
  }, [onExpire]);
  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => stop, [stop]);
  const cancel = useCallback(() => {
    stop();
    setPhase("idle");
  }, [stop]);
  const reject = useCallback((onReject?: () => void) => {
    stop();
    setPhase("idle");
    timers.current = [
      setTimeout(() => {
        setPhase("rejected");
        setAttempt((n) => n + 1);
        onReject?.();
        timers.current = [
          setTimeout(() => {
            setPhase("fading");
            timers.current = [
              setTimeout(() => {
                timers.current = [];
                setPhase("idle");
                expiry.current();
              }, 250),
            ];
          }, 1200),
        ];
      }, 800),
    ];
  }, [stop]);
  return { phase, attempt, reject, cancel };
}

export function useNotebookSession(
  notebook: WritingNotebook,
  storage?: NotebookStorage,
  onProgress?: (
    status: "started" | "completed",
    position: Record<string, unknown>,
  ) => void | Promise<void>,
) {
  const [snapshot, setSnapshot] = useState(() =>
    createNotebookSnapshot(notebook),
  );
  const [loading, setLoading] = useState(Boolean(storage));
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveError, setSaveError] = useState("");
  const current = useRef(snapshot),
    completionReported = useRef(false),
    queue = useRef(Promise.resolve());
  const progress = useRef(onProgress);
  useEffect(() => {
    progress.current = onProgress;
  }, [onProgress]);
  const mounted = useRef(true);
  const errorMessage = useRef("");
  const setError = useCallback((message: string) => {
    if (errorMessage.current === message) return;
    errorMessage.current = message;
    if (mounted.current) setSaveError(message);
  }, []);
  const update = useCallback((next: NotebookSnapshot) => {
    current.current = next;
    setSnapshot(next);
  }, []);
  const persist = useCallback(
    (next: NotebookSnapshot) => {
      if (!storage) return;
      queue.current = queue.current
        .catch(() => undefined)
        .then(async () => {
          try {
            await storage.saveDefinition(notebook);
            await storage.save(next);
            setError("");
          } catch {
            setError(
              "Your ink is still here, but couldn't be saved. Retry saving before leaving.",
            );
            return;
          }
          void storage.sync?.(notebook, next).catch(() => {
            setError(
              "Your ink is saved on this device, but progress could not sync. Retry to sync your unlocks.",
            );
          });
        });
    },
    [notebook, storage, setError],
  );
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
    completionReported.current = false;
    async function restore() {
      setLoading(true);
      setLoadFailed(false);
      let next = createNotebookSnapshot(notebook);
      try {
        if (storage) {
          next = (await storage.load(notebook)) ?? next;
          try {
            next = mergeNotebookProgress(
              notebook,
              next,
              (await storage.sync?.(notebook, next)) ?? [],
            );
          } catch {
            /* Use local progress while offline. */
          }
        }
        if (!cancelled) {
          update(next);
          setError("");
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoadFailed(true);
          setLoading(false);
          setError(
            "Couldn't open the saved notebook. Retry opening it; your saved pages haven't been replaced.",
          );
        }
      }
    }
    void restore();
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [notebook, storage, reloadKey, update, setError]);
  const sheet =
    notebook.sheets.find((s) => s.id === snapshot.activeSheetId) ??
    notebook.sheets[0];
  const page = sheet ? snapshot.pages[sheet.id] : undefined;
  const complete = Boolean(
    sheet && page && page.cells.length === 24 * sheet.characters.length,
  );
  const allRequiredComplete = notebook.sheets
    .filter((s) => s.required)
    .every(
      (s) => (snapshot.pages[s.id]?.bestCount ?? 0) >= 24 * s.characters.length,
    );
  function commit(token: string, strokes: WritingStroke[]) {
    if (!sheet || loading || loadFailed) return false;
    const next = acceptNotebookCharacter(notebook, current.current, sheet.id, {
      token,
      strokes,
    });
    if (next === current.current) return false;
    update(next);
    persist(next);
    const count = next.pages[sheet.id]!.cells.length;
    void progress.current?.("started", {
      notebookId: notebook.id,
      sheetId: sheet.id,
      repetition: Math.min(24, Math.floor(count / sheet.characters.length) + 1),
      characterSlug: sheet.characters[count % sheet.characters.length]?.slug,
    });
    if (
      !completionReported.current &&
      notebook.sheets
        .filter((s) => s.required)
        .every((s) => next.pages[s.id]!.bestCount >= 24 * s.characters.length)
    ) {
      completionReported.current = true;
      void progress.current?.("completed", {
        notebookId: notebook.id,
        passed: true,
        repetitions: 24,
      });
    }
    return true;
  }
  function selectSheet(index: number) {
    if (!isNotebookSheetUnlocked(notebook, current.current, index)) return;
    const next = {
      ...current.current,
      activeSheetId: notebook.sheets[index]!.id,
    };
    update(next);
    persist(next);
  }
  function restart() {
    if (!sheet) return;
    const next = restartNotebookSheet(notebook, current.current, sheet.id);
    update(next);
    persist(next);
  }
  function undo() {
    if (!sheet) return;
    const next = undoNotebookCell(current.current, sheet.id);
    update(next);
    persist(next);
  }
  function retry() {
    if (loadFailed) setReloadKey((k) => k + 1);
    else persist(current.current);
  }
  function setDifficulty(difficulty: NotebookDifficulty) {
    if (loading || loadFailed) return;
    const next = { ...current.current, difficulty };
    update(next);
    persist(next);
  }
  return {
    snapshot,
    sheet,
    page,
    complete,
    allRequiredComplete,
    loading,
    loadFailed,
    saveError,
    commit,
    selectSheet,
    restart,
    undo,
    retry,
    difficulty: snapshot.difficulty ?? "easy",
    setDifficulty,
    progress: getNotebookProgress(notebook, snapshot),
  };
}
