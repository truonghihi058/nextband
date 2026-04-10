import { cn } from '@/lib/utils';
import { Flag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Question {
  id: string;
  order_index?: number;
  isSubQuestion?: boolean;
  subIndex?: string;
  displayNumber?: number;
  focusId?: string;
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
    let isAnswered = false;

    if (q.isSubQuestion && q.subIndex !== undefined) {
      if (value && typeof value === 'object') {
        const subVal = value[q.subIndex];
        isAnswered = typeof subVal === 'string' && subVal.trim().length > 0;
      } else if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          const subVal = parsed[q.subIndex];
          isAnswered = typeof subVal === 'string' && subVal.trim().length > 0;
        } catch {
          // fallback
        }
      }
    } else {
      isAnswered =
        typeof value === 'string'
          ? value.trim().length > 0
          : value && typeof value === 'object'
            ? Object.values(value).some(
                (item) => typeof item === 'string' && item.trim().length > 0,
              )
            : false;
    }

    const isFlagged = flaggedQuestions.has(q.focusId || q.id);
    const isCurrent = (q.focusId || q.id) === currentQuestionId;

    return { isAnswered, isFlagged, isCurrent };
  };

  const formatQuestionLabel = (q: Question, index: number) => {
    const baseNumber = q.displayNumber ?? q.order_index ?? index + 1;
    return String(baseNumber);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {questions.map((q, index) => {
        const { isAnswered, isFlagged, isCurrent } = getQuestionState(q);
        const displayNumber = formatQuestionLabel(q, index);
        const targetId = q.focusId || q.id;
        const uniqueKey = q.isSubQuestion ? `${targetId}` : q.id;

        return (
          <Tooltip key={uniqueKey}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onQuestionClick(targetId)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onToggleFlag(targetId);
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
