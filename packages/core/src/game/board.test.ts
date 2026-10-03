import { expect, it } from "vitest";
import { boardPosition, clampPosition } from "./board";
import { GameSession } from "./session";
import { gameCampaignSchema } from "./schema";
import source from "../../../../content/game/restore-the-signal.json";
it("keeps dragged or keyboard-positioned components inside reachable canvas bounds", () => {
  expect(clampPosition(-5, 8)).toEqual({ x: 0.14, y: 0.85 });
  expect(clampPosition(NaN, Infinity)).toEqual({ x: 0.5, y: 0.5 });
  expect(boardPosition("a", ["a"])).toEqual({ x: 0.18, y: 0.22 });
  expect(boardPosition("a", ["a"], { a: { x: 0.7, y: 0.6 } })).toEqual({
    x: 0.7,
    y: 0.6,
  });
});
it("preserves positions in the attempt and freezes moving while paused", () => {
  const session = new GameSession(gameCampaignSchema.parse(source).levels[7]);
  session.place("client");
  session.move("client", 0.4, 0.5);
  expect(session.getSnapshot().board.positions?.client).toEqual({
    x: 0.4,
    y: 0.5,
  });
  session.run();
  session.pause();
  session.move("client", 0.8, 0.8);
  expect(session.getSnapshot().board.positions?.client).toEqual({
    x: 0.4,
    y: 0.5,
  });
});
