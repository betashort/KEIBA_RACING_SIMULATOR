import type { FinishEntry, Frame, HorseInput, RunningStyle } from "../sim/types";
import { formatTime } from "./formatTime";

const STYLE_LABEL: Record<RunningStyle, string> = {
  front: "逃",
  stalk: "先",
  mid: "差",
  closer: "追",
};

export type RankingColumn = {
  header: string;
  className?: "num" | "style";
  align: "left" | "right" | "center";
};

export type RankingTable = {
  title: string;
  columns: RankingColumn[];
  rows: { id: string; cells: string[] }[];
};

export function rankingTable(
  horses: HorseInput[],
  frame: Frame,
  finish: FinishEntry[] | null,
): RankingTable {
  const byId = new Map(horses.map((horse) => [horse.id, horse]));

  if (finish) {
    return {
      title: "着順",
      columns: [
        { header: "着順", className: "num", align: "right" },
        { header: "馬番", className: "num", align: "right" },
        { header: "馬名", align: "left" },
        { header: "タイム", className: "num", align: "right" },
        { header: "着差", className: "num", align: "right" },
      ],
      rows: finish.map((entry) => {
        const horse = byId.get(entry.id);
        return {
          id: entry.id,
          cells: [
            String(entry.rank),
            horse ? String(horse.post) : "",
            horse?.name ?? "",
            formatTime(entry.time),
            entry.rank === 1 ? "" : entry.marginLengths.toFixed(1),
          ],
        };
      }),
    };
  }

  const leader = frame.horses.reduce((best, horse) =>
    horse.rank < best.rank ? horse : best,
  );

  return {
    title: "順位",
    columns: [
      { header: "順位", className: "num", align: "right" },
      { header: "馬番", className: "num", align: "right" },
      { header: "馬名", align: "left" },
      { header: "脚質", className: "style", align: "center" },
      { header: "差", className: "num", align: "right" },
    ],
    rows: [...frame.horses]
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => {
        const horse = byId.get(entry.id);
        const gap =
          entry.rank === 1 ? 0 : Math.round(leader.distance - entry.distance);
        return {
          id: entry.id,
          cells: [
            String(entry.rank),
            horse ? String(horse.post) : "",
            horse?.name ?? "",
            horse ? STYLE_LABEL[horse.runningStyle] : "",
            `${gap}m`,
          ],
        };
      }),
  };
}
