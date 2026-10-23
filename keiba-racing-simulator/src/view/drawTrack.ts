import { LANE_WIDTH, R, STRAIGHT_HALF } from "../sim/constants";
import type { Frame, HorseInput } from "../sim/types";
import { placedHorses } from "./placedHorses";
import { point, sampleLane } from "./trackGeometry";

const MARGIN = 48;
const FIELD = "#2a2a2a";

function laneFromOffset(offset: number): number {
  return 1 + offset / LANE_WIDTH;
}

export function drawTrack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horses: HorseInput[],
  frames: Frame[],
  playTime: number,
): void {
  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, width, height);

  const placed = placedHorses(horses, frames, playTime);
  if (!placed) return;

  const outer = 4 + 4 * LANE_WIDTH;
  const halfW = STRAIGHT_HALF + R + outer;
  const halfH = R + outer;
  const scale = Math.min(
    (width - MARGIN * 2) / (halfW * 2),
    (height - MARGIN * 2) / (halfH * 2),
  );
  const originX = width / 2;
  const originY = height / 2;
  const radius = Math.max(11, scale * 10);
  const nose = (radius * 12) / 11;

  const toPx = (x: number, y: number) => ({
    x: originX + x * scale,
    y: originY - y * scale,
  });

  const trace = (lane: number) => {
    const samples = sampleLane(lane);
    samples.forEach((sample, index) => {
      const px = toPx(sample.x, sample.y);
      if (index === 0) ctx.moveTo(px.x, px.y);
      else ctx.lineTo(px.x, px.y);
    });
    ctx.closePath();
  };

  ctx.beginPath();
  trace(laneFromOffset(-4));
  trace(laneFromOffset(4 * LANE_WIDTH + 4));
  ctx.fillStyle = "#2f7d32";
  ctx.fill("evenodd");

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#ffffff";
  ctx.lineJoin = "round";
  for (const offset of [-4, 4 * LANE_WIDTH + 4]) {
    ctx.beginPath();
    trace(laneFromOffset(offset));
    ctx.stroke();
  }

  const inner = point(0, laneFromOffset(-4));
  const outerLane = point(0, laneFromOffset(4 * LANE_WIDTH + 4));
  const start = toPx(inner.x, inner.y);
  const end = toPx(outerLane.x, outerLane.y);
  const stripes = 8;
  ctx.lineWidth = 4;
  ctx.lineCap = "butt";
  for (let i = 0; i < stripes; i++) {
    ctx.beginPath();
    ctx.strokeStyle = i % 2 === 0 ? "#ffffff" : "#e53935";
    ctx.moveTo(
      start.x + ((end.x - start.x) * i) / stripes,
      start.y + ((end.y - start.y) * i) / stripes,
    );
    ctx.lineTo(
      start.x + ((end.x - start.x) * (i + 1)) / stripes,
      start.y + ((end.y - start.y) * (i + 1)) / stripes,
    );
    ctx.stroke();
  }

  const markers = placed.map((marker) => {
    const at = point(marker.distance, marker.lane);
    return { horse: marker.horse, px: toPx(at.x, at.y), heading: at.heading };
  });
  markers.sort((a, b) => a.px.y - b.px.y);

  for (const marker of markers) {
    const noseX = Math.cos(marker.heading) * nose;
    const noseY = -Math.sin(marker.heading) * nose;
    const edgeX = Math.cos(marker.heading) * radius;
    const edgeY = -Math.sin(marker.heading) * radius;
    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.moveTo(marker.px.x + edgeX, marker.px.y + edgeY);
    ctx.lineTo(marker.px.x + edgeX + noseX, marker.px.y + edgeY + noseY);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = marker.horse.color;
    ctx.arc(marker.px.x, marker.px.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111111";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.round((radius * 12) / 11)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(marker.horse.post), marker.px.x, marker.px.y + 0.5);
  }
}
