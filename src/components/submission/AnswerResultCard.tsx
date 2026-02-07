import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Minus, MessageSquare } from 'lucide-react';

interface AnswerResultCardProps {
  questionIndex: number;
  questionText: string;
  questionType: string;
  correctAnswer: string | null;
  points: number;
  answerText: string | null;
  audioUrl: string | null;
  score: number | null;
  feedback: string | null;
  isGraded: boolean;
}

const questionTypeLabels: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  fill_blank: 'Điền đáp án',
  matching: 'Nối',
  essay: 'Tự luận',
  speaking: 'Nói',
  short_answer: 'Trả lời ngắn',
  true_false_not_given: 'True/False/Not Given',
  yes_no_not_given: 'Yes/No/Not Given',
};

export function AnswerResultCard({
  questionIndex,
  questionText,
  questionType,
  correctAnswer,
  points,
  answerText,
  audioUrl,
  score,
  feedback,
  isGraded,
}: AnswerResultCardProps) {
  const getStatusIcon = () => {
    if (!isGraded || score == null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (score >= points) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score === 0) return <XCircle className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-yellow-600" />;
  };

  const getScoreBadge = () => {
    if (!isGraded || score == null) return null;
    const ratio = score / points;
    const variant = ratio >= 1 ? 'default' : ratio > 0 ? 'secondary' : 'destructive';
    return (
      <Badge variant={variant} className="text-xs">
        {score}/{points}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {/* Question header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusIcon()}
              <span className="font-semibold text-sm">Câu {questionIndex}</span>
              <Badge variant="outline" className="text-xs">
                {questionTypeLabels[questionType] || questionType}
              </Badge>
              {getScoreBadge()}
            </div>
            <p className="text-sm whitespace-pre-wrap pl-6">{questionText}</p>
          </div>
        </div>

        <div className="pl-6 space-y-2">
          {/* Student answer */}
          <div className="rounded-md border bg-muted/40 p-3">
            <Label className="text-xs text-muted-foreground mb-1 block">Câu trả lời của bạn</Label>
            {answerText ? (
              <p className="text-sm whitespace-pre-wrap">{answerText}</p>
            ) : audioUrl ? (
              <audio controls className="w-full mt-1" src={audioUrl} />
            ) : (
              <p className="text-sm text-muted-foreground italic">Chưa trả lời</p>
            )}
          </div>

          {/* Correct answer - only show when graded */}
          {isGraded && correctAnswer && (
            <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-3">
              <Label className="text-xs text-green-700 dark:text-green-400 mb-1 block">Đáp án đúng</Label>
              <p className="text-sm whitespace-pre-wrap">{correctAnswer}</p>
            </div>
          )}

          {/* Feedback */}
          {isGraded && feedback && (
            <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <Label className="text-xs text-blue-700 dark:text-blue-400">Nhận xét từ giáo viên</Label>
              </div>
              <p className="text-sm whitespace-pre-wrap">{feedback}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
