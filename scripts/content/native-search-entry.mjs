import { installNativeSearchWorker } from "../../packages/core/src/native-search-worker.ts";
installNativeSearchWorker(globalThis, data => globalThis.ReactNativeWebView.postMessage(data));
