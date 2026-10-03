import { fireEvent, render } from "@testing-library/react-native";
import { PanResponder } from "react-native";
import { getContentIndex } from "@codematica/core";
import { NativeGameBoard } from "../../../../packages/ui/src/game/NativeGameBoard";
it("arranges a native component with touch while preserving the tap connection action", async () => {
  let handlers: Parameters<typeof PanResponder.create>[0] = {};
  jest.spyOn(PanResponder, "create").mockImplementation((config) => {
    handlers = config;
    return { panHandlers: {} };
  });
  const scenario = getContentIndex().gameCampaigns[0].levels[3].scenarios[0];
  if (scenario.kind !== "system") throw Error();
  const onMove = jest.fn(),
    onConnect = jest.fn();
  const view = await render(
    <NativeGameBoard
      scenario={scenario}
      board={{ nodes: ["client"], edges: [], invalidate: false }}
      selected="client"
      disabled={false}
      onMove={onMove}
      onConnect={onConnect}
    />,
  );
  const gesture = { dx: 30, dy: 40 } as never;
  expect(handlers.onMoveShouldSetPanResponder?.({} as never, gesture)).toBe(
    true,
  );
  handlers.onPanResponderGrant?.({} as never, gesture);
  handlers.onPanResponderMove?.({} as never, gesture);
  expect(onMove).toHaveBeenCalledWith(
    "client",
    0.18 + 30 / 320,
    0.22 + 40 / 350,
  );
  await fireEvent(view.getByTestId("game-board"), "layout", {
    nativeEvent: { layout: { width: 400, height: 350 } },
  });
  await fireEvent.press(view.getByTestId("game-connect-client"));
  expect(onConnect).toHaveBeenCalledWith("client");
  await view.rerender(
    <NativeGameBoard
      scenario={scenario}
      board={{ nodes: ["client"], edges: [], invalidate: false }}
      selected=""
      disabled
      onMove={onMove}
      onConnect={onConnect}
    />,
  );
  expect(handlers.onMoveShouldSetPanResponder?.({} as never, gesture)).toBe(
    false,
  );
  handlers.onPanResponderMove?.({} as never, gesture);
  expect(onMove).toHaveBeenCalledTimes(1);
  jest.restoreAllMocks();
});
