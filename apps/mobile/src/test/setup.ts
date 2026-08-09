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
