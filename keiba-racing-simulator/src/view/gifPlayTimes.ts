/** GIF の 1 コマを見せる長さ。速度によらず固定する。 */
export const GIF_FRAME_SEC = 0.1;
/** 着順を読めるように、最終時刻の絵をこの秒数だけ繰り返す。 */
export const GIF_HOLD_SEC = 2;

/** 速度 N では、1 コマごとにシミュレーションを 0.1×N 秒進める。 */
export function gifPlayTimes(finalTime: number, speed = 1): number[] {
  const step = GIF_FRAME_SEC * speed;
  const end = Math.max(0, finalTime);
  const steps = Math.floor((end + 1e-9) / step);
  const times: number[] = [];
  for (let i = 0; i < steps; i++) {
    times.push(Math.round(i * step * 10) / 10);
  }
  const hold = Math.round(GIF_HOLD_SEC / GIF_FRAME_SEC);
  const last = Math.round(end * 10) / 10;
  for (let i = 0; i < hold; i++) times.push(last);
  if (times.length === 0) times.push(0);
  return times;
}
