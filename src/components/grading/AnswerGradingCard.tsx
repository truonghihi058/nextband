import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Minus } from 'lucide-react';

interface AnswerGradingCardProps {
  questionIndex: number;
  questionText: string;
  questionType: string;
  correctAnswer: string | null;
  points: number;
  answerText: string | null;
  audioUrl: string | null;
  currentScore: number | null;
  currentFeedback: string | null;
  onScoreChange: (score: number | null) => void;
  onFeedbackChange: (feedback: string) => void;
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

export function AnswerGradingCard({
  questionIndex,
  questionText,
  questionType,
  correctAnswer,
  points,
  answerText,
  audioUrl,
  currentScore,
  currentFeedback,
  onScoreChange,
  onFeedbackChange,
}: AnswerGradingCardProps) {
  const [score, setScore] = useState<string>(currentScore != null ? String(currentScore) : '');
  const [feedback, setFeedback] = useState(currentFeedback || '');

  useEffect(() => {
    setScore(currentScore != null ? String(currentScore) : '');
    setFeedback(currentFeedback || '');
  }, [currentScore, currentFeedback]);

  const handleScoreChange = (value: string) => {
    setScore(value);
    const num = parseFloat(value);
    onScoreChange(isNaN(num) ? null : num);
  };

  const isAutoGradable = ['multiple_choice', 'true_false_not_given', 'yes_no_not_given'].includes(questionType);
  const isCorrect = isAutoGradable && correctAnswer != null && answerText?.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

  const getStatusIcon = () => {
    if (currentScore == null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (currentScore >= points) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (currentScore === 0) return <XCircle className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-yellow-600" />;
  };

  return (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="pt-4 space-y-3">
        {/* Question header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-semibold text-sm">Câu {questionIndex}</span>
              <Badge variant="outline" className="text-xs">
                {questionTypeLabels[questionType] || questionType}
              </Badge>
              <span className="text-xs text-muted-foreground">({points} điểm)</span>
            </div>
            <p className="text-sm whitespace-pre-wrap pl-6">{questionText}</p>
          </div>
        </div>

        {/* Student answer */}
        <div className="pl-6 space-y-2">
          <div className="rounded-md border bg-muted/40 p-3">
            <Label className="text-xs text-muted-foreground mb-1 block">Câu trả lời của học viên</Label>
            {answerText ? (
              <p className="text-sm whitespace-pre-wrap">{answerText}</p>
            ) : audioUrl ? (
              <audio controls className="w-full mt-1" src={audioUrl} />
            ) : (
              <p className="text-sm text-muted-foreground italic">Chưa trả lời</p>
            )}
          </div>

          {/* Correct answer (if available) */}
          {correctAnswer && (
            <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-3">
              <Label className="text-xs text-green-700 dark:text-green-400 mb-1 block">Đáp án đúng</Label>
              <p className="text-sm whitespace-pre-wrap">{correctAnswer}</p>
            </div>
          )}

          {/* Score & Feedback */}
          <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 pt-1">
            <div>
              <Label className="text-xs">Điểm (/{points})</Label>
              <Input
                type="number"
                min={0}
                max={points}
                step={0.5}
                value={score}
                onChange={(e) => handleScoreChange(e.target.value)}
                placeholder="—"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Nhận xét</Label>
              <Textarea
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  onFeedbackChange(e.target.value);
                }}
                placeholder="Nhập nhận xét cho câu trả lời..."
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
