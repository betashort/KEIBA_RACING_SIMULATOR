import { DISTANCE } from "../sim/constants";
import type { Frame, HorseInput } from "../sim/types";
import { placedHorses } from "./placedHorses";
import { trackingWindow } from "./trackingWindow";

const LABEL_BASELINE = 11;
const TURF_TOP = 22;
const TURF_LEFT = 32;
const RADIUS = 8;
const FIELD = "#2a2a2a";

function tickStep(span: number): number {
  if (span > 220) return 100;
  if (span > 90) return 50;
  if (span > 40) return 20;
  return 10;
}

export function drawLinear(
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

  const turfRight = width - 12;
  const turfBottom = height - 8;
  const view = trackingWindow(placed.map((marker) => marker.distance));
  const plotLeft = TURF_LEFT + RADIUS + 2;
  const plotRight = turfRight - RADIUS - 2;
  const laneTop = TURF_TOP + RADIUS + 10;
  const laneBottom = turfBottom - RADIUS - 10;
  const span = view.to - view.from;

  const xOf = (distance: number) =>
    plotLeft + ((distance - view.from) / span) * (plotRight - plotLeft);
  const yOf = (lane: number) => {
    const t = Math.min(1, Math.max(0, (lane - 1) / 4));
    return laneTop + t * (laneBottom - laneTop);
  };

  ctx.fillStyle = "#2f7d32";
  ctx.fillRect(TURF_LEFT, TURF_TOP, turfRight - TURF_LEFT, turfBottom - TURF_TOP);

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(TURF_LEFT, TURF_TOP);
  ctx.lineTo(turfRight, TURF_TOP);
  ctx.moveTo(TURF_LEFT, turfBottom);
  ctx.lineTo(turfRight, turfBottom);
  ctx.stroke();

  ctx.fillStyle = "#d5d5d5";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("内", 8, TURF_TOP);
  ctx.fillText("外", 8, turfBottom);

  const finishInView = DISTANCE >= view.from && DISTANCE <= view.to;
  const finishX = xOf(DISTANCE);

  ctx.font = "11px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("残り", TURF_LEFT, LABEL_BASELINE);

  const step = tickStep(span);
  const first = Math.ceil(view.from / step) * step;
  for (let distance = first; distance <= view.to + 1e-6; distance += step) {
    if (distance < 0 || distance > DISTANCE) continue;
    const x = xOf(distance);
    if (x < TURF_LEFT || x > turfRight) continue;
    const atFinish = Math.abs(distance - DISTANCE) < 1e-6;
    if (!atFinish) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.moveTo(x, TURF_TOP);
      ctx.lineTo(x, turfBottom);
      ctx.stroke();
    }
    const label = atFinish ? "ゴール" : String(DISTANCE - distance);
    const labelWidth = ctx.measureText(label).width;
    if (x - labelWidth / 2 < TURF_LEFT + 28) continue;
    if (!finishInView && x + labelWidth / 2 > width - 78) continue;
    ctx.fillStyle = "#d5d5d5";
    ctx.textAlign = "center";
    ctx.fillText(label, x, LABEL_BASELINE);
  }

  if (!finishInView) {
    ctx.fillStyle = "#d5d5d5";
    ctx.textAlign = "right";
    ctx.fillText("ゴール →", width - 12, LABEL_BASELINE);
  }

  if (view.from <= 0 && view.to >= 0) {
    const startX = xOf(0);
    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.moveTo(startX, TURF_TOP);
    ctx.lineTo(startX, turfBottom);
    ctx.stroke();
  }

  if (finishInView) {
    const stripes = 8;
    const band = (turfBottom - TURF_TOP) / stripes;
    ctx.lineWidth = 4;
    ctx.lineCap = "butt";
    for (let i = 0; i < stripes; i++) {
      ctx.beginPath();
      ctx.strokeStyle = i % 2 === 0 ? "#ffffff" : "#e53935";
      ctx.moveTo(finishX, TURF_TOP + band * i);
      ctx.lineTo(finishX, TURF_TOP + band * (i + 1));
      ctx.stroke();
    }
  }

  const markers = placed
    .map((marker) => ({
      ...marker,
      x: xOf(marker.distance),
      y: yOf(marker.lane),
    }))
    .sort((a, b) => a.y - b.y);

  for (const marker of markers) {
    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.moveTo(marker.x + RADIUS, marker.y);
    ctx.lineTo(marker.x + RADIUS + 9, marker.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = marker.horse.color;
    ctx.arc(marker.x, marker.y, RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111111";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(marker.horse.post), marker.x, marker.y + 0.5);
  }
}
