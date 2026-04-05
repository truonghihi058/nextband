import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionsApi, submissionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save, CheckCheck, Loader2 } from "lucide-react";
import { SubmissionHeader } from "@/components/grading/SubmissionHeader";
import { AnswerGradingCard } from "@/components/grading/AnswerGradingCard";
import { useAuth } from "@/hooks/useAuth";
import { RichContent } from "@/components/exam/RichContent";

interface GradeUpdate {
  answerId: string;
  score: number | null;
  feedback: string;
}

const getOrderValue = (item: any) => {
  const order = item?.orderIndex ?? item?.order_index;
  return typeof order === "number" ? order : Number.MAX_SAFE_INTEGER;
};

const getCreatedValue = (item: any) => {
  const raw = item?.createdAt ?? item?.created_at;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
};

const compareByDisplayOrder = (a: any, b: any) => {
  const orderDiff = getOrderValue(a) - getOrderValue(b);
  if (orderDiff !== 0) return orderDiff;
  const createdDiff = getCreatedValue(a) - getCreatedValue(b);
  if (createdDiff !== 0) return createdDiff;
  return String(a?.id || "").localeCompare(String(b?.id || ""));
};

const getQuestionText = (question: any) =>
  question?.questionText || question?.question_text || "";

const getQuestionType = (question: any) =>
  question?.questionType || question?.question_type || "";

const getCorrectAnswer = (question: any) =>
  question?.correctAnswer || question?.correct_answer || null;

export default function SubmissionGrade() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [grades, setGrades] = useState<Record<string, GradeUpdate>>({});
  const [maxScores, setMaxScores] = useState<Record<string, number>>({});

  // Fetch submission with related data
  const { data: submission, isLoading } = useQuery({
    queryKey: ["submission-grade", id],
    queryFn: () => submissionsApi.getById(id!),
    enabled: !!id,
  });

  const sections = submission?.exam?.sections || [];
  const answers = submission?.answers || [];

  // Build answer map for quick lookup
  const answerMap = useMemo(() => {
    const map: Record<string, any> = {};
    answers?.forEach((a: any) => {
      map[a.questionId] = a;
    });
    return map;
  }, [answers]);

  // All questions flat list for counting (with sectionType)
  const allQuestions = useMemo(() => {
    if (!sections) return [];
    return sections.flatMap((sec: any) =>
      (sec.questionGroups || [])
        .sort(compareByDisplayOrder)
        .flatMap((g: any) =>
          (g.questions || [])
            .sort(compareByDisplayOrder)
            .map((q: any) => ({ ...q, _sectionType: sec.sectionType })),
        ),
    );
  }, [sections]);

  const handleScoreChange = useCallback(
    (answerId: string, questionId: string, score: number | null) => {
      setGrades((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          answerId,
          score,
          feedback: prev[questionId]?.feedback || "",
        },
      }));
    },
    [],
  );

  const handleFeedbackChange = useCallback(
    (answerId: string, questionId: string, feedback: string) => {
      setGrades((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          answerId,
          score: prev[questionId]?.score ?? null,
          feedback,
        },
      }));
    },
    [],
  );

  const getEffectiveMaxScore = useCallback(
    (question: any) => {
      return maxScores[question.id] ?? Math.max(1, Number(question.points || 1));
    },
    [maxScores],
  );

  const handleMaxScoreChange = useCallback((questionId: string, maxScore: number) => {
    setMaxScores((prev) => ({
      ...prev,
      [questionId]: Math.max(1, maxScore),
    }));
  }, []);

  // Save grades mutation
  const saveMutation = useMutation({
    mutationFn: async ({ finalize }: { finalize: boolean }) => {
      const updates = Object.values(grades).filter((g) => g.answerId);

      const speakingPointUpdates = allQuestions
        .filter((q: any) => q._sectionType === "speaking")
        .map((q: any) => ({
          questionId: q.id,
          currentPoints: Math.max(1, Number(q.points || 1)),
          nextPoints: getEffectiveMaxScore(q),
        }))
        .filter((entry) => entry.nextPoints !== entry.currentPoints);

      if (speakingPointUpdates.length > 0) {
        await Promise.all(
          speakingPointUpdates.map((entry) =>
            questionsApi.update(entry.questionId, { points: entry.nextPoints }),
          ),
        );
      }

      // Calculate total score (exclude speaking/writing from auto calculation)
      const currentTotalValue = allQuestions.reduce((sum, q: any) => {
        const isManual = ["speaking", "writing"].includes(q._sectionType);
        if (isManual) {
          // Only include manual-grade scores that have been explicitly graded
          const grade = grades[q.id];
          const answer = answerMap[q.id];
          const maxScore = getEffectiveMaxScore(q);
          const rawScore = grade?.score ?? answer?.score ?? 0;
          const score = Math.min(Math.max(Number(rawScore), 0), maxScore);
          return sum + Number(score);
        }
        const grade = grades[q.id];
        const answer = answerMap[q.id];
        const maxScore = getEffectiveMaxScore(q);
        const rawScore = grade?.score ?? answer?.score ?? 0;
        const score = Math.min(Math.max(Number(rawScore), 0), maxScore);
        return sum + Number(score);
      }, 0);

      // Call grade API
      await submissionsApi.grade(
        id!,
        updates.map((u) => ({
          answerId: u.answerId,
          score: u.score || 0,
          feedback: u.feedback || undefined,
        })),
        finalize ? currentTotalValue : 0,
      );

      return finalize;
    },
    onSuccess: (finalize) => {
      queryClient.invalidateQueries({ queryKey: ["submission-grade", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });

      if (finalize) {
        toast.success("Đã chấm xong bài thi!");
        navigate("/admin/check-attempt");
      } else {
        toast.success("Đã lưu điểm!");
      }
    },
    onError: (err: Error) => {
      toast.error("Lỗi khi lưu: " + err.message);
    },
  });

  // Stats
  const gradedCount = allQuestions.filter((q: any) => {
    const grade = grades[q.id];
    const answer = answerMap[q.id];
    return grade?.score != null || answer?.score != null;
  }).length;

  const totalPoints = allQuestions.reduce((sum, q: any) => {
    return sum + getEffectiveMaxScore(q);
  }, 0);

  const currentTotal = useMemo(() => {
    const total = allQuestions.reduce((sum, q: any) => {
      const grade = grades[q.id];
      const answer = answerMap[q.id];
      const maxScore = getEffectiveMaxScore(q);
      const rawScore = grade?.score ?? answer?.score ?? 0;
      const score = Math.min(Math.max(Number(rawScore), 0), maxScore);
      return sum + Number(score);
    }, 0);
    return total;
  }, [allQuestions, grades, answerMap, getEffectiveMaxScore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy bài nộp</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/admin/check-attempt")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  let questionCounter = 0;
  const canGrade = submission.status !== "in_progress";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/check-attempt")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Danh sách bài nộp
      </Button>

      {/* Header */}
      <SubmissionHeader
        student={submission.student}
        exam={submission.exam}
        status={submission.status}
        submittedAt={submission.submittedAt}
      />

      <Separator />

      {/* Score summary bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Đã chấm:</span>{" "}
                <span className="font-semibold">
                  {gradedCount}/{allQuestions.length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Tổng điểm hiện tại:
                </span>{" "}
                <span className="font-semibold">
                  {currentTotal}/{totalPoints}
                </span>
              </div>
              {allQuestions.some((q: any) =>
                ["speaking", "writing"].includes(q._sectionType),
              ) && (
                <div>
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    * Speaking/Writing chấm thủ công
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveMutation.mutate({ finalize: false })}
                disabled={saveMutation.isPending || !canGrade}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Lưu nháp
              </Button>
              <Button
                size="sm"
                onClick={() => saveMutation.mutate({ finalize: true })}
                disabled={saveMutation.isPending || !canGrade}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4 mr-1" />
                )}
                Hoàn tất chấm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions by section */}
      {sections
        ?.sort(compareByDisplayOrder)
        .map((section: any) => (
          <div key={section.id} className="space-y-4">
            <CardHeader className="px-0 pb-2">
              <CardTitle className="text-lg">
                {section.title}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({section.sectionType})
                </span>
              </CardTitle>
            </CardHeader>

            {section.instructions && (
              <Card className="border border-muted/60 bg-muted/20">
                <CardContent className="prose prose-sm max-w-none dark:prose-invert text-foreground">
                  <RichContent html={section.instructions} />
                </CardContent>
              </Card>
            )}

            {(section.questionGroups || [])
              .sort(compareByDisplayOrder)
              .map((group: any, gIndex: number) => (
                <div key={group.id} className="space-y-3">
                  {(group.title || group.instructions) && (
                    <div className="pl-1 space-y-1">
                      {group.title && (
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{group.title}</h3>
                        </div>
                      )}
                      {group.instructions && (
                        <div className="text-xs text-muted-foreground mt-0.5 prose prose-sm max-w-none">
                          <RichContent html={group.instructions} />
                        </div>
                      )}
                    </div>
                  )}

                  {group.passage && (
                    <Card className="border border-muted/60 bg-muted/10">
                      <CardContent className="prose prose-sm max-w-none dark:prose-invert text-foreground">
                        <RichContent html={group.passage} variant="passage" />
                      </CardContent>
                    </Card>
                  )}

                  {(group.questions || [])
                    .sort(compareByDisplayOrder)
                    .map((question: any) => {
                      questionCounter++;
                      const answer = answerMap[question.id];
                      const grade = grades[question.id];

                      return (
                        <AnswerGradingCard
                          key={question.id}
                          questionIndex={questionCounter}
                          questionText={getQuestionText(question)}
                          questionType={getQuestionType(question)}
                          correctAnswer={getCorrectAnswer(question)}
                          points={getEffectiveMaxScore(question)}
                          answerText={answer?.answerText || null}
                          audioUrl={answer?.audioUrl || null}
                          currentScore={grade?.score ?? answer?.score ?? null}
                          currentFeedback={
                            grade?.feedback ?? answer?.feedback ?? null
                          }
                          onScoreChange={(score) =>
                            handleScoreChange(
                              answer?.id || "",
                              question.id,
                              score,
                            )
                          }
                          onFeedbackChange={(fb) =>
                            handleFeedbackChange(
                              answer?.id || "",
                              question.id,
                              fb,
                            )
                          }
                          onMaxScoreChange={(maxScore) =>
                            handleMaxScoreChange(question.id, maxScore)
                          }
                          readOnly={!canGrade}
                          sectionType={section.sectionType}
                        />
                      );
                    })}
                </div>
              ))}
          </div>
        ))}

      {/* Bottom action bar */}
      <div className="sticky bottom-0 bg-background border-t py-3 flex items-center justify-end gap-2 -mx-6 px-6">
        <Button
          variant="outline"
          onClick={() => saveMutation.mutate({ finalize: false })}
          disabled={saveMutation.isPending || !canGrade}
        >
          <Save className="h-4 w-4 mr-1" /> Lưu nháp
        </Button>
        <Button
          onClick={() => saveMutation.mutate({ finalize: true })}
          disabled={saveMutation.isPending || !canGrade}
        >
          <CheckCheck className="h-4 w-4 mr-1" /> Hoàn tất chấm
        </Button>
      </div>
    </div>
  );
}
