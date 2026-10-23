import { GIFEncoder, applyPalette, quantize, snapColorsToPalette } from "gifenc";
import type { RGB } from "gifenc";
import type { FinishEntry, Frame, HorseInput } from "../sim/types";
import { GIF_FRAME_SEC, gifPlayTimes } from "./gifPlayTimes";
import { GIF_HEIGHT, GIF_WIDTH, drawRaceStill } from "./raceStill";

const KNOWN_COLORS = [
  "#16382a",
  "#2a2a2a",
  "#ffffff",
  "#d5d5d5",
  "#4a4a4a",
  "#2f7d32",
  "#e53935",
  "#111111",
];

function hexColor(hex: string): RGB {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function yieldToPaint(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export async function encodeRaceGif(
  horses: HorseInput[],
  frames: Frame[],
  finish: FinishEntry[],
  speed: number,
  onProgress: (ratio: number) => void,
  isCancelled: () => boolean,
): Promise<Uint8Array | null> {
  const canvas = document.createElement("canvas");
  canvas.width = GIF_WIDTH;
  canvas.height = GIF_HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas is unavailable");

  const times = gifPlayTimes(frames[frames.length - 1]?.time ?? 0, speed);
  const known = [
    ...KNOWN_COLORS.map(hexColor),
    ...horses.map((horse) => hexColor(horse.color)),
  ];
  const gif = GIFEncoder({ initialCapacity: 2 * 1024 * 1024 });
  let palette: RGB[] | null = null;

  onProgress(0);
  await yieldToPaint();

  for (let i = 0; i < times.length; i++) {
    if (isCancelled()) return null;
    drawRaceStill(ctx, horses, frames, finish, times[i] ?? 0);
    const rgba = new Uint8Array(
      ctx.getImageData(0, 0, GIF_WIDTH, GIF_HEIGHT).data,
    );
    if (!palette) {
      palette = quantize(rgba, 256);
      snapColorsToPalette(palette, known, 24);
    }
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, GIF_WIDTH, GIF_HEIGHT, {
      delay: GIF_FRAME_SEC * 1000,
      ...(i === 0 ? { palette, repeat: -1 } : {}),
    });
    onProgress((i + 1) / times.length);
    await yieldToPaint();
  }

  if (isCancelled()) return null;
  gif.finish();
  return gif.bytes();
}

export function downloadGif(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: "image/gif" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
