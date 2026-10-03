import { requireNativeView, requireOptionalNativeModule } from "expo";
import {
  Platform,
  type NativeSyntheticEvent,
  type ViewProps,
} from "react-native";
import type { ComponentType } from "react";
import type { HandwritingCanvasProps } from "../../../../packages/ui/src/JapaneseNotebookPractice";
import type { WritingStroke } from "@codematica/core";
type NativeProps = ViewProps &
  Omit<HandwritingCanvasProps, "onBegin" | "onEnd" | "onPan"> & {
    onPan: (event: NativeSyntheticEvent<{deltaY: number; phase: "began" | "changed" | "ended"}>) => void;
    onBegin: (event: NativeSyntheticEvent<{ pen: boolean }>) => void;
    onEnd: (
      event: NativeSyntheticEvent<{
        strokes: WritingStroke[];
        generation: number;
      }>,
    ) => void;
  };
const NativeInk =
  Platform.OS === "ios" && requireOptionalNativeModule("CodematicaHandwriting")
    ? requireNativeView<NativeProps>("CodematicaHandwriting")
    : undefined;
export const nativeHandwritingCanvas:
  | ComponentType<HandwritingCanvasProps>
  | undefined = NativeInk
  ? function HandwritingCanvas(props) {
      return (
        <NativeInk
          {...props}
          onPan={(event) => props.onPan(event.nativeEvent.deltaY, event.nativeEvent.phase)}
          onBegin={(event) => props.onBegin(event.nativeEvent.pen)}
          onEnd={(event) => {
            if (event.nativeEvent.generation === props.resetKey)
              props.onEnd(event.nativeEvent.strokes);
          }}
        />
      );
    }
  : undefined;
