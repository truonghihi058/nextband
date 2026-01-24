import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  data: Uint8Array | null;
  isRecording: boolean;
  className?: string;
}

export function AudioWaveform({ data, isRecording, className = '' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'hsl(var(--muted))';
    ctx.fillRect(0, 0, width, height);

    if (!data || !isRecording) {
      // Draw idle state
      const centerY = height / 2;
      ctx.strokeStyle = 'hsl(var(--muted-foreground))';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      return;
    }

    // Draw waveform
    const barWidth = width / data.length;
    const centerY = height / 2;

    ctx.fillStyle = 'hsl(var(--speaking))';

    for (let i = 0; i < data.length; i++) {
      const barHeight = (data[i] / 255) * height * 0.8;
      const x = i * barWidth;
      const y = centerY - barHeight / 2;
      
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  }, [data, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className={`rounded-lg ${className}`}
    />
  );
}
