import { DISTANCE, PAST_FINISH } from "../sim/constants";

/** 隊列がこれより短いときは、この幅まで広げて中央に置く。 */
export const MIN_WINDOW = 40;
/** 先頭・最後尾の外側に残す余白（m）。 */
export const TRACKING_PAD = 6;
/** 先頭がゴールまでこの距離以内なら、ゴール地点を範囲に入れる。 */
export const FINISH_LEAD = 100;

export function trackingWindow(distances: number[]): { from: number; to: number } {
  if (distances.length === 0) {
    return {
      from: -(MIN_WINDOW / 2 + TRACKING_PAD),
      to: MIN_WINDOW / 2 + TRACKING_PAD,
    };
  }

  const minD = Math.min(...distances);
  const maxD = Math.max(...distances);
  const span = Math.max(maxD - minD, MIN_WINDOW);
  const mid = (minD + maxD) / 2;
  let from = mid - span / 2 - TRACKING_PAD;
  let to = mid + span / 2 + TRACKING_PAD;

  if (maxD >= DISTANCE - FINISH_LEAD) {
    const needed = Math.max(maxD, DISTANCE) + TRACKING_PAD;
    to = Math.min(Math.max(to, needed), DISTANCE + PAST_FINISH);
    from = Math.min(from, minD - TRACKING_PAD);
  }

  return { from, to };
}
