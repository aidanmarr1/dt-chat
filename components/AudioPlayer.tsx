"use client";

import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  src: string;
  isOwn: boolean;
}

export default function AudioPlayer({ src, isOwn }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const BAR_COUNT = 24;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  function handleBarClick(index: number) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const pct = index / BAR_COUNT;
    audio.currentTime = pct * duration;
    setCurrentTime(audio.currentTime);
  }

  const progress = duration > 0 ? currentTime / duration : 0;
  const formatTime = (s: number) => {
    if (!isFinite(s) || s === 0) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  // Generate pseudo-random bar heights (deterministic based on src)
  const barHeights = Array.from({ length: BAR_COUNT }, (_, i) => {
    const seed = (i * 7 + 13) % 17;
    return 30 + (seed / 17) * 70; // 30-100%
  });

  return (
    <div className="flex items-center gap-2.5 py-1">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 cursor-pointer ${
          isOwn
            ? `bg-background/20 hover:bg-background/30 text-background ${playing ? "shadow-[0_0_10px_rgba(255,255,255,0.15)]" : ""}`
            : `bg-accent/15 hover:bg-accent/25 text-accent ${playing ? "shadow-[0_0_10px_rgba(var(--acc-rgb),0.2)]" : ""}`
        }`}
      >
        {playing ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
        )}
      </button>

      {/* Waveform bars */}
      <div className="flex items-center gap-[2px] flex-1 h-8 cursor-pointer">
        {barHeights.map((height, i) => {
          const filled = i / BAR_COUNT < progress;
          const animatedHeight = playing && !filled
            ? height + Math.sin((Date.now() / 200) + i * 0.7) * 8
            : height;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full min-w-[2px] transition-all duration-150 ${
                filled
                  ? isOwn ? "bg-background" : "bg-accent"
                  : isOwn ? "bg-background/30 hover:bg-background/50" : "bg-border hover:bg-accent/30"
              }`}
              style={{
                height: `${Math.min(100, Math.max(20, animatedHeight))}%`,
                transition: playing ? "height 0.15s ease, background-color 0.1s" : "background-color 0.1s",
              }}
              onClick={() => handleBarClick(i)}
            />
          );
        })}
      </div>

      {/* Time */}
      <span className={`text-[11px] font-mono shrink-0 ${
        isOwn ? "text-background/60" : "text-muted"
      }`}>
        {playing || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
      </span>
    </div>
  );
}
