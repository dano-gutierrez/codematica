import * as matchers from "@testing-library/react-native/matchers";

expect.extend(matchers);

jest.mock("react-native-webview", () => ({
  WebView: "WebView",
}));
