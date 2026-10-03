import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getContentIndex } from "@codematica/core";
import { GameBoard } from "./GameBoard";
it("supports drag placement, pointer rearrangement, keyboard movement and tap connections", () => {
  const scenario = getContentIndex().gameCampaigns[0].levels[3].scenarios[0];
  if (scenario.kind !== "system") throw Error();
  const onMove = vi.fn(),
    onPlace = vi.fn(),
    onConnect = vi.fn(),
    board = { nodes: ["client"], edges: [], invalidate: false };
  const props = {
    scenario,
    board,
    selected: "client",
    disabled: false,
    onMove,
    onPlace,
    onConnect,
  };
  const view = render(<GameBoard {...props} />);
  const canvas = screen.getByTestId("game-board"),
    node = screen.getByTestId("game-connect-client");
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 600,
    height: 360,
  } as DOMRect);
  fireEvent.dragOver(canvas);
  fireEvent.drop(canvas, { dataTransfer: { getData: () => "api-1" } });
  expect(onPlace).toHaveBeenCalledWith("api-1");
  fireEvent.drop(canvas, { dataTransfer: { getData: () => "unknown" } });
  expect(onPlace).toHaveBeenCalledTimes(1);
  fireEvent.pointerDown(node, { clientX: 50, clientY: 50, pointerId: 1 });
  fireEvent.pointerMove(node, { clientX: 53, clientY: 52, pointerId: 1 });
  fireEvent.pointerMove(node, { clientX: 300, clientY: 180, pointerId: 1 });
  expect(onMove).toHaveBeenCalledExactlyOnceWith("client", 0.5, 0.5);
  fireEvent.click(node);
  expect(onConnect).not.toHaveBeenCalled();
  fireEvent.pointerCancel(node);
  fireEvent.click(node);
  expect(onConnect).toHaveBeenCalledWith("client");
  fireEvent.keyDown(node, { key: "ArrowDown" });
  expect(onMove).toHaveBeenLastCalledWith("client", 0.18, 0.3);
  fireEvent.keyDown(node, { key: "a" });
  expect(onMove).toHaveBeenCalledTimes(2);
  view.rerender(<GameBoard {...props} disabled />);
  fireEvent.drop(canvas, { dataTransfer: { getData: () => "api-2" } });
  expect(onPlace).toHaveBeenCalledTimes(1);
});
