"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Mic } from "lucide-react";

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
  waveform?: number[];
  isMe?: boolean;
  isTravel?: boolean;
}

export function VoiceNotePlayer({
  audioUrl,
  duration: initialDuration,
  waveform,
  isMe = false,
  isTravel = false,
}: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Default pleasant waveform if no sampled waveform was attached
  const defaultWaveform = [
    25, 45, 60, 35, 80, 65, 40, 90, 75, 50, 85, 95, 60, 45, 75, 55, 35, 65,
    80, 50, 30, 60, 45, 25,
  ];
  const bars = waveform && waveform.length >= 8 ? waveform : defaultWaveform;

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (
        audio.duration &&
        !isNaN(audio.duration) &&
        isFinite(audio.duration)
      ) {
        setTotalDuration(audio.duration);
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      setIsPlaying(false);
    };

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Audio playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (index: number) => {
    if (!audioRef.current || !totalDuration) return;
    const seekTime = (index / bars.length) * totalDuration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed: 1 | 1.5 | 2 =
      playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    const valid = isNaN(secs) || !isFinite(secs) ? 0 : Math.max(0, secs);
    const m = Math.floor(valid / 60);
    const s = Math.floor(valid % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressFraction =
    totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[240px] sm:min-w-[270px] max-w-[320px] select-none">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-all cursor-pointer ${
          isMe
            ? isTravel
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-emerald-600 hover:bg-emerald-700 text-white"
        }`}
        title={isPlaying ? "Pause" : "Play voice note"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 ml-0.5 fill-current" />
        )}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Waveform Bars */}
        <div
          className="flex items-center gap-[2.5px] h-7 cursor-pointer py-1"
          title="Tap to seek"
        >
          {bars.map((heightPercent, idx) => {
            const barFraction = (idx + 1) / bars.length;
            const isPlayed = progressFraction >= barFraction;
            const heightPx = Math.max(
              4,
              Math.min(24, Math.round((heightPercent / 100) * 24))
            );

            return (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeek(idx);
                }}
                style={{ height: `${heightPx}px` }}
                className={`w-1 rounded-full transition-colors duration-100 ${
                  isPlayed
                    ? isTravel
                      ? "bg-orange-600 dark:bg-orange-400"
                      : "bg-emerald-700 dark:bg-emerald-400"
                    : "bg-slate-300 dark:bg-slate-600/70 hover:bg-slate-400"
                }`}
              />
            );
          })}
        </div>

        {/* Duration & Speed */}
        <div className="flex items-center justify-between text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
          <span className="tabular-nums">
            {isPlaying ? formatTime(currentTime) : formatTime(totalDuration)}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeed}
              className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition"
              title="Change playback speed"
            >
              {playbackRate}x
            </button>
            <Mic className="w-3 h-3 text-slate-400 opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
}
