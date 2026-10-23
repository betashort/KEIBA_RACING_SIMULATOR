import {
  BLOCK_GAP,
  BLOCK_LANE,
  DISTANCE,
  DT,
  LANE_WIDTH,
  LENGTH,
  MAX_TIME,
  PAST_FINISH,
  R,
  clamp,
} from "./constants";
import type {
  FinishEntry,
  Frame,
  HorseFrame,
  RaceInput,
  RaceOutput,
  RunningStyle,
} from "./types";

type StyleSpec = {
  early: number;
  late: number;
  threshold: number;
  lane: number;
};

const STYLE: Record<RunningStyle, StyleSpec> = {
  front: { early: 1.0, late: 0.94, threshold: 600, lane: 1.3 },
  stalk: { early: 0.96, late: 1.0, threshold: 400, lane: 1.8 },
  mid: { early: 0.92, late: 1.03, threshold: 500, lane: 2.5 },
  closer: { early: 0.88, late: 1.06, threshold: 400, lane: 3.2 },
};

type HorseState = {
  id: string;
  post: number;
  runningStyle: RunningStyle;
  stamina: number;
  acceleration: number;
  cornering: number;
  vMax: number;
  distance: number;
  speed: number;
  lane: number;
  effort: number;
  outward: number;
  finishTime: number | null;
  finishSpeed: number | null;
};

type Kinematics = {
  distance: number;
  speed: number;
  lane: number;
};

function isCornerFactor(distance: number): boolean {
  return (
    (distance >= 0 && distance < 400) || (distance >= 800 && distance < 1200)
  );
}

function isCornerGain(distance: number): boolean {
  const lap = distance % DISTANCE;
  if (lap === 0) return false;
  return lap < 400 || (lap >= 800 && lap < 1200);
}

function advance(horse: HorseState, preDistance: number, time: number): number {
  const step = horse.speed * DT;
  const laneOffset = (horse.lane - 1) * LANE_WIDTH;
  const gain = isCornerGain(preDistance)
    ? (step * R) / (R + laneOffset)
    : step;

  if (
    gain > 0 &&
    preDistance < DISTANCE &&
    preDistance + gain >= DISTANCE &&
    horse.finishTime == null
  ) {
    horse.finishTime = time + (DT * (DISTANCE - preDistance)) / gain;
    horse.finishSpeed = horse.speed;
  }

  horse.distance = preDistance + gain;
  if (horse.distance > DISTANCE + PAST_FINISH) {
    horse.distance = DISTANCE + PAST_FINISH;
    horse.speed = 0;
  }
  return step;
}

function makeFrame(horses: HorseState[], time: number): Frame {
  const order = horses
    .map((_, index) => index)
    .sort((a, b) => {
      if (horses[a].distance !== horses[b].distance) {
        return horses[b].distance - horses[a].distance;
      }
      return horses[a].post - horses[b].post;
    });
  const rankOf = new Map<string, number>();
  order.forEach((index, rank) => {
    rankOf.set(horses[index].id, rank + 1);
  });
  const horseFrames: HorseFrame[] = horses.map((horse) => ({
    id: horse.id,
    distance: horse.distance,
    lane: horse.lane,
    speed: horse.speed,
    rank: rankOf.get(horse.id) ?? 0,
  }));
  return { time, horses: horseFrames };
}

export function simulate(input: RaceInput): RaceOutput {
  const horses: HorseState[] = input.horses.map((horse) => ({
    id: horse.id,
    post: horse.post,
    runningStyle: horse.runningStyle,
    stamina: horse.stamina,
    acceleration: horse.acceleration,
    cornering: horse.cornering,
    vMax: 13.2 + 0.048 * horse.speed,
    distance: 0,
    speed: 0,
    lane: 1 + (horse.post - 1) * (4 / 7),
    effort: 0,
    outward: 0,
    finishTime: null,
    finishSpeed: null,
  }));

  let time = 0;
  const frames: Frame[] = [makeFrame(horses, time)];

  while (time < MAX_TIME) {
    const prev: Kinematics[] = horses.map((horse) => ({
      distance: horse.distance,
      speed: horse.speed,
      lane: horse.lane,
    }));

    for (let i = 0; i < horses.length; i++) {
      const horse = horses[i];
      const before = prev[i];

      if (horse.finishTime != null) {
        if (before.distance >= DISTANCE + PAST_FINISH) {
          horse.speed = 0;
          horse.distance = DISTANCE + PAST_FINISH;
        } else {
          advance(horse, before.distance, time);
        }
        continue;
      }

      const remaining = DISTANCE - before.distance;
      const style = STYLE[horse.runningStyle];
      const styleFactor = remaining > style.threshold ? style.early : style.late;

      const budget = DISTANCE * (0.5 + 0.45 * (horse.stamina / 100));
      let staminaFactor = 1;
      if (horse.effort > budget) {
        const fade = (horse.effort - budget) / (0.22 * DISTANCE);
        staminaFactor = clamp(1 - 0.45 * fade, 0.55, 1);
      }

      const cornerFactor = isCornerFactor(before.distance)
        ? 0.92 + 0.06 * (horse.cornering / 100)
        : 1;

      const aMax = 1.2 + 1.6 * (horse.acceleration / 100);
      let vTarget = horse.vMax * styleFactor * staminaFactor * cornerFactor;

      let blockerSpeed: number | null = null;
      let blockerGap = Infinity;
      let blockerPost = Infinity;
      for (let j = 0; j < horses.length; j++) {
        if (j === i) continue;
        const gap = prev[j].distance - before.distance;
        const laneGap = Math.abs(prev[j].lane - before.lane);
        if (gap > 0 && gap <= BLOCK_GAP && laneGap < BLOCK_LANE) {
          if (
            gap < blockerGap ||
            (gap === blockerGap && horses[j].post < blockerPost)
          ) {
            blockerGap = gap;
            blockerPost = horses[j].post;
            blockerSpeed = prev[j].speed;
          }
        }
      }

      if (blockerSpeed != null) {
        vTarget = Math.min(vTarget, blockerSpeed * 0.995);
        horse.outward = Math.min(2.2, horse.outward + 1.5 * DT);
      } else {
        horse.outward = Math.max(0, horse.outward - 0.8 * DT);
      }

      const accel = clamp(vTarget - before.speed, -aMax * DT, aMax * DT);
      horse.speed = Math.max(0, before.speed + accel);

      const preferred = clamp(
        style.lane + (horse.post - 4.5) * 0.12 + horse.outward,
        1,
        5,
      );
      horse.lane =
        before.lane + clamp(preferred - before.lane, -0.6 * DT, 0.6 * DT);

      const step = advance(horse, before.distance, time);
      horse.effort += (horse.speed / horse.vMax) ** 2 * step;
    }

    time = Math.round((time + DT) * 10) / 10;
    frames.push(makeFrame(horses, time));

    if (horses.every((horse) => horse.finishTime != null) || time >= MAX_TIME) {
      break;
    }
  }

  const ranked = [...horses].sort((a, b) => {
    const ta = a.finishTime ?? Number.POSITIVE_INFINITY;
    const tb = b.finishTime ?? Number.POSITIVE_INFINITY;
    if (ta !== tb) return ta - tb;
    return a.post - b.post;
  });
  const winner = ranked[0];
  const finish: FinishEntry[] = ranked.map((horse, index) => ({
    id: horse.id,
    rank: index + 1,
    time: horse.finishTime ?? 0,
    marginLengths:
      index === 0
        ? 0
        : ((horse.finishTime ?? 0) - (winner.finishTime ?? 0)) *
          (winner.finishSpeed ?? 0) /
          LENGTH,
  }));

  return { frames, finish };
}
