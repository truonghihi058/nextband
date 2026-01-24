import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ExamTimerProps {
  duration: number; // in minutes
  onTimeUp?: () => void;
}

export function ExamTimer({ duration, onTimeUp }: ExamTimerProps) {
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

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
      isLow ? 'bg-destructive/10 text-destructive' : 'bg-muted'
    }`}>
      <Clock className="h-4 w-4" />
      <span className="font-mono font-medium">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
