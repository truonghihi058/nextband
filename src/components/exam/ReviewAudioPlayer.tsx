import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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

  const onProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const percent = value[0] ?? 0;
    const nextTime = (percent / 100) * duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
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
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
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
        <Slider value={[progress]} max={100} step={0.1} onValueChange={onProgressChange} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>Tong do dai: {formatTime(duration)}</span>
        </div>
      </div>

      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Mo audio trong tab moi
      </a>
    </div>
  );
}
