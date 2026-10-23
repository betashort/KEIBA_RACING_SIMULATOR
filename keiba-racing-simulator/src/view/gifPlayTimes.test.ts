import { describe, expect, it } from "vitest";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { sampleRace } from "../sampleRace";
import { simulate } from "../sim/simulate";
import { GIF_FRAME_SEC, GIF_HOLD_SEC, gifPlayTimes } from "./gifPlayTimes";
import { rankingTable } from "./rankingTable";

describe("gifPlayTimes", () => {
  const finalTime = simulate(sampleRace).frames.at(-1)?.time ?? 0;
  const hold = Math.round(GIF_HOLD_SEC / GIF_FRAME_SEC);

  it("1倍は 0.1 秒刻みで、着順を 2 秒見せる", () => {
    const times = gifPlayTimes(finalTime, 1);
    expect(times[0]).toBe(0);
    expect(times[1]).toBe(GIF_FRAME_SEC);
    expect(times[times.length - 1]).toBe(finalTime);
    expect(times.length).toBe(Math.floor(finalTime / GIF_FRAME_SEC) + hold);
    expect(times.slice(-hold)).toEqual(Array(hold).fill(finalTime));
    expect(times[times.length - hold - 1]).toBe(
      Math.round((finalTime - GIF_FRAME_SEC) * 10) / 10,
    );
  });

  it("2倍と 4倍はコマの間隔だけ広がる", () => {
    const once = gifPlayTimes(finalTime, 1);
    const twice = gifPlayTimes(finalTime, 2);
    const four = gifPlayTimes(finalTime, 4);
    expect(twice[1]).toBe(0.2);
    expect(four[1]).toBe(0.4);
    expect(twice.length).toBe(Math.floor(finalTime / 0.2) + hold);
    expect(four.length).toBe(Math.floor(finalTime / 0.4) + hold);
    expect(twice.length).toBeLessThan(once.length);
    expect(four.length).toBeLessThan(twice.length);
    expect(twice.slice(-hold)).toEqual(Array(hold).fill(finalTime));
    expect(four.slice(-hold)).toEqual(Array(hold).fill(finalTime));
  });

  it("時刻は減らない", () => {
    for (const speed of [1, 2, 4]) {
      const times = gifPlayTimes(finalTime, speed);
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i - 1] ?? 0);
      }
    }
  });
});

describe("rankingTable", () => {
  const race = simulate(sampleRace);

  it("スタート時は順位で、先頭との差はすべて 0m", () => {
    const table = rankingTable(sampleRace.horses, race.frames[0], null);
    expect(table.title).toBe("順位");
    expect(table.rows).toHaveLength(sampleRace.horses.length);
    expect(table.rows.every((row) => row.cells[4] === "0m")).toBe(true);
  });

  it("着順表は 1 着の着差を空欄にする", () => {
    const last = race.frames[race.frames.length - 1];
    const table = rankingTable(sampleRace.horses, last, race.finish);
    expect(table.title).toBe("着順");
    expect(table.rows[0]?.cells[4]).toBe("");
    expect(table.rows[1]?.cells[4]).toMatch(/^\d+\.\d$/);
  });
});

describe("gifenc", () => {
  it("単色の画素を GIF89a にする", () => {
    const rgba = new Uint8Array(2 * 2 * 4);
    for (let i = 0; i < 4; i++) {
      rgba[i * 4] = 229;
      rgba[i * 4 + 1] = 57;
      rgba[i * 4 + 2] = 53;
      rgba[i * 4 + 3] = 255;
    }
    const palette = quantize(rgba, 16);
    const index = applyPalette(rgba, palette);
    const gif = GIFEncoder();
    gif.writeFrame(index, 2, 2, { palette, delay: 100, repeat: -1 });
    gif.finish();
    const bytes = gif.bytes();
    expect(String.fromCharCode(...bytes.slice(0, 6))).toBe("GIF89a");
  });
});
