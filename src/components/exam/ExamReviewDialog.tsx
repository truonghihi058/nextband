import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Flag, AlertCircle, Send } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  order_index?: number;
}

interface Section {
  id: string;
  section_type: string;
  sectionType?: string;
  title: string;
  question_groups?: {
    id: string;
    questions?: Question[];
  }[];
  questionGroups?: {
    id: string;
    questions?: Question[];
  }[];
}

interface ExamReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[];
  answers: Record<string, string>;
  flaggedQuestions: Set<string>;
  onGoToQuestion: (sectionType: string, questionId: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function ExamReviewDialog({
  open,
  onOpenChange,
  sections,
  answers,
  flaggedQuestions,
  onGoToQuestion,
  onSubmit,
  isSubmitting,
}: ExamReviewDialogProps) {
  const getAllQuestions = () => {
    const result: { section: Section; question: Question; index: number }[] =
      [];
    let globalIndex = 0;

    sections.forEach((section) => {
      (section.question_groups || section.questionGroups)?.forEach((group) => {
        group.questions?.forEach((q) => {
          result.push({ section, question: q, index: globalIndex++ });
        });
      });
    });

    return result;
  };

  const allQuestions = getAllQuestions();
  const answeredCount = allQuestions.filter(
    (q) => !!answers[q.question.id]?.trim(),
  ).length;
  const flaggedCount = allQuestions.filter((q) =>
    flaggedQuestions.has(q.question.id),
  ).length;
  const unansweredCount = allQuestions.length - answeredCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Xem lại bài thi
          </DialogTitle>
          <DialogDescription>
            Kiểm tra lại các câu trả lời trước khi nộp bài
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-[hsl(var(--success))]">
              {answeredCount}
            </div>
            <div className="text-sm text-muted-foreground">Đã trả lời</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {unansweredCount}
            </div>
            <div className="text-sm text-muted-foreground">Chưa trả lời</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {flaggedCount}
            </div>
            <div className="text-sm text-muted-foreground">Đã đánh dấu</div>
          </div>
        </div>

        {/* Question List */}
        <ScrollArea className="max-h-[40vh]">
          <div className="space-y-4">
            {sections.map((section) => {
              const sectionQuestions =
                (section.question_groups || section.questionGroups)?.flatMap(
                  (g) => g.questions || [],
                ) || [];
              if (sectionQuestions.length === 0) return null;

              return (
                <div key={section.id} className="space-y-2">
                  <div className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    {section.title}
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {sectionQuestions.map((q, idx) => {
                      const isAnswered = !!answers[q.id]?.trim();
                      const isFlagged = flaggedQuestions.has(q.id);

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            onGoToQuestion(
                              section.section_type || section.sectionType,
                              q.id,
                            );
                            onOpenChange(false);
                          }}
                          className={`
                            w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium
                            border-2 transition-all hover:scale-110
                            ${isAnswered && !isFlagged ? "bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" : ""}
                            ${isFlagged ? "bg-destructive border-destructive text-white" : ""}
                            ${!isAnswered && !isFlagged ? "bg-background border-muted-foreground/30" : ""}
                          `}
                        >
                          {isFlagged ? (
                            <Flag className="h-3 w-3" />
                          ) : isAnswered ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            idx + 1
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Warning */}
        {(unansweredCount > 0 || flaggedCount > 0) && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              {unansweredCount > 0 && (
                <p className="text-amber-800 dark:text-amber-200">
                  Bạn còn <strong>{unansweredCount}</strong> câu chưa trả lời.
                </p>
              )}
              {flaggedCount > 0 && (
                <p className="text-amber-800 dark:text-amber-200">
                  Bạn còn <strong>{flaggedCount}</strong> câu đã đánh dấu để xem
                  lại.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tiếp tục làm bài
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>Đang nộp...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Nộp bài
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
