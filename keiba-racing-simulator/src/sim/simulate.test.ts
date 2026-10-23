import { describe, expect, it } from "vitest";
import { sampleRace } from "../sampleRace";
import { DISTANCE } from "./constants";
import { simulate } from "./simulate";

const result = simulate(sampleRace);

describe("simulate(sampleRace)", () => {
  it("同じ入力を二度計算すると位置と着タイムが一致する", () => {
    const again = simulate(sampleRace);
    expect(again.frames.length).toBe(result.frames.length);
    for (let i = 0; i < result.frames.length; i++) {
      for (let h = 0; h < result.frames[i].horses.length; h++) {
        expect(again.frames[i].horses[h].distance).toBe(
          result.frames[i].horses[h].distance,
        );
        expect(again.frames[i].horses[h].lane).toBe(
          result.frames[i].horses[h].lane,
        );
      }
    }
    const times = new Map(result.finish.map((entry) => [entry.id, entry.time]));
    for (const entry of again.finish) {
      expect(entry.time).toBe(times.get(entry.id));
    }
  });

  it("先頭フレームは時刻 0、全馬の走行距離 0", () => {
    expect(result.frames[0].time).toBe(0);
    for (const horse of result.frames[0].horses) {
      expect(horse.distance).toBe(0);
    }
  });

  it("各馬の走行距離はフレームごとに減らない", () => {
    for (const horse of sampleRace.horses) {
      let prev = 0;
      for (const frame of result.frames) {
        const distance = frame.horses.find((entry) => entry.id === horse.id)
          ?.distance;
        expect(distance).toBeGreaterThanOrEqual(prev);
        prev = distance ?? prev;
      }
    }
  });

  it("全馬が 90 秒以上 140 秒以下で完走する", () => {
    expect(result.finish).toHaveLength(sampleRace.horses.length);
    for (const entry of result.finish) {
      expect(entry.time).toBeGreaterThanOrEqual(90);
      expect(entry.time).toBeLessThanOrEqual(140);
    }
  });

  it("着順は 1 から頭数まで連続し、着タイムの昇順と一致する", () => {
    expect(result.finish.map((entry) => entry.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    const times = result.finish.map((entry) => entry.time);
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
  });

  it("時刻 20 秒の先頭は逃げ", () => {
    const frame = result.frames.find((entry) => entry.time === 20);
    expect(frame).toBeDefined();
    const leader = frame?.horses.find((horse) => horse.rank === 1);
    const style = sampleRace.horses.find((horse) => horse.id === leader?.id)
      ?.runningStyle;
    expect(style).toBe("front");
  });

  it("ナナセは残り 500m を切ったあと最終フレームで順位を上げる", () => {
    const early = result.frames.find((frame) => {
      const horse = frame.horses.find((entry) => entry.id === "h7");
      return horse != null && DISTANCE - horse.distance < 500;
    });
    expect(early).toBeDefined();
    const earlyRank = early?.horses.find((entry) => entry.id === "h7")?.rank;
    const last = result.frames[result.frames.length - 1];
    const lastRank = last.horses.find((entry) => entry.id === "h7")?.rank;
    expect(lastRank).toBeLessThan(earlyRank ?? 0);
  });
});
