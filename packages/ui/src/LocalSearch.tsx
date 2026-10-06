import { AdaptiveText as Text } from "./AdaptiveText";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { parseNativeSearchMessage, prepareNativeSearch, searchContent, searchDiscovery, type ContentIndex, type DiscoveryResult, type SearchFilters, type SearchResult } from "@codematica/core";
import { Button } from "./Button";
import { colors, spacing } from "./tokens";

type Result = DiscoveryResult | SearchResult;
type Options = { index: ContentIndex; kind: "discovery" | "content"; query: string; filters?: SearchFilters; runtimeScript?: string };
type SearchState<T> = { results: T[]; pending: boolean; error: string; retry: () => void; runtime: ReactNode };
const failureMessage = "Search couldn't finish. Please try again.";

export function useLocalSearch(options: Options & { kind: "discovery" }): SearchState<DiscoveryResult>;
export function useLocalSearch(options: Options & { kind: "content" }): SearchState<SearchResult>;
export function useLocalSearch(options: Options): SearchState<Result>;
export function useLocalSearch({ index, kind, query, filters = {}, runtimeScript }: Options): SearchState<Result> {
  const [settledQuery, setSettledQuery] = useState("");
  useEffect(() => {
    if (query === settledQuery) return;
    let cancelled = false;
    const timer = setTimeout(() => { if (!cancelled) setSettledQuery(query); }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, settledQuery]);

  const queryPending = query !== settledQuery;
  const [restart, setRestart] = useState(0);
  const runtimeOwner = useMemo(() => ({ runtimeScript, restart }), [runtimeScript, restart]);
  const signature = useMemo(() => ({ index, kind, query: settledQuery, runtimeOwner, filters: { track: filters.track, difficulty: filters.difficulty, kind: filters.kind } }), [index, kind, settledQuery, runtimeOwner, filters.track, filters.difficulty, filters.kind]);
  const prepared = useMemo(() => runtimeScript ? prepareNativeSearch(index, kind) : undefined, [index, kind, runtimeScript]);
  const useRuntime = !!runtimeScript && !!settledQuery.trim();
  const fallback = useMemo(() => {
    if (useRuntime || queryPending) return [];
    return kind === "discovery" ? searchDiscovery(index, settledQuery).slice(0, 40) : searchContent(index, settledQuery, signature.filters).slice(0, 40);
  }, [index, kind, settledQuery, signature, queryPending, useRuntime]);
  const [readiness, setReadiness] = useState<{ owner?: typeof runtimeOwner; ready: boolean; failed: boolean }>({ ready: false, failed: false });
  const ready = readiness.owner === runtimeOwner && readiness.ready;
  const runtimeFailed = readiness.owner === runtimeOwner && readiness.failed;
  const [state, setState] = useState<{ owner?: typeof signature; results: Result[]; failed: boolean }>({ results: [], failed: false });
  const view = useRef<WebView>(null);
  const serial = useRef(0);
  const mounted = useRef(false);
  const activeRuntime = useRef(runtimeOwner);
  type Request = { id: number; owner: typeof signature; timer: ReturnType<typeof setTimeout>; resolve: NonNullable<typeof prepared>["resolve"] };
  const current = useRef<Request | undefined>(undefined);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    activeRuntime.current = runtimeOwner;
  }, [runtimeOwner]);

  const fail = useCallback((request: Request) => {
    if (!mounted.current || current.current !== request) return;
    clearTimeout(request.timer);
    current.current = undefined;
    setState({ owner: request.owner, results: [], failed: true });
  }, []);

  useEffect(() => {
    if (!useRuntime || !prepared || queryPending || runtimeFailed || state.owner === signature) return;
    const id = ++serial.current;
    const request: Request = { id, owner: signature, resolve: prepared.resolve, timer: setTimeout(() => fail(request), 15000) };
    current.current = request;
    if (ready) {
      try {
        // The bundled function receives JSON data. Authored strings never enter HTML.
        const payload = JSON.stringify({ id, input: prepared.input, query: settledQuery, filters: signature.filters }).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
        if (!view.current) throw new Error("Local search is unavailable");
        view.current.injectJavaScript(`window.__codematicaSearch(${payload}); true;`);
      } catch { fail(request); }
    }
    return () => {
      clearTimeout(request.timer);
      if (current.current === request) current.current = undefined;
    };
  }, [prepared, signature, queryPending, ready, runtimeFailed, restart, useRuntime, settledQuery, fail, state.owner]);

  function receive(data: string) {
    if (!mounted.current || activeRuntime.current !== runtimeOwner) return;
    const message = parseNativeSearchMessage(data);
    if (!message) return;
    if (message.type === "ready") { setReadiness({ owner: runtimeOwner, ready: true, failed: false }); return; }
    const request = current.current;
    if (!request || request.id !== message.id) return;
    if (message.type === "error") { fail(request); return; }
    try {
      const results = request.resolve(message.rows);
      clearTimeout(request.timer);
      current.current = undefined;
      setState({ owner: request.owner, results, failed: false });
    } catch { fail(request); }
  }
  function failRuntime() {
    if (!mounted.current || activeRuntime.current !== runtimeOwner) return;
    const request = current.current;
    if (request) fail(request);
    setReadiness({ owner: runtimeOwner, ready: false, failed: true });
  }
  function retry() {
    setRestart(value => value + 1);
  }
  const source = useMemo(() => ({ html: `<!doctype html><html><head><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'"></head><body><script>${(runtimeScript ?? "").replace(/<\/script/gi, "<\\/script")}</script></body></html>` }), [runtimeScript]);
  const runtime = runtimeScript ? <View style={styles.runtime} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="mobile-local-search-container">
    <WebView key={`${runtimeScript}-${restart}`} ref={view} source={source} javaScriptEnabled domStorageEnabled={false} cacheEnabled={false} originWhitelist={["about:blank"]}
      onShouldStartLoadWithRequest={request => request.url === "about:blank"}
      onMessage={event => receive(event.nativeEvent.data)} onError={failRuntime} onHttpError={failRuntime} onRenderProcessGone={failRuntime} onContentProcessDidTerminate={failRuntime}
      testID="mobile-local-search-runtime" />
  </View> : null;
  const ownsResults = state.owner === signature;
  const failed = useRuntime && !queryPending && (runtimeFailed || (ownsResults && state.failed));
  const pending = queryPending || (useRuntime && !failed && !ownsResults);
  const results = useRuntime ? !pending && ownsResults && !failed ? state.results : [] : fallback;
  return { results, pending, error: failed ? failureMessage : "", retry, runtime };
}

export function LocalSearchFeedback({ error, retry }: { error: string; retry: () => void }) {
  if (!error) return null;
  return <View style={styles.feedback}>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: colors.textStrong }}>{error}</Text>
    <Button label="Retry search" variant="secondary" tone="warning" onPress={retry} testID="mobile-search-retry" />
  </View>;
}
const styles = StyleSheet.create({
  runtime: { position: "absolute", width: 1, height: 1, opacity: 0 },
  feedback: { gap: spacing.sm, alignItems: "flex-start" },
});
