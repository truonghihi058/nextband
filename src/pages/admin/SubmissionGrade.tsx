import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save, CheckCheck, Loader2 } from "lucide-react";
import { SubmissionHeader } from "@/components/grading/SubmissionHeader";
import { AnswerGradingCard } from "@/components/grading/AnswerGradingCard";
import { useAuth } from "@/hooks/useAuth";

interface GradeUpdate {
  answerId: string;
  score: number | null;
  feedback: string;
}

export default function SubmissionGrade() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [grades, setGrades] = useState<Record<string, GradeUpdate>>({});

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

  // All questions flat list for counting
  const allQuestions = useMemo(() => {
    if (!sections) return [];
    return sections.flatMap((sec: any) =>
      (sec.questionGroups || [])
        .sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))
        .flatMap((g: any) =>
          (g.questions || []).sort(
            (a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0),
          ),
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

  // Save grades mutation
  const saveMutation = useMutation({
    mutationFn: async ({ finalize }: { finalize: boolean }) => {
      const updates = Object.values(grades).filter((g) => g.answerId);

      // Calculate total score
      const currentTotalValue = allQuestions.reduce((sum, q: any) => {
        const grade = grades[q.id];
        const answer = answerMap[q.id];
        const score = grade?.score ?? answer?.score ?? 0;
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

  const totalPoints = allQuestions.reduce(
    (sum, q: any) => sum + (q.points || 1),
    0,
  );

  const currentTotal = useMemo(() => {
    const total = allQuestions.reduce((sum, q: any) => {
      const grade = grades[q.id];
      const answer = answerMap[q.id];
      const score = grade?.score ?? answer?.score ?? 0;
      return sum + Number(score);
    }, 0);
    return total;
  }, [allQuestions, grades, answerMap]);

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
        ?.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))
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

            {(section.questionGroups || [])
              .sort(
                (a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0),
              )
              .map((group: any) => (
                <div key={group.id} className="space-y-3">
                  {group.title && (
                    <div className="pl-1">
                      <h3 className="font-medium text-sm">{group.title}</h3>
                      {group.instructions && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {group.instructions}
                        </p>
                      )}
                    </div>
                  )}

                  {(group.questions || [])
                    .sort(
                      (a: any, b: any) =>
                        (a.orderIndex || 0) - (b.orderIndex || 0),
                    )
                    .map((question: any) => {
                      questionCounter++;
                      const answer = answerMap[question.id];
                      const grade = grades[question.id];

                      return (
                        <AnswerGradingCard
                          key={question.id}
                          questionIndex={questionCounter}
                          questionText={question.questionText}
                          questionType={question.questionType}
                          correctAnswer={question.correctAnswer}
                          points={question.points || 1}
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
                          readOnly={!canGrade}
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
