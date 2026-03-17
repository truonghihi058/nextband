import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  readOnly?: boolean;
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
  readOnly = false,
  sectionType,
}: AnswerGradingCardProps) {
  const isManualGradeOnly = ["speaking", "writing"].includes(sectionType || "");
  const [score, setScore] = useState<string>(
    currentScore != null ? String(currentScore) : "",
  );
  const [feedback, setFeedback] = useState(currentFeedback || "");

  useEffect(() => {
    setScore(currentScore != null ? String(currentScore) : "");
    setFeedback(currentFeedback || "");
  }, [currentScore, currentFeedback]);

  const handleScoreChange = (value: string) => {
    let sanitizedValue = value;
    if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
      sanitizedValue = value.replace(/^0+/, "");
      if (sanitizedValue === "") sanitizedValue = "0";
    }

    setScore(sanitizedValue);
    const num = parseFloat(sanitizedValue);
    onScoreChange(isNaN(num) ? null : num);
  };

  const isAutoGradable =
    !isManualGradeOnly &&
    ["multiple_choice", "true_false_not_given", "yes_no_not_given"].includes(
      questionType,
    );
  const isCorrect =
    isAutoGradable &&
    correctAnswer != null &&
    answerText?.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

  const getStatusIcon = () => {
    if (currentScore == null)
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (currentScore >= points)
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (currentScore === 0)
      return <XCircle className="h-4 w-4 text-destructive" />;
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
              {isManualGradeOnly && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  Chấm thủ công
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                ({points} điểm)
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap pl-6">{questionText}</p>
          </div>
        </div>

        {/* Student answer */}
        <div className="pl-6 space-y-2">
          <div className="rounded-md border bg-muted/40 p-3">
            <Label className="text-xs text-muted-foreground mb-1 block">
              Câu trả lời của học viên
            </Label>
            {answerText ? (
              questionType === "matching" ? (
                (() => {
                  try {
                    const parsedStudent = JSON.parse(answerText);
                    const parsedCorrect = JSON.parse(correctAnswer || "{}");
                    const items = parsedCorrect.items || [];
                    const pairs = parsedCorrect.pairs || {};
                    return (
                      <div className="space-y-2 mt-2">
                        <div className="rounded-md border bg-card divide-y overflow-hidden">
                          {items.map((item: string, idx: number) => {
                            const studentOpt = parsedStudent[String(idx)];
                            const correctOpt = pairs[String(idx)];
                            return (
                              <div key={idx} className="p-2 flex items-start gap-3 bg-background">
                                <div className="flex-1 text-xs">
                                  <span className="font-bold mr-1 text-primary">{idx + 1}.</span>
                                  {item}
                                </div>
                                <div className="text-xs font-semibold">
                                  {studentOpt ? (
                                    <span className={studentOpt === correctOpt ? "text-green-600" : "text-destructive"}>
                                      {studentOpt}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">Trống</span>
                                  )}
                                  {studentOpt !== correctOpt && correctOpt && (
                                    <span className="text-[10px] text-green-600 ml-2">(Đúng: {correctOpt})</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  } catch (e) {
                    return <p className="text-sm whitespace-pre-wrap">{answerText}</p>;
                  }
                })()
              ) : questionType === "fill_blank" && (answerText.startsWith("{") || answerText.startsWith("[")) ? (
                (() => {
                  try {
                    const parsedStudent = JSON.parse(answerText);
                    const parsedCorrect = JSON.parse(correctAnswer || "{}");
                    return (
                      <div className="space-y-1 mt-2">
                        {Object.keys(parsedCorrect).map((key, idx) => {
                          const studentVal = String(parsedStudent[key] || "").trim();
                          const correctVal = String(parsedCorrect[key] || "").trim();
                          const isCorrect = correctVal.split("|").map(v => v.trim().toLowerCase()).includes(studentVal.toLowerCase());
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs p-1.5 rounded border bg-background">
                              <span className="font-bold text-muted-foreground min-w-[50px]">Ô {Number(key) + 1}:</span>
                              <span className={cn("font-medium", isCorrect ? "text-green-600" : "text-destructive")}>
                                {studentVal || "(Trống)"}
                              </span>
                              {!isCorrect && (
                                <span className="text-green-600 opacity-80">(Đúng: {correctVal})</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  } catch {
                    return <p className="text-sm whitespace-pre-wrap">{answerText}</p>;
                  }
                })()
              ) : (
                <p className="text-sm whitespace-pre-wrap">{answerText}</p>
              )
            ) : audioUrl ? (
              <audio controls className="w-full mt-1" src={audioUrl} />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Chưa trả lời
              </p>
            )}
          </div>

          {/* Correct answer (if available) */}
          {correctAnswer && (
            <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-3">
              <Label className="text-xs text-green-700 dark:text-green-400 mb-1 block">
                Đáp án đúng
              </Label>
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
                disabled={readOnly}
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
                rows={4}
                className="mt-1"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
