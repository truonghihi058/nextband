import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { examsApi, submissionsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Clock,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  FileText,
  ChevronLeft,
  ChevronRight,
  Send,
  Eye,
  Flag,
  X,
} from "lucide-react";
import { ListeningSection } from "@/components/exam/ListeningSection";
import { ReadingSection } from "@/components/exam/ReadingSection";
import { WritingSection } from "@/components/exam/WritingSection";
import { SpeakingSection } from "@/components/exam/SpeakingSection";
import { GrammarSection } from "@/components/exam/GrammarSection";
import { ExamTimer } from "@/components/exam/ExamTimer";
import { QuestionPagination } from "@/components/exam/QuestionPagination";
import { ExamReviewDialog } from "@/components/exam/ExamReviewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SectionType = "listening" | "reading" | "writing" | "speaking" | "general";

const sectionIcons = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
  general: FileText,
};

const sectionLabels = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
  general: "Grammar",
};

export default function ExamInterface() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<SectionType | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [currentQuestionId, setCurrentQuestionId] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const questionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => examsApi.getById(examId!),
    enabled: !!examId,
  });

  const exam = examData;
  const sections = exam?.sections || [];

  // Create or fetch existing submission
  const { data: submissionData, isLoading: submissionLoading } = useQuery({
    queryKey: ["exam-submission", examId, user?.id],
    queryFn: async () => {
      if (!user || !examId) return null;
      const result = await submissionsApi.start(examId);
      return result;
    },
    enabled: !!examId && !!user && !!exam,
  });

  const submission = submissionData;

  // Load existing answers if resuming
  const { data: savedAnswersData } = useQuery({
    queryKey: ["exam-saved-answers", submission?.id],
    queryFn: async () => {
      if (!submission?.id) return [];
      const result = await submissionsApi.getById(submission.id);
      return result?.answers || [];
    },
    enabled: !!submission?.id,
  });

  // Restore saved answers
  useEffect(() => {
    if (savedAnswersData && savedAnswersData.length > 0) {
      const restored: Record<string, string> = {};
      savedAnswersData.forEach((a: any) => {
        if (a.answerText) restored[a.questionId] = a.answerText;
      });
      setAnswers((prev) => ({ ...restored, ...prev }));
    }
  }, [savedAnswersData]);

  // Set default active section
  useEffect(() => {
    if (sections && sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].sectionType as SectionType);
    }
  }, [sections, activeSection]);

  const availableSections = useMemo(
    () =>
      sections?.filter(
        (s: any) => s.questionGroups && s.questionGroups.length > 0,
      ) || [],
    [sections],
  );

  const currentSectionIndex = availableSections.findIndex(
    (s: any) => s.sectionType === activeSection,
  );

  const currentSection = availableSections[currentSectionIndex];

  // Get all questions for pagination
  const currentSectionQuestions = useMemo(() => {
    if (!currentSection) return [];
    return (
      currentSection.questionGroups?.flatMap((g: any) =>
        (g.questions || []).map((q: any, idx: number) => ({
          ...q,
          groupId: g.id,
        })),
      ) || []
    );
  }, [currentSection]);

  const currentQuestionIndex = useMemo(() => {
    if (!currentQuestionId || currentSectionQuestions.length === 0) return -1;
    return currentSectionQuestions.findIndex((q: any) => q.id === currentQuestionId);
  }, [currentQuestionId, currentSectionQuestions]);

  useEffect(() => {
    if (currentSection && currentSectionQuestions.length > 0 && !currentQuestionId) {
      setCurrentQuestionId(currentSectionQuestions[0].id);
    }
  }, [currentSection, currentSectionQuestions, currentQuestionId]);

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = currentSectionQuestions[currentQuestionIndex - 1];
      handleQuestionClick(prevQuestion.id);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentSectionQuestions.length - 1) {
      const nextQuestion = currentSectionQuestions[currentQuestionIndex + 1];
      handleQuestionClick(nextQuestion.id);
    }
  };

  const handleAnswerChange = useCallback(
    (questionId: string, answer: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    },
    [],
  );

  const handleQuestionClick = useCallback((questionId: string) => {
    setCurrentQuestionId(questionId);
    // Scroll to question
    const element = questionRefs.current.get(questionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleToggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const handleGoToQuestion = useCallback(
    (sectionType: string, questionId: string) => {
      setActiveSection(sectionType as SectionType);
      setCurrentQuestionId(questionId);
      setTimeout(() => {
        const element = questionRefs.current.get(questionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    },
    [],
  );

  const handleSubmit = async () => {
    if (!user || !examId || !submission) return;

    setIsSubmitting(true);
    try {
      // Collect all valid question IDs from loaded sections to filter out invalid keys
      const validQuestionIds = new Set(
        sections?.flatMap(
          (s: any) =>
            s.questionGroups?.flatMap((g: any) =>
              (g.questions || []).map((q: any) => q.id),
            ) || [],
        ) || [],
      );

      // Only submit answers whose keys are valid question IDs
      const answerEntries = Object.entries(answers)
        .filter(([questionId]) => validQuestionIds.has(questionId))
        .map(([questionId, answerText]) => ({
          questionId,
          answerText,
        }));

      await submissionsApi.submit(submission.id, answerEntries);

      toast({
        title: "Nộp bài thành công",
        description: "Bài thi của bạn đã được ghi nhận",
      });

      navigate("/my-submissions");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowReviewDialog(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    toast({
      title: "Hết giờ!",
      description: "Bài thi sẽ được nộp tự động.",
      variant: "destructive",
    });
    handleSubmit();
  }, []);

  if (examLoading || submissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Không tìm thấy bài thi</h2>
        <p className="text-muted-foreground">
          Bài thi không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Button asChild>
          <Link to="/">Quay về trang chủ</Link>
        </Button>
      </div>
    );
  }

  if (availableSections.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <FileText className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">{exam.title}</h2>
        <p className="text-muted-foreground">
          Bài thi này chưa có nội dung câu hỏi. Vui lòng liên hệ giáo viên.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Quay về trang chủ</Link>
        </Button>
      </div>
    );
  }

  const isGrammarExam = exam.examType === "grammar";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitDialog(true)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Thoát
            </Button>
            <div className="hidden md:block">
              <h1 className="font-semibold text-lg">{exam.title}</h1>
            </div>
          </div>

          {/* Large Timer */}
          <div className="flex items-center gap-6">
            <ExamTimer
              duration={exam.durationMinutes || 60}
              onTimeUp={handleTimeUp}
              size="large"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Xem lại
              </Button>
              <Button
                onClick={() => setShowReviewDialog(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="mr-2 h-4 w-4" />
                Nộp bài
              </Button>
            </div>
          </div>
        </div>

        {/* Section Tabs (for IELTS exams) */}
        {!isGrammarExam && availableSections.length > 1 && (
          <div className="border-t">
            <div className="flex items-center gap-1 p-2 overflow-x-auto">
              {availableSections.map((section: any) => {
                const Icon =
                  sectionIcons[section.sectionType as SectionType] || FileText;
                const isActive = activeSection === section.sectionType;

                return (
                  <Button
                    key={section.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setActiveSection(section.sectionType as SectionType);
                      setCurrentQuestionId(undefined);
                    }}
                    className={`flex items-center gap-2 ${
                      isActive ? "" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {sectionLabels[section.sectionType as SectionType] ||
                      section.title}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentSection && activeSection === "listening" && (
          <ListeningSection
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            questionRefs={questionRefs}
            currentQuestionId={currentQuestionId}
            onQuestionFocus={setCurrentQuestionId}
          />
        )}
        {currentSection && activeSection === "reading" && (
          <ReadingSection
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            questionRefs={questionRefs}
            currentQuestionId={currentQuestionId}
            onQuestionFocus={setCurrentQuestionId}
          />
        )}
        {currentSection && activeSection === "writing" && (
          <WritingSection
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        )}
        {currentSection && activeSection === "speaking" && (
          <SpeakingSection
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        )}
        {currentSection && (activeSection === "general" || isGrammarExam) && (
          <GrammarSection
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            questionRefs={questionRefs}
            currentQuestionId={currentQuestionId}
            onQuestionFocus={setCurrentQuestionId}
          />
        )}
      </main>

      {/* Footer with Question Pagination */}
      <footer className="border-t bg-background p-4">
        <div className="max-w-6xl mx-auto">
          {/* Pagination Bubbles */}
          {currentSectionQuestions.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex <= 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Câu trước
              </Button>

              <div className="flex-1 flex justify-center overflow-x-auto py-2">
                <QuestionPagination
                  questions={currentSectionQuestions}
                  answers={answers}
                  flaggedQuestions={flaggedQuestions}
                  currentQuestionId={currentQuestionId}
                  onQuestionClick={handleQuestionClick}
                  onToggleFlag={handleToggleFlag}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex >= currentSectionQuestions.length - 1}
              >
                Câu sau
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </footer>

      {/* Review Dialog */}
      <ExamReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        sections={availableSections}
        answers={answers}
        flaggedQuestions={flaggedQuestions}
        onGoToQuestion={handleGoToQuestion}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thoát bài thi?</AlertDialogTitle>
            <AlertDialogDescription>
              Nếu bạn thoát bây giờ, tiến độ làm bài có thể bị mất. Bạn có chắc
              chắn muốn thoát?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate("/")}
              className="bg-destructive hover:bg-destructive/90"
            >
              Thoát
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
