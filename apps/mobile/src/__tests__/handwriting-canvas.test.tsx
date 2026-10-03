import { Platform } from "react-native";
const mockOptional = jest.fn(),
  mockView = jest.fn((..._args: unknown[]) => "PencilCanvas");
jest.mock("expo", () => ({
  requireOptionalNativeModule: (...args: unknown[]) => mockOptional(...args),
  requireNativeView: (...args: unknown[]) => mockView(...args),
}));
it("uses SVG on Android and when the iOS native module is unavailable", () => {
  const original = Platform.OS;
  Platform.OS = "android";
  jest.isolateModules(() => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../lib/handwriting-canvas").nativeHandwritingCanvas,
    ).toBeUndefined();
  });
  Platform.OS = "ios";
  mockOptional.mockReturnValue(null);
  jest.isolateModules(() => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../lib/handwriting-canvas").nativeHandwritingCanvas,
    ).toBeUndefined();
  });
  Platform.OS = original;
});
it("bridges completed native samples and pressure while forwarding two-finger pan and reset", () => {
  const original = Platform.OS;
  Platform.OS = "ios";
  mockOptional.mockReturnValue({});
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Canvas = require("../lib/handwriting-canvas").nativeHandwritingCanvas;
    const onBegin = jest.fn(),
      onEnd = jest.fn(), onPan = jest.fn();
    const props = {
      resetKey: 3,
      strokeCount: 0,
      disabled: false,
      style: { width: 400 },
      onBegin,
      onEnd, onPan,
    };
    const element = Canvas(props);
    expect(element.props).toMatchObject({
      resetKey: 3,
      strokeCount: 0,
    });
    expect(element.props.mode).toBeUndefined();
    element.props.onPan({nativeEvent:{deltaY:80,phase:"changed"}});
    expect(onPan).toHaveBeenCalledWith(80,"changed");
    element.props.onBegin({ nativeEvent: { pen: true } });
    expect(onBegin).toHaveBeenCalledWith(true);
    const strokes = [
      {
        points: [
          [1, 2],
          [3, 4],
        ],
        pressures: [0.3, 0.8],
      },
    ];
    element.props.onEnd({ nativeEvent: { strokes, generation: 3 } });
    expect(onEnd).toHaveBeenCalledWith(strokes);
    element.props.onEnd({ nativeEvent: { strokes, generation: 2 } });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
  Platform.OS = original;
});
