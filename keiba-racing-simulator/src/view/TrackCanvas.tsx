import { useEffect, useRef } from "react";
import type { Frame, HorseInput } from "../sim/types";
import { drawTrack } from "./drawTrack";
import { useParentBox } from "./useParentBox";

type TrackCanvasProps = {
  horses: HorseInput[];
  frames: Frame[];
  playTime: number;
};

export function TrackCanvas({ horses, frames, playTime }: TrackCanvasProps) {
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
    drawTrack(ctx, width, height, horses, frames, playTime);
  }, [frames, height, horses, playTime, width]);

  return <canvas ref={canvasRef} className="track" aria-label="コース" />;
}
