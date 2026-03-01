import { cn } from '@/lib/utils';
import { Flag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Question {
  id: string;
  order_index?: number;
}

interface QuestionPaginationProps {
  questions: Question[];
  answers: Record<string, any>;
  flaggedQuestions: Set<string>;
  currentQuestionId?: string;
  onQuestionClick: (questionId: string) => void;
  onToggleFlag: (questionId: string) => void;
  className?: string;
}

export function QuestionPagination({
  questions,
  answers,
  flaggedQuestions,
  currentQuestionId,
  onQuestionClick,
  onToggleFlag,
  className,
}: QuestionPaginationProps) {
  const getQuestionState = (q: Question) => {
    const value = answers[q.id];
    const isAnswered =
      typeof value === 'string'
        ? value.trim().length > 0
        : value && typeof value === 'object'
          ? Object.values(value).some(
              (item) => typeof item === 'string' && item.trim().length > 0,
            )
          : false;

    const isFlagged = flaggedQuestions.has(q.id);
    const isCurrent = q.id === currentQuestionId;

    return { isAnswered, isFlagged, isCurrent };
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {questions.map((q, index) => {
        const { isAnswered, isFlagged, isCurrent } = getQuestionState(q);
        const displayNumber = q.order_index ?? index + 1;

        return (
          <Tooltip key={q.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onQuestionClick(q.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onToggleFlag(q.id);
                }}
                className={cn(
                  'relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  'border-2 hover:scale-110',
                  isCurrent && 'ring-2 ring-primary ring-offset-2',
                  isAnswered && !isFlagged && 'bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white',
                  isFlagged && 'bg-destructive border-destructive text-white',
                  !isAnswered && !isFlagged && 'bg-background border-muted-foreground/30 text-foreground'
                )}
              >
                {isFlagged ? (
                  <Flag className="h-4 w-4" />
                ) : isAnswered ? (
                  <Check className="h-4 w-4" />
                ) : (
                  displayNumber
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>Câu {displayNumber}</p>
              <p className="text-muted-foreground">
                {isFlagged ? 'Đã đánh dấu' : isAnswered ? 'Đã trả lời' : 'Chưa trả lời'}
              </p>
              <p className="text-muted-foreground mt-1">Right-click để đánh dấu</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
