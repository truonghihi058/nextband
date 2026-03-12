import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Minus,
  MessageSquare,
  Clock,
} from "lucide-react";
import { FillBlankResultRenderer } from "@/components/exam/FillBlankResultRenderer";
import { hasFillBlankPlaceholders } from "@/components/exam/FillBlankHtmlRenderer";

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
  sectionType?: string;
}

const questionTypeLabels: Record<string, string> = {
  multiple_choice: "Trắc nghiệm",
  fill_blank: "Điền đáp án",
  matching: "Nối",
  essay: "Tự luận",
  speaking: "Nói",
  short_answer: "Trả lời ngắn",
  true_false_not_given: "True/False/Not Given",
  yes_no_not_given: "Yes/No/Not Given",
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
  sectionType,
}: AnswerResultCardProps) {
  const isManualGradeOnly = ["speaking", "writing"].includes(sectionType || "");
  const isAutoGradable = ["listening", "reading", "general"].includes(sectionType || "");
  const isFillBlankWithPlaceholders =
    questionType === "fill_blank" && hasFillBlankPlaceholders(questionText);

  // Frontend-side auto-comparison for auto-gradable sections when score is null
  const computedCorrect = (() => {
    // If backend already provided a score, use it
    if (score != null) return score > 0;
    // If not auto-gradable or no correct answer, we can't determine
    if (!isAutoGradable || !correctAnswer || !answerText) return null;

    const autoGradableTypes = [
      "multiple_choice", "true_false_not_given", "yes_no_not_given",
      "short_answer", "fill_blank", "listening",
    ];
    if (!autoGradableTypes.includes(questionType)) return null;

    // Handle fill_blank with JSON answers
    if (questionType === "fill_blank") {
      try {
        const parsedStudent = JSON.parse(answerText);
        const parsedCorrect = JSON.parse(correctAnswer);
        if (
          typeof parsedStudent === "object" && typeof parsedCorrect === "object" &&
          parsedStudent !== null && parsedCorrect !== null
        ) {
          for (const key of Object.keys(parsedCorrect)) {
            const correctVal = String(parsedCorrect[key] || "").trim();
            const studentVal = String(parsedStudent[key] || "").trim();
            const alternatives = correctVal.split("|").map((a: string) => a.trim().toLowerCase());
            if (!alternatives.includes(studentVal.toLowerCase())) return false;
          }
          return true;
        }
      } catch {
        // Not JSON, fall through to string comparison
      }
    }

    // Simple string comparison with pipe-delimited alternatives
    const alternatives = correctAnswer.trim().split("|").map((a: string) => a.trim().toLowerCase());
    return alternatives.includes(answerText.trim().toLowerCase());
  })();

  const canShowResult = isGraded || (isAutoGradable && (score != null || computedCorrect != null));

  const getStatusIcon = () => {
    if (isManualGradeOnly && (!isGraded || score == null))
      return <Clock className="h-4 w-4 text-amber-500" />;
    if (!canShowResult)
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    // Use score if available, otherwise use computedCorrect
    if (score != null) {
      if (score >= points) return <CheckCircle className="h-4 w-4 text-green-600" />;
      if (score === 0) return <XCircle className="h-4 w-4 text-destructive" />;
      return <Minus className="h-4 w-4 text-yellow-600" />;
    }
    if (computedCorrect === true) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (computedCorrect === false) return <XCircle className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getScoreBadge = () => {
    if (isManualGradeOnly && (!isGraded || score == null)) {
      return (
        <Badge
          variant="secondary"
          className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          Chờ giáo viên chấm
        </Badge>
      );
    }
    if (!canShowResult) return null;
    // If backend score is available, use it
    if (score != null) {
      const ratio = score / points;
      const variant =
        ratio >= 1 ? "default" : ratio > 0 ? "secondary" : "destructive";
      return (
        <Badge variant={variant} className="text-xs">
          {score}/{points}
        </Badge>
      );
    }
    // Use frontend-computed result
    if (computedCorrect === true) {
      return <Badge variant="default" className="text-xs">Đúng</Badge>;
    }
    if (computedCorrect === false) {
      return <Badge variant="destructive" className="text-xs">Sai</Badge>;
    }
    return null;
  };

  const parseJsonAnswer = (text: string | null) => {
    if (!text) return {};
    try {
      const parsed = JSON.parse(text);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
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

            {isFillBlankWithPlaceholders ? (
              <div className="pl-6 pt-1">
                <FillBlankResultRenderer
                  html={questionText}
                  studentAnswers={parseJsonAnswer(answerText)}
                  correctAnswersValue={correctAnswer}
                />
              </div>
            ) : (
              <div
                className="text-sm pl-6 prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: questionText }}
              />
            )}
          </div>
        </div>

        <div className="pl-6 space-y-2">
          {/* Student answer - hide for fill_blank with placeholders as it's already rendered */}
          {!isFillBlankWithPlaceholders && (
            <div className="rounded-md border bg-muted/40 p-3">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Câu trả lời của bạn
              </Label>
              {answerText ? (
                <p className="text-sm whitespace-pre-wrap">{answerText}</p>
              ) : audioUrl ? (
                <audio controls className="w-full mt-1" src={audioUrl} />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Chưa trả lời
                </p>
              )}
            </div>
          )}

          {/* Correct answer - show for auto-gradable or graded */}
          {canShowResult && correctAnswer && !isFillBlankWithPlaceholders && (
            <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-3">
              <Label className="text-xs text-green-700 dark:text-green-400 mb-1 block">
                Đáp án đúng
              </Label>
              <p className="text-sm whitespace-pre-wrap">{correctAnswer}</p>
            </div>
          )}

          {/* Feedback */}
          {isGraded && feedback && (
            <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <Label className="text-xs text-blue-700 dark:text-blue-400">
                  Nhận xét từ giáo viên
                </Label>
              </div>
              <p className="text-sm whitespace-pre-wrap">{feedback}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
