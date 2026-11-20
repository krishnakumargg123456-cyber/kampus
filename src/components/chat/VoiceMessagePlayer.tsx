import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

interface VoiceMessagePlayerProps {
  src: string;
  durationSec?: number;
  waveformPeaks?: number[];
  isOutgoing: boolean;
}

function formatSec(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  src,
  durationSec = 0,
  waveformPeaks,
  isOutgoing,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSec);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed]);

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      try {
        await el.play();
        setPlaying(true);
      } catch {
        setLoadError(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    const val = Number(e.target.value);
    if (el) {
      el.currentTime = val;
      setCurrentTime(val);
    }
  };

  const cycleSpeed = () => {
    setSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  const peaks = waveformPeaks && waveformPeaks.length > 0 ? waveformPeaks : null;
  const maxDur = totalDuration > 0 ? totalDuration : 1;
  const progressRatio = Math.min(1, currentTime / maxDur);

  return (
    <div className="flex items-center gap-2.5 min-w-[220px] sm:min-w-[260px]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setTotalDuration(d);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => setLoadError(true)}
      />

      <button
        type="button"
        disabled={loadError}
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
          isOutgoing
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } disabled:opacity-40`}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        {peaks ? (
          <div className="flex items-end gap-[2px] h-5">
            {peaks.map((amp, idx) => {
              const barPct = idx / peaks.length;
              const active = barPct <= progressRatio;
              return (
                <span
                  key={idx}
                  className={`flex-1 rounded-full transition-colors ${
                    active
                      ? isOutgoing
                        ? 'bg-white'
                        : 'bg-blue-600'
                      : isOutgoing
                        ? 'bg-white/35'
                        : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  style={{ height: `${Math.max(20, Math.min(100, Math.round(amp * 100)))}%` }}
                />
              );
            })}
          </div>
        ) : null}

        <input
          type="range"
          min={0}
          max={maxDur}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          aria-label="Seek voice message"
          className="w-full h-1 accent-blue-500 cursor-pointer"
        />

        <div
          className={`flex items-center justify-between text-[10px] tabular-nums ${
            isOutgoing ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span>{loadError ? 'Audio unavailable' : `${formatSec(currentTime)} / ${formatSec(totalDuration)}`}</span>
          <button
            type="button"
            onClick={cycleSpeed}
            className="font-bold hover:underline cursor-pointer"
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
};
