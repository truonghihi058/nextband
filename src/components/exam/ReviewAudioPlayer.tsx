import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  ExternalLink,
} from "lucide-react";

interface ReviewAudioPlayerProps {
  src: string;
  className?: string;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export function ReviewAudioPlayer({ src, className }: ReviewAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const syncDuration = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    const rawDuration = audio.duration;
    if (!Number.isFinite(rawDuration) || rawDuration <= 0) return;
    setDuration(rawDuration);
  };

  const progress = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, (currentTime / duration) * 100);
  }, [currentTime, duration]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const seekBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.max(0, Math.min(audio.currentTime + delta, duration || 0));
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const onRateChange = (value: string) => {
    const nextRate = Number(value);
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(nextRate)) return;
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  return (
    <div className={`rounded-md border bg-muted/30 p-3 space-y-3 ${className || ""}`.trim()}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          setCurrentTime(audio.currentTime || 0);
          syncDuration(audio);
        }}
        onLoadedMetadata={(e) => syncDuration(e.currentTarget)}
        onDurationChange={(e) => syncDuration(e.currentTarget)}
        onCanPlay={(e) => syncDuration(e.currentTarget)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-2">
        <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => seekBy(-10)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => seekBy(10)}>
          <RotateCw className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="h-3.5 w-3.5" />
          <select
            className="h-8 rounded border bg-background px-2 text-xs"
            value={String(playbackRate)}
            onChange={(e) => onRateChange(e.target.value)}
          >
            {PLAYBACK_RATES.map((rate) => (
              <option key={rate} value={String(rate)}>
                {rate}x
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Đang phát: {formatTime(currentTime)}</span>
          <span>Tổng độ dài: {formatTime(duration)}</span>
        </div>
      </div>

      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Mở audio trong tab mới
      </a>
    </div>
  );
}
