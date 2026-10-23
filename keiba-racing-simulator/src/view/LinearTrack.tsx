import { useEffect, useRef } from "react";
import type { Frame, HorseInput } from "../sim/types";
import { drawLinear } from "./drawLinear";
import { useParentBox } from "./useParentBox";

type LinearTrackProps = {
  horses: HorseInput[];
  frames: Frame[];
  playTime: number;
};

export function LinearTrack({ horses, frames, playTime }: LinearTrackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useParentBox(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width < 1 || height < 1) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLinear(ctx, width, height, horses, frames, playTime);
  }, [frames, height, horses, playTime, width]);

  return (
    <canvas ref={canvasRef} className="linear-track" aria-label="直線の走行状況" />
  );
}
