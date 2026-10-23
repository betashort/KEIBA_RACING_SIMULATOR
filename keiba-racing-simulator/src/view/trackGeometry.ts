import { DISTANCE, LANE_WIDTH, R, STRAIGHT_HALF } from "../sim/constants";

export type TrackPoint = {
  x: number;
  y: number;
  heading: number;
};

function headingOfClockwise(angle: number): number {
  return Math.atan2(-Math.cos(angle), Math.sin(angle));
}

export function point(distance: number, lane: number): TrackPoint {
  const laneOffset = (lane - 1) * LANE_WIDTH;
  const lap = ((distance % DISTANCE) + DISTANCE) % DISTANCE;
  const radius = R + laneOffset;

  if (lap === 0) {
    return {
      x: -STRAIGHT_HALF,
      y: -radius,
      heading: Math.PI,
    };
  }

  if (lap < 400) {
    // 外周を通る半円。-π/2 から -3π/2 へ進み、ゴールから向正面へ左回りでつながる。
    const angle = -Math.PI / 2 - (lap / 400) * Math.PI;
    return {
      x: -STRAIGHT_HALF + radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      heading: headingOfClockwise(angle),
    };
  }

  if (lap < 800) {
    const along = ((lap - 400) / 400) * (STRAIGHT_HALF * 2);
    return {
      x: -STRAIGHT_HALF + along,
      y: radius,
      heading: 0,
    };
  }

  if (lap < 1200) {
    const angle = Math.PI / 2 - ((lap - 800) / 400) * Math.PI;
    return {
      x: STRAIGHT_HALF + radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      heading: headingOfClockwise(angle),
    };
  }

  const along = ((lap - 1200) / 400) * (STRAIGHT_HALF * 2);
  return {
    x: STRAIGHT_HALF - along,
    y: -radius,
    heading: Math.PI,
  };
}

export function sampleLane(lane: number): TrackPoint[] {
  const points: TrackPoint[] = [];
  const pushRange = (
    start: number,
    end: number,
    steps: number,
    includeEnd: boolean,
  ) => {
    const last = includeEnd ? steps : steps - 1;
    for (let i = 0; i <= last; i++) {
      points.push(point(start + ((end - start) * i) / steps, lane));
    }
  };
  pushRange(0, 400, 48, false);
  pushRange(400, 800, 8, false);
  pushRange(800, 1200, 48, false);
  pushRange(1200, 1600, 8, true);
  return points;
}
