export type RunningStyle = "front" | "stalk" | "mid" | "closer";

export type HorseInput = {
  id: string;
  name: string;
  post: number;
  color: string;
  runningStyle: RunningStyle;
  speed: number;
  stamina: number;
  acceleration: number;
  cornering: number;
};

export type RaceInput = {
  distance: 1600;
  horses: HorseInput[];
};

export type HorseFrame = {
  id: string;
  distance: number;
  lane: number;
  speed: number;
  rank: number;
};

export type Frame = {
  time: number;
  horses: HorseFrame[];
};

export type FinishEntry = {
  id: string;
  rank: number;
  time: number;
  marginLengths: number;
};

export type RaceOutput = {
  frames: Frame[];
  finish: FinishEntry[];
};
