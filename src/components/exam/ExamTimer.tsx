import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  duration: number; // in minutes
  onTimeUp?: () => void;
  size?: 'default' | 'large';
}

export function ExamTimer({ duration, onTimeUp, size = 'default' }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft < 300; // Less than 5 minutes
  const isCritical = timeLeft < 60; // Less than 1 minute

  if (size === 'large') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2 rounded-xl font-mono transition-colors',
          isCritical
            ? 'bg-destructive text-destructive-foreground animate-pulse'
            : isLow
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted'
        )}
      >
        <Clock className="h-5 w-5" />
        <span className="text-2xl font-bold tracking-wider">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg',
      isLow ? 'bg-destructive/10 text-destructive' : 'bg-muted'
    )}>
      <Clock className="h-4 w-4" />
      <span className="font-mono font-medium">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
