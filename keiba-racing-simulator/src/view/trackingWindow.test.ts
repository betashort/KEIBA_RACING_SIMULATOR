import { describe, expect, it } from "vitest";
import { DISTANCE } from "../sim/constants";
import { trackingWindow } from "./trackingWindow";

describe("trackingWindow", () => {
  it("全馬が距離 0 のとき、40m の窓を中央に余白つきで置く", () => {
    expect(trackingWindow([0, 0, 0])).toEqual({ from: -26, to: 26 });
  });

  it("隊列が 40m 未満のとき、幅を 40m まで広げて中央に置く", () => {
    expect(trackingWindow([100, 110])).toEqual({ from: 79, to: 131 });
  });

  it("隊列が 40m を超えるとき、先頭と最後尾の外側に余白を残す", () => {
    expect(trackingWindow([100, 180])).toEqual({ from: 94, to: 186 });
  });

  it("先頭が残り 100m 以内ならゴール地点を範囲に入れる", () => {
    const view = trackingWindow([1480, 1550]);
    expect(view.from).toBeLessThanOrEqual(1480 - 6);
    expect(view.to).toBeGreaterThanOrEqual(DISTANCE + 6);
  });

  it("ゴールを過ぎた馬も範囲に残す", () => {
    const view = trackingWindow([1610, 1640]);
    expect(view.from).toBeLessThanOrEqual(1610 - 6);
    expect(view.to).toBeGreaterThanOrEqual(1640 + 6);
    expect(view.to).toBeLessThanOrEqual(DISTANCE + 50);
    expect(view.from).toBeLessThanOrEqual(DISTANCE);
  });
});
