import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { submissionsApi, sectionsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
} from "lucide-react";
import { AnswerResultCard } from "@/components/submission/AnswerResultCard";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    icon: React.ElementType;
  }
> = {
  in_progress: { label: "Đang làm", variant: "secondary", icon: Clock },
  submitted: {
    label: "Đã nộp - Chờ chấm",
    variant: "outline",
    icon: AlertCircle,
  },
  graded: { label: "Đã chấm điểm", variant: "default", icon: CheckCircle2 },
};

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: submission, isLoading } = useQuery({
    queryKey: ["student-submission", id],
    queryFn: () => submissionsApi.getById(id!),
    enabled: !!id && isAuthenticated,
  });

  const sections = submission?.exam?.sections || [];
  const answers = submission?.answers || [];

  const answerMap = useMemo(() => {
    const map: Record<string, any> = {};
    answers?.forEach((a: any) => {
      map[a.questionId] = a;
    });
    return map;
  }, [answers]);

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

  const totalPoints = allQuestions.reduce(
    (sum: number, q: any) => sum + (q.points || 1),
    0,
  );
  const isGraded = submission?.status === "graded";
  const answeredCount = allQuestions.filter(
    (q: any) => answerMap[q.id]?.answerText || answerMap[q.id]?.audioUrl,
  ).length;

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
        <p className="text-muted-foreground">Không tìm thấy bài làm này</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/my-submissions")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  const exam = submission.exam;
  const status = statusConfig[submission.status || "in_progress"];
  const StatusIcon = status.icon;

  let questionCounter = 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/my-submissions")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Bài đã làm
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground">
                {exam?.title || "Bài thi"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{exam?.course?.title || "Không rõ khóa học"}</span>
                <Badge variant="secondary">
                  {exam?.examType?.toUpperCase()}
                </Badge>
              </div>
            </div>
            <Badge
              variant={status.variant}
              className="gap-1.5 px-3 py-1.5 text-sm"
            >
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </Badge>
          </div>

          <Separator />

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Câu hỏi</p>
              <p className="text-lg font-semibold">{allQuestions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Đã trả lời</p>
              <p className="text-lg font-semibold">
                {answeredCount}/{allQuestions.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ngày làm</p>
              <p className="text-sm font-medium">
                {submission.startedAt
                  ? format(new Date(submission.startedAt), "dd/MM/yyyy", {
                      locale: vi,
                    })
                  : "—"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ngày nộp</p>
              <p className="text-sm font-medium">
                {submission.submittedAt
                  ? format(
                      new Date(submission.submittedAt),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi },
                    )
                  : "—"}
              </p>
            </div>
          </div>

          {/* Score display - only for graded */}
          {isGraded && submission.totalScore != null && (
            <>
              <Separator />
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  <span className="text-3xl font-bold text-primary">
                    {submission.totalScore}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    / {totalPoints}
                  </span>
                </div>
                <Progress
                  value={
                    totalPoints > 0
                      ? (submission.totalScore / totalPoints) * 100
                      : 0
                  }
                  className="w-full max-w-xs h-2"
                />
                <p className="text-sm text-muted-foreground">
                  Đạt{" "}
                  {totalPoints > 0
                    ? Math.round((submission.totalScore / totalPoints) * 100)
                    : 0}
                  %
                </p>
              </div>
            </>
          )}
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

                      return (
                        <AnswerResultCard
                          key={question.id}
                          questionIndex={questionCounter}
                          questionText={question.questionText}
                          questionType={question.questionType}
                          correctAnswer={question.correctAnswer}
                          points={question.points || 1}
                          answerText={answer?.answerText || null}
                          audioUrl={answer?.audioUrl || null}
                          score={answer?.score ?? null}
                          feedback={answer?.feedback ?? null}
                          isGraded={isGraded}
                        />
                      );
                    })}
                </div>
              ))}
          </div>
        ))}
    </div>
  );
}
