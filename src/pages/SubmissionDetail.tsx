import { useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { ReadingSection } from "@/components/exam/ReadingSection";
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
    label: "Chờ chấm",
    variant: "outline",
    icon: AlertCircle,
  },
  graded: { label: "Đã chấm điểm", variant: "default", icon: CheckCircle2 },
};

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

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const submissionId = id || searchParams.get("submissionId") || undefined;

  const { data: submission, isLoading } = useQuery({
    queryKey: ["student-submission", submissionId],
    queryFn: () => submissionsApi.getById(submissionId!),
    enabled: !!submissionId && isAuthenticated,
  });

  const sections = submission?.exam?.sections || [];
  const answers = submission?.answers || [];
  const isReviewMode = true;

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
        .sort(compareByDisplayOrder)
        .flatMap((g: any) =>
          (g.questions || []).sort(compareByDisplayOrder),
        ),
    );
  }, [sections]);

  const totalPoints = allQuestions.reduce(
    (sum: number, q: any) => sum + (q.points || 1),
    0,
  );
  const isGraded = submission?.status === "graded";
  const answeredCount = useMemo(() => {
    return allQuestions.filter((q: any) => {
      const answer = answerMap[q.id];
      if (!answer) return false;
      return (
        (typeof answer.answerText === "string" &&
          answer.answerText.trim() !== "") ||
        !!answer.audioUrl
      );
    }).length;
  }, [allQuestions, answerMap]);

  const completionRate = useMemo(() => {
    if (allQuestions.length === 0) return 0;
    return Math.round((answeredCount / allQuestions.length) * 100);
  }, [answeredCount, allQuestions.length]);

  // Auto-graded results from backend
  const hasAutoGradedResults =
    submission?.correctAnswers != null && submission?.totalQuestions != null;

  // Frontend-side correct count computation for submissions without backend auto-grading
  const frontendComputedResults = useMemo(() => {
    if (hasAutoGradedResults) return null; // Backend already has it
    if (!sections || allQuestions.length === 0) return null;

    const autoGradableTypes = [
      "multiple_choice", "true_false_not_given", "yes_no_not_given",
      "short_answer", "fill_blank", "listening", "matching",
    ];

    let correctCount = 0;
    let gradableCount = 0;

    // Build a section map for question -> sectionType
    const questionSectionMap: Record<string, string> = {};
    sections.forEach((sec: any) => {
      (sec.questionGroups || []).forEach((g: any) => {
        (g.questions || []).forEach((q: any) => {
          questionSectionMap[q.id] = sec.sectionType;
        });
      });
    });

    for (const question of allQuestions) {
      const sectionType = questionSectionMap[question.id];
      const isAutoGradable = ["listening", "reading", "general"].includes(sectionType || "");
      if (!isAutoGradable || !autoGradableTypes.includes(question.questionType)) continue;
      if (!question.correctAnswer) continue;

      gradableCount++;
      const answer = answerMap[question.id];
      if (!answer?.answerText) continue;

      const studentText = answer.answerText;
      const correctText = question.correctAnswer.trim();

      // Handle fill_blank with JSON answers
      if (question.questionType === "fill_blank") {
        try {
          const parsedStudent = JSON.parse(studentText);
          const parsedCorrect = JSON.parse(correctText);
          if (typeof parsedStudent === "object" && typeof parsedCorrect === "object" &&
              parsedStudent !== null && parsedCorrect !== null) {
            let allCorrect = true;
            for (const key of Object.keys(parsedCorrect)) {
              const correctVal = String(parsedCorrect[key] || "").trim();
              const studentVal = String(parsedStudent[key] || "").trim();
              const alternatives = correctVal.split("|").map((a: string) => a.trim().toLowerCase());
              if (!alternatives.includes(studentVal.toLowerCase())) {
                allCorrect = false;
                break;
              }
            }
            if (allCorrect) correctCount++;
            continue;
          }
        } catch {
          // Not JSON, fall through
        }
      }

      const alternatives = correctText
        .split("|")
        .map((a: string) => a.trim())
        .filter(Boolean);

      if (
        (question.questionType === "multiple_choice" ||
          question.questionType === "listening") &&
        alternatives.length > 1
      ) {
        let studentSelections: string[] = [];
        try {
          const parsed = JSON.parse(studentText);
          if (Array.isArray(parsed)) {
            studentSelections = parsed.map((v) => String(v).trim());
          }
        } catch {
          studentSelections = studentText
            .split("|")
            .flatMap((part: string) => part.split(","))
            .map((v: string) => v.trim())
            .filter(Boolean);
        }

        const normalizedStudent = Array.from(
          new Set(studentSelections.map((v) => v.toLowerCase())),
        ).sort();
        const normalizedCorrect = Array.from(
          new Set(alternatives.map((v) => v.toLowerCase())),
        ).sort();
        if (
          normalizedStudent.length === normalizedCorrect.length &&
          normalizedStudent.every((value, idx) => value === normalizedCorrect[idx])
        ) {
          correctCount++;
        }
      } else {
        const normalizedAlternatives = alternatives.map((a) => a.toLowerCase());
        if (normalizedAlternatives.includes(studentText.trim().toLowerCase())) {
          correctCount++;
        }
      }
    }

    if (gradableCount === 0) return null;
    return { correctAnswers: correctCount, totalQuestions: gradableCount };
  }, [hasAutoGradedResults, sections, allQuestions, answerMap]);

  // Unified correct count: prefer backend, fallback to frontend-computed
  const displayCorrectAnswers = submission?.correctAnswers ?? frontendComputedResults?.correctAnswers ?? null;
  const displayTotalQuestions = submission?.totalQuestions ?? frontendComputedResults?.totalQuestions ?? null;
  const hasCorrectResults = displayCorrectAnswers != null && displayTotalQuestions != null;

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
                {answeredCount}/{allQuestions.length} ({completionRate}%)
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

          {/* Auto-graded result - shown for submitted AND graded */}
          {hasCorrectResults && (
            <>
              <Separator />
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="text-3xl font-bold text-green-600 tabular-nums">
                    {displayCorrectAnswers}/{displayTotalQuestions}
                  </span>
                </div>
                <Progress
                  value={
                    displayTotalQuestions! > 0
                      ? (displayCorrectAnswers! / displayTotalQuestions!) * 100
                      : 0
                  }
                  className="w-full max-w-xs h-2"
                />
                <p className="text-sm text-muted-foreground">
                  Đạt{" "}
                  {displayTotalQuestions! > 0
                    ? Math.round(
                        (displayCorrectAnswers! / displayTotalQuestions!) *
                          100,
                      )
                    : 0}
                  % (tự chấm)
                </p>
              </div>
            </>
          )}

          {/* Score display - only for teacher-graded */}
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

      {/* Sections */}
      {sections?.sort(compareByDisplayOrder).map((section: any) => {
        const sectionQuestions =
          (section.questionGroups || [])
            .sort(compareByDisplayOrder)
            .flatMap((g: any) =>
              (g.questions || []).sort(compareByDisplayOrder),
            ) || [];

        // Reuse ReadingSection for review to keep layout/highlight identical
        if (section.sectionType === "reading") {
          return (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {section.title}
                  <span className="text-sm font-normal text-muted-foreground">
                    (Reading)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-4">
                <ReadingSection
                  section={section}
                  answers={{}}
                  onAnswerChange={() => {}}
                  questionRefs={undefined}
                  currentQuestionId={undefined}
                  onQuestionFocus={() => {}}
                />
              </CardContent>
            </Card>
          );
        }

        return (
          <div key={section.id} className="space-y-4">
            <CardHeader className="px-0 pb-2">
              <CardTitle className="text-lg">
                {section.title}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({section.sectionType})
                </span>
              </CardTitle>
            </CardHeader>

            {section.sectionType === "listening" &&
              section.audioScript &&
              submission?.status !== "in_progress" && (
                <Card className="bg-muted/30 border-muted/50">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-semibold">
                      Transcript sau khi nộp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none text-foreground">
                    <div
                      dangerouslySetInnerHTML={{ __html: section.audioScript }}
                    />
                  </CardContent>
                </Card>
              )}

            {sectionQuestions.map((question: any) => {
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
                  isSubmitted={
                    submission?.status === "submitted" ||
                    submission?.status === "graded"
                  }
                  sectionType={section.sectionType}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
