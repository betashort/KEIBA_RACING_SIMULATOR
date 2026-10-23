import { DT } from "../sim/constants";
import type { Frame, HorseInput } from "../sim/types";

export type PlacedHorse = {
  horse: HorseInput;
  distance: number;
  lane: number;
};

export function placedHorses(
  horses: HorseInput[],
  frames: Frame[],
  playTime: number,
): PlacedHorse[] | null {
  const lastIndex = frames.length - 1;
  if (lastIndex < 0) return null;
  const raw = playTime / DT;
  const index = Math.min(lastIndex, Math.max(0, Math.floor(raw + 1e-6)));
  const alpha = index >= lastIndex ? 0 : raw - index;
  const current = frames[index];
  const next = frames[Math.min(index + 1, lastIndex)];
  if (!current || !next) return null;

  return horses.map((horse) => {
    const from = current.horses.find((entry) => entry.id === horse.id);
    const to = next.horses.find((entry) => entry.id === horse.id);
    const distance =
      (from?.distance ?? 0) +
      ((to?.distance ?? 0) - (from?.distance ?? 0)) * alpha;
    const lane =
      (from?.lane ?? 1) + ((to?.lane ?? 1) - (from?.lane ?? 1)) * alpha;
    return { horse, distance, lane };
  });
}
