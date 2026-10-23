import { DISTANCE, DT } from "../sim/constants";
import type { FinishEntry, Frame, HorseInput } from "../sim/types";
import { drawLinear } from "./drawLinear";
import { drawTrack } from "./drawTrack";
import { formatTime } from "./formatTime";
import { rankingTable } from "./rankingTable";

export const GIF_WIDTH = 960;
export const GIF_HEIGHT = 540;

const PAGE = "#16382a";
const PANEL = "#2a2a2a";
const TEXT = "#ffffff";
const MUTED = "#d5d5d5";
const LINE = "#4a4a4a";
const FONT = '"Segoe UI", "Yu Gothic UI", Meiryo, sans-serif';

function fillPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fillStyle = PANEL;
  ctx.fill();
}

function drawRanking(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  horses: HorseInput[],
  frame: Frame,
  finish: FinishEntry[] | null,
) {
  const table = rankingTable(horses, frame, finish);
  const left = x + 14;
  const inner = width - 28;

  ctx.fillStyle = TEXT;
  ctx.font = `600 16px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(table.title, left, y + 20);

  const top = y + 40;
  const rowH = Math.min(24, (y + height - 10 - top) / (table.rows.length + 1));
  const weight = table.columns.map((column) => (column.header === "馬名" ? 2.4 : 1));
  const weightSum = weight.reduce((sum, value) => sum + value, 0);
  const widths = weight.map((value) => (inner * value) / weightSum);

  const paintRow = (cells: string[], rowY: number, color: string) => {
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    let cellX = left;
    cells.forEach((cell, index) => {
      const column = table.columns[index];
      const colW = widths[index] ?? 0;
      const align = column?.align ?? "left";
      ctx.textAlign = align;
      const textX =
        align === "right"
          ? cellX + colW - 2
          : align === "center"
            ? cellX + colW / 2
            : cellX + 2;
      ctx.fillText(cell, textX, rowY);
      cellX += colW;
    });
  };

  paintRow(
    table.columns.map((column) => column.header),
    top + rowH / 2,
    MUTED,
  );
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top + rowH);
  ctx.lineTo(left + inner, top + rowH);
  ctx.stroke();

  table.rows.forEach((row, index) => {
    paintRow(row.cells, top + rowH * (index + 1.5), TEXT);
  });
}

export function drawRaceStill(
  ctx: CanvasRenderingContext2D,
  horses: HorseInput[],
  frames: Frame[],
  finish: FinishEntry[],
  playTime: number,
): void {
  const pad = 12;
  const gap = 10;
  const sideW = 300;
  const stageX = pad;
  const stageY = pad;
  const stageW = GIF_WIDTH - pad * 2 - gap - sideW;
  const stageH = GIF_HEIGHT - pad * 2;
  const titleH = 36;
  const linearH = 156;
  const trackW = stageW;
  const trackH = stageH - titleH - linearH;
  const sideX = stageX + stageW + gap;
  const statusH = 44;
  const rankH = stageH - gap - statusH;

  ctx.fillStyle = PAGE;
  ctx.fillRect(0, 0, GIF_WIDTH, GIF_HEIGHT);
  fillPanel(ctx, stageX, stageY, stageW, stageH);
  fillPanel(ctx, sideX, stageY, sideW, rankH);
  fillPanel(ctx, sideX, stageY + rankH + gap, sideW, statusH);

  ctx.fillStyle = TEXT;
  ctx.font = `600 18px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("芝 1600m　左回り", stageX + 14, stageY + titleH / 2);

  ctx.save();
  ctx.translate(stageX, stageY + titleH);
  drawTrack(ctx, trackW, trackH, horses, frames, playTime);
  ctx.restore();

  ctx.save();
  ctx.translate(stageX, stageY + titleH + trackH);
  drawLinear(ctx, trackW, linearH, horses, frames, playTime);
  ctx.restore();

  const lastIndex = frames.length - 1;
  const index = Math.min(
    lastIndex,
    Math.max(0, Math.floor(playTime / DT + 1e-6)),
  );
  const frame = frames[index] ?? frames[0];
  const finalTime = frames[lastIndex]?.time ?? 0;
  const atEnd = playTime >= finalTime - 1e-9;
  if (frame) {
    drawRanking(
      ctx,
      sideX,
      stageY,
      sideW,
      rankH,
      horses,
      frame,
      atEnd ? finish : null,
    );
    const leader = frame.horses.reduce((best, horse) =>
      horse.rank < best.rank ? horse : best,
    );
    const remaining = Math.max(0, Math.round(DISTANCE - leader.distance));
    const statusY = stageY + rankH + gap;
    ctx.font = `13px ${FONT}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = TEXT;
    ctx.textAlign = "left";
    ctx.fillText(
      `経過 ${formatTime(playTime)}`,
      sideX + 14,
      statusY + statusH / 2,
    );
    ctx.textAlign = "right";
    ctx.fillText(
      `先頭の残り ${remaining}m`,
      sideX + sideW - 14,
      statusY + statusH / 2,
    );
  }
}
