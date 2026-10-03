import * as matchers from "@testing-library/react-native/matchers";

expect.extend(matchers);

jest.mock("react-native-webview", () => ({
  WebView: "WebView",
}));

jest.mock("expo-audio", () => ({
  createAudioPlayer: jest.fn(() => ({
    playbackRate: 1,
    seekTo: jest.fn(async () => undefined),
    play: jest.fn(),
    remove: jest.fn(),
  })),
}));

// Device storage is modeled by the package's official in-memory Jest implementation.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@react-native-async-storage/async-storage",()=>({__esModule:true,default:require("@react-native-async-storage/async-storage/jest/async-storage-mock")}));
