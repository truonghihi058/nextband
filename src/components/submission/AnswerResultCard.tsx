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
  isSubmitted?: boolean;
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
  isSubmitted = false,
  sectionType,
}: AnswerResultCardProps) {
  const isManualGradeOnly = ["speaking", "writing"].includes(sectionType || "");
  const isAutoGradable = ["listening", "reading", "general"].includes(sectionType || "");
  const isFillBlankWithPlaceholders =
    questionType === "fill_blank" && hasFillBlankPlaceholders(questionText);

  // For auto-gradable sections that have been submitted, always show results
  const shouldShowAutoResult = isAutoGradable && (isSubmitted || isGraded);

  // Frontend-side auto-comparison for auto-gradable sections when score is null
  const computedScore = (() => {
    // If backend already provided a score, use it
    if (score != null) return score;
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
          const keys = Object.keys(parsedCorrect);
          const blankCount = keys.length;
          if (blankCount === 0) return 0;

          let correctBlanks = 0;
          for (const key of keys) {
            const correctVal = String(parsedCorrect[key] || "").trim();
            const studentVal = String(parsedStudent[key] || "").trim();
            const alternatives = correctVal.split("|").map((a: string) => a.trim().toLowerCase());
            if (alternatives.includes(studentVal.toLowerCase())) correctBlanks++;
          }
          return (correctBlanks / blankCount) * points;
        }
      } catch {
        // Not JSON, fall through to string comparison
      }
    }

    // Handle matching with JSON answers
    if (questionType === "matching") {
      try {
        const parsedStudent = JSON.parse(answerText);
        const parsedCorrect = JSON.parse(correctAnswer);
        if (
          typeof parsedStudent === "object" && typeof parsedCorrect === "object" &&
          parsedStudent !== null && parsedCorrect !== null && parsedCorrect.pairs
        ) {
          const keys = Object.keys(parsedCorrect.pairs);
          const pairsCount = keys.length;
          if (pairsCount === 0) return 0;

          let correctPairs = 0;
          for (const key of keys) {
            const correctVal = String(parsedCorrect.pairs[key] || "").trim();
            const studentVal = String(parsedStudent[key] || "").trim();
            if (correctVal === studentVal) correctPairs++;
          }
          return (correctPairs / pairsCount) * points;
        }
      } catch {
        // Not JSON
      }
    }

    // Simple string comparison with pipe-delimited alternatives
    const alternatives = correctAnswer.trim().split("|").map((a: string) => a.trim().toLowerCase());
    return alternatives.includes(answerText.trim().toLowerCase()) ? points : 0;
  })();

  // Can show result: graded, or auto-gradable section that's been submitted
  const canShowResult = isGraded || shouldShowAutoResult;

  const getStatusIcon = () => {
    if (isManualGradeOnly && (!isGraded || score == null))
      return <Clock className="h-4 w-4 text-amber-500" />;
    if (!canShowResult)
      return <Minus className="h-4 w-4 text-muted-foreground" />;

    const rawScore = score != null ? score : computedScore;
    
    if (rawScore != null) {
      const effectiveScore = Number(rawScore);
      const numPoints = Number(points);
      if (effectiveScore >= numPoints) return <CheckCircle className="h-4 w-4 text-green-600" />;
      if (effectiveScore === 0) return <XCircle className="h-4 w-4 text-destructive" />;
      return <Minus className="h-4 w-4 text-yellow-600" />;
    }

    // No answer provided - show neutral
    if (!answerText) return <XCircle className="h-4 w-4 text-destructive" />;
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
    
    const rawScore = score != null ? score : computedScore;

    if (rawScore != null) {
      const effectiveScore = Number(rawScore);
      const numPoints = Number(points);
      const ratio = numPoints > 0 ? effectiveScore / numPoints : 0;
      const variant =
        ratio >= 1 ? "default" : ratio > 0 ? "secondary" : "destructive";
      return (
        <Badge variant={variant} className="text-xs">
          {Number(effectiveScore.toFixed(2))}/{numPoints}
        </Badge>
      );
    }

    // No answer
    if (!answerText && shouldShowAutoResult) {
      return <Badge variant="destructive" className="text-xs">Chưa trả lời</Badge>;
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
          {/* Student answer - hide for fill_blank with placeholders or matching (has its own renderer) */}
          {!isFillBlankWithPlaceholders && questionType !== "matching" && (
            <div className="rounded-md border bg-muted/40 p-3">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Câu trả lời của bạn
              </Label>
              {(() => {
                let trimmedAnswer = (answerText || "").trim();
                // Remove JSON quotes if present
                if (trimmedAnswer.startsWith('"') && trimmedAnswer.endsWith('"')) {
                  trimmedAnswer = trimmedAnswer.slice(1, -1);
                }
                
                const isUrl = trimmedAnswer.startsWith("http") || 
                              trimmedAnswer.startsWith("blob:") || 
                              trimmedAnswer.startsWith("/") ||
                              (trimmedAnswer.includes(".") && !trimmedAnswer.includes(" ") && !trimmedAnswer.includes("<"));
                
                if (isUrl) {
                  return <audio controls className="w-full mt-1" src={trimmedAnswer} />;
                }
                if (trimmedAnswer) {
                  return <p className="text-sm whitespace-pre-wrap">{trimmedAnswer}</p>;
                }
                if (audioUrl) {
                  return <audio controls className="w-full mt-1" src={audioUrl} />;
                }
                return (
                  <p className="text-sm text-muted-foreground italic">
                    Chưa trả lời
                  </p>
                );
              })()}
            </div>
          )}

          {/* Matching result visualizer */}
          {questionType === "matching" && canShowResult && correctAnswer && (() => {
            try {
              const parsedCorrect = JSON.parse(correctAnswer);
              const items = parsedCorrect.items || [];
              const pairs = parsedCorrect.pairs || {};
              const parsedStudent = answerText ? JSON.parse(answerText) : {};
              
              return (
                <div className="space-y-3 mt-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">Chi tiết ghép nối</Label>
                  <div className="rounded-md border bg-card divide-y">
                    {items.map((item: string, idx: number) => {
                      const correctOpt = pairs[String(idx)];
                      const studentOpt = parsedStudent[String(idx)];
                      const isCorrect = correctOpt === studentOpt;
                      
                      return (
                        <div key={idx} className="p-3 flex items-start gap-4">
                          <div className="flex-1 text-sm pt-0.5">
                            <span className="font-bold mr-2 text-primary">{idx + 1}.</span>
                            {item}
                          </div>
                          <div className="flex flex-col gap-1 items-end min-w-[100px]">
                            {studentOpt && !isCorrect && (
                              <div className="flex items-center gap-1.5 text-xs text-destructive line-through opacity-80 decoration-destructive/50">
                                <span>{studentOpt}</span>
                                <XCircle className="w-3 h-3" />
                              </div>
                            )}
                            <div className={isCorrect ? "flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-500" : "flex items-center gap-1.5 text-sm font-medium"}>
                              <span>{correctOpt || "—"}</span>
                              {isCorrect && <CheckCircle className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            } catch (e) {
              return null; // Fallback to normal display if parsing fails
            }
          })()}

          {/* Correct answer - show for auto-gradable or graded */}
          {canShowResult && correctAnswer && !isFillBlankWithPlaceholders && questionType !== "matching" && (
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
