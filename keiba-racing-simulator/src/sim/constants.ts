export const DT = 0.1;
export const DISTANCE = 1600;
export const LANE_WIDTH = 2.5;
export const BLOCK_GAP = 4.0;
export const BLOCK_LANE = 0.7;
export const PAST_FINISH = 50;
export const LENGTH = 2.4;
export const R = 400 / Math.PI;
export const STRAIGHT_HALF = 200;
export const MAX_TIME = 180;

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
