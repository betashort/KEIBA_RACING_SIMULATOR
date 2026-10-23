import { useEffect, useMemo, useRef, useState } from "react";
import { sampleRace } from "./sampleRace";
import { DISTANCE, DT } from "./sim/constants";
import { simulate } from "./sim/simulate";
import { downloadGif, encodeRaceGif } from "./view/exportGif";
import { formatTime } from "./view/formatTime";
import { LinearTrack } from "./view/LinearTrack";
import { Ranking } from "./view/Ranking";
import { TrackCanvas } from "./view/TrackCanvas";
import "./App.css";

const SPEEDS = [1, 2, 4] as const;
type Speed = (typeof SPEEDS)[number];

export function App() {
  const race = useMemo(() => simulate(sampleRace), []);
  const finalTime = race.frames[race.frames.length - 1].time;
  const [playTime, setPlayTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const playTimeRef = useRef(0);
  const speedRef = useRef<Speed>(1);
  const gifToken = useRef(0);
  const [gifStatus, setGifStatus] = useState<string | null>(null);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    return () => {
      gifToken.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = -1;
    const loop = (now: number) => {
      if (!Number.isFinite(now)) {
        raf = requestAnimationFrame(loop);
        return;
      }
      if (last < 0) {
        last = now;
        raf = requestAnimationFrame(loop);
        return;
      }
      let delta = (now - last) / 1000;
      last = now;
      if (!Number.isFinite(delta) || delta < 0) delta = 0;
      else if (delta > 0.1) delta = 0.1;
      const next = playTimeRef.current + delta * speedRef.current;
      if (next >= finalTime) {
        playTimeRef.current = finalTime;
        setPlayTime(finalTime);
        setPlaying(false);
        return;
      }
      playTimeRef.current = next;
      setPlayTime(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, finalTime]);

  const shownTime = Math.min(Math.max(playTime, 0), finalTime);
  const lastIndex = race.frames.length - 1;
  const index = Math.min(
    lastIndex,
    Math.max(0, Math.floor(shownTime / DT + 1e-6)),
  );
  const frame = race.frames[index] ?? race.frames[0];
  const atEnd = shownTime >= finalTime - 1e-9;
  const leader = frame.horses.reduce((best, horse) =>
    horse.rank < best.rank ? horse : best,
  );
  const remaining = Math.max(0, Math.round(DISTANCE - leader.distance));

  const play = () => {
    if (playing || atEnd) return;
    setPlaying(true);
  };

  const pause = () => setPlaying(false);

  const restart = () => {
    playTimeRef.current = 0;
    setPlayTime(0);
    setPlaying(true);
  };

  const exporting = gifStatus !== null && gifStatus !== "error";

  const saveGif = () => {
    if (exporting) return;
    const token = ++gifToken.current;
    setGifStatus("0");
    void encodeRaceGif(
      sampleRace.horses,
      race.frames,
      race.finish,
      speed,
      (ratio) => {
        if (gifToken.current !== token) return;
        const next = String(Math.floor(ratio * 100));
        setGifStatus((prev) => (prev === next ? prev : next));
      },
      () => gifToken.current !== token,
    )
      .then((bytes) => {
        if (gifToken.current !== token || !bytes) return;
        downloadGif(bytes, "keiba-1600.gif");
        setGifStatus(null);
      })
      .catch(() => {
        if (gifToken.current !== token) return;
        setGifStatus("error");
      });
  };

  return (
    <main className="app">
      <section className="stage">
        <h1>芝 1600m　左回り</h1>
        <div className="track-slot">
          <TrackCanvas
            horses={sampleRace.horses}
            frames={race.frames}
            playTime={shownTime}
          />
        </div>
        <div className="linear-slot">
          <LinearTrack
            horses={sampleRace.horses}
            frames={race.frames}
            playTime={shownTime}
          />
        </div>
      </section>
      <aside className="side">
        <Ranking
          horses={sampleRace.horses}
          frame={frame}
          finish={atEnd ? race.finish : null}
        />
        <div className="controls">
          <div className="control-row">
            <button type="button" onClick={play} disabled={playing || atEnd}>
              再生
            </button>
            <button type="button" onClick={pause} disabled={!playing}>
              一時停止
            </button>
            <button type="button" onClick={restart}>
              最初から
            </button>
          </div>
          <div className="control-row">
            <button
              type="button"
              className="export"
              onClick={saveGif}
              disabled={exporting}
              aria-busy={exporting}
            >
              {gifStatus === "error"
                ? "保存に失敗しました"
                : exporting
                  ? `保存中 ${gifStatus}%`
                  : "GIFを保存"}
            </button>
          </div>
          <div className="control-row">
            <span className="label">速度</span>
            {SPEEDS.map((value) => (
              <button
                key={value}
                type="button"
                className={speed === value ? "is-selected" : undefined}
                aria-pressed={speed === value}
                onClick={() => setSpeed(value)}
              >
                {value}x
              </button>
            ))}
          </div>
          <div className="status-row">
            <span>経過 {formatTime(shownTime)}</span>
            <span>先頭の残り {remaining}m</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
