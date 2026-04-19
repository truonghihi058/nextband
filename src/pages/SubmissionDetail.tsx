import { useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { submissionsApi } from "@/lib/api";
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
  Eye,
  EyeOff,
} from "lucide-react";
import { AnswerResultCard } from "@/components/submission/AnswerResultCard";
import { RichContent } from "@/components/exam/RichContent";
import { getFillBlankBlankCount } from "@/lib/fillBlank";
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

const sectionHasQuestions = (section: any) =>
  (section?.questionGroups || []).some(
    (group: any) => Array.isArray(group?.questions) && group.questions.length > 0,
  );

const getQuestionText = (question: any) =>
  question?.questionText || question?.question_text || "";

const getQuestionType = (question: any) =>
  question?.questionType || question?.question_type || "";

const getCorrectAnswer = (question: any) =>
  question?.correctAnswer || question?.correct_answer || null;

const getQuestionOptions = (question: any) =>
  Array.isArray(question?.options) ? question.options : [];

const getQuestionAssessmentWeight = (question: any) => {
  if (getQuestionType(question) === "fill_blank") {
    const blankCount = getFillBlankBlankCount(getCorrectAnswer(question));
    if (blankCount > 0) return blankCount;
  }
  return Math.max(1, Number(question?.points || 1));
};

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isTeacher } = useAuth();
  const submissionId = id || searchParams.get("submissionId") || undefined;
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const { data: submission, isLoading } = useQuery({
    queryKey: ["student-submission", submissionId],
    queryFn: () => submissionsApi.getById(submissionId!),
    enabled: !!submissionId && isAuthenticated,
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
        .sort(compareByDisplayOrder)
        .flatMap((g: any) =>
          (g.questions || []).sort(compareByDisplayOrder),
        ),
    );
  }, [sections]);

  const totalQuestionsCount = allQuestions.reduce(
    (sum: number, q: any) => sum + getQuestionAssessmentWeight(q),
    0,
  );
  const totalPoints = totalQuestionsCount;
  const isGraded = submission?.status === "graded";
  const answeredCount = useMemo(() => {
    return allQuestions.reduce((sum: number, q: any) => {
      const answer = answerMap[q.id];
      if (!answer) return sum;

      if (getQuestionType(q) === "fill_blank") {
        try {
          const parsed = JSON.parse(answer.answerText || "{}");
          if (parsed && typeof parsed === "object") {
            const filledCount = Object.values(parsed).filter(
              (value) => String(value ?? "").trim() !== "",
            ).length;
            return sum + filledCount;
          }
        } catch {
          // Fallback to treating any non-empty text as answered
        }
      }

      const hasAnswer =
        (typeof answer.answerText === "string" &&
          answer.answerText.trim() !== "") ||
        !!answer.audioUrl;
      return sum + (hasAnswer ? 1 : 0);
    }, 0);
  }, [allQuestions, answerMap]);

  const completionRate = useMemo(() => {
    if (totalQuestionsCount === 0) return 0;
    return Math.round((answeredCount / totalQuestionsCount) * 100);
  }, [answeredCount, totalQuestionsCount]);

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

      const questionWeight = getQuestionAssessmentWeight(question);
      gradableCount += questionWeight;
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
            let correctBlanks = 0;
            for (const key of Object.keys(parsedCorrect)) {
              const correctVal = String(parsedCorrect[key] || "").trim();
              const studentVal = String(parsedStudent[key] || "").trim();
              const alternatives = correctVal.split("|").map((a: string) => a.trim().toLowerCase());
              if (!alternatives.includes(studentVal.toLowerCase())) {
                continue;
              }
              correctBlanks++;
            }
            correctCount += correctBlanks;
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
          correctCount += questionWeight;
        }
      } else {
        const normalizedAlternatives = alternatives.map((a) => a.toLowerCase());
        if (normalizedAlternatives.includes(studentText.trim().toLowerCase())) {
          correctCount += questionWeight;
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
              <p className="text-lg font-semibold">{totalQuestionsCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Đã trả lời</p>
              <p className="text-lg font-semibold">
                {answeredCount}/{totalQuestionsCount} ({completionRate}%)
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

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Đáp án đúng
              </p>
              <p className="text-xs text-muted-foreground">
                Bật để hiện toàn bộ đáp án đúng, kể cả các câu học sinh chưa chọn.
              </p>
            </div>
            <Button
              type="button"
              variant={showCorrectAnswers ? "default" : "outline"}
              onClick={() => setShowCorrectAnswers((current) => !current)}
              className="gap-2 self-start sm:self-auto"
            >
              {showCorrectAnswers ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Ẩn đáp án đúng
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Hiện đáp án đúng
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {sections
        ?.filter(sectionHasQuestions)
        .sort(compareByDisplayOrder)
        .map((section: any) => {
        const sectionGroups = (section.questionGroups || []).sort(
          compareByDisplayOrder,
        );

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

            {section.instructions && (
              <Card className="border border-muted/60 bg-muted/20">
                <CardContent className="prose prose-sm max-w-none dark:prose-invert text-foreground">
                  <RichContent html={section.instructions} />
                </CardContent>
              </Card>
            )}

            {section.sectionType === "listening" &&
              (isAdmin || isTeacher) &&
              section.audioScript &&
              submission?.status !== "in_progress" && (
                <Card className="bg-muted/30 border-muted/50">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-semibold">
                      Transcript sau khi nộp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none text-foreground">
                    <RichContent html={section.audioScript} />
                  </CardContent>
                </Card>
              )}

            {sectionGroups.map((group: any, groupIndex: number) => (
              <div key={group.id || groupIndex} className="space-y-3">
                {(group.title || group.instructions) && (
                  <div className="pl-1 space-y-1">
                    {group.title && (
                      <h3 className="font-semibold text-sm">{group.title}</h3>
                    )}
                    {group.instructions && (
                      <div className="text-xs text-muted-foreground prose prose-sm max-w-none">
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

                    return (
                      <AnswerResultCard
                        key={question.id}
                        questionIndex={questionCounter}
                        questionText={getQuestionText(question)}
                        questionType={getQuestionType(question)}
                        correctAnswer={getCorrectAnswer(question)}
                        points={getQuestionAssessmentWeight(question)}
                        options={getQuestionOptions(question)}
                        showCorrectAnswers={showCorrectAnswers}
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
            ))}
          </div>
        );
        })}
    </div>
  );
}
