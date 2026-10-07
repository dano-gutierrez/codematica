import { AdaptiveText as Text } from "../AdaptiveText";
import { useRef, useState, useLayoutEffect } from "react";
import { PanResponder, Pressable, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import {
  boardPosition,
  type GameBoard,
  type SystemScenario,
} from "@codematica/core/game";
type Props = {
  scenario: SystemScenario;
  board: GameBoard;
  selected: string;
  disabled: boolean;
  onConnect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};
function Piece({
  id,
  label,
  capacity,
  position,
  width,
  disabled,
  selected,
  onConnect,
  onMove,
}: {
  id: string;
  label: string;
  capacity: number;
  position: { x: number; y: number };
  width: number;
  disabled: boolean;
  selected: boolean;
  onConnect: Props["onConnect"];
  onMove: Props["onMove"];
}) {
  const current = useRef({ position, width, disabled, onMove });
  useLayoutEffect(() => {
    current.current = { position, width, disabled, onMove };
  }, [position, width, disabled, onMove]);
  const origin = useRef(position);
  // PanResponder registers these callbacks; it does not read their refs during render.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        !current.current.disabled && Math.hypot(g.dx, g.dy) > 6,
      onPanResponderGrant: () => {
        origin.current = current.current.position;
      },
      onPanResponderMove: (_, g) => {
        if (!current.current.disabled)
          current.current.onMove(
            id,
            origin.current.x + g.dx / current.current.width,
            origin.current.y + g.dy / 350,
          );
      },
    }),
  );
  return (
    <Pressable
      {...pan.panHandlers}
      testID={`game-connect-${id}`}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Tap to connect or drag to arrange.`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => onConnect(id)}
      style={{
        position: "absolute",
        left: position.x * width - 42,
        top: position.y * 350 - 36,
        width: 84,
        minHeight: 72,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#619081",
        backgroundColor: selected ? "#1e4d43" : "#fff9e9",
        padding: 7,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          textAlign: "center",
          fontWeight: "700",
          fontSize: 11,
          color: selected ? "#fff1ce" : "#214b42",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          textAlign: "center",
          fontSize: 10,
          color: selected ? "#fff1ce" : "#214b42",
        }}
      >
        {capacity}/sec
      </Text>
    </Pressable>
  );
}
export function NativeGameBoard({
  scenario,
  board,
  selected,
  disabled,
  onConnect,
  onMove,
}: Props) {
  const [width, setWidth] = useState(320);
  return (
    <View
      testID="game-board"
      accessible={false}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        height: 350,
        backgroundColor: "#e4eadc",
        borderRadius: 18,
        marginVertical: 12,
        overflow: "hidden",
      }}
    >
      <Svg width={width} height={350} style={{ position: "absolute" }}>
        {board.edges.map((e, i) => {
          const a = boardPosition(e.from, board.nodes, board.positions),
            b = boardPosition(e.to, board.nodes, board.positions);
          return (
            <Line
              key={i}
              x1={a.x * width}
              y1={a.y * 350}
              x2={b.x * width}
              y2={b.y * 350}
              stroke="#558878"
              strokeWidth={3}
            />
          );
        })}
      </Svg>
      {scenario.components
        .filter((c) => board.nodes.includes(c.id))
        .map((c) => (
          <Piece
            key={c.id}
            id={c.id}
            label={c.label}
            capacity={c.capacity}
            width={width}
            position={boardPosition(c.id, board.nodes, board.positions)}
            selected={selected === c.id}
            disabled={disabled}
            onConnect={onConnect}
            onMove={onMove}
          />
        ))}
      {!board.nodes.length ? (
        <Text style={{ textAlign: "center", marginTop: 140, color: "#385b50" }}>
          Tap components to place them here.
        </Text>
      ) : null}
    </View>
  );
}
