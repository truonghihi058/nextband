import { useMemo, MutableRefObject } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mic, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { QuestionRecorder } from "./QuestionRecorder";

interface SpeakingSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

export function SpeakingSection({
  section,
  answers,
  onAnswerChange,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: SpeakingSectionProps) {
  const rawGroups = section.question_groups || section.questionGroups || [];

  // Normalize question fields
  const questionGroups = useMemo(() => {
    return rawGroups.map((g: any) => ({
      ...g,
      questions: (g.questions || []).map((q: any) => ({
        ...q,
        question_text: q.question_text || q.questionText || "",
        question_type: q.question_type || q.questionType || "speaking",
        order_index: q.order_index ?? q.orderIndex ?? 0,
        options: q.options
          ? typeof q.options === "string"
            ? JSON.parse(q.options)
            : q.options
          : [],
      })),
    }));
  }, [rawGroups]);

  // Flatten for calculations
  const allQuestions = useMemo(() => {
    return questionGroups.flatMap((g: any) => g.questions);
  }, [questionGroups]);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 space-y-8 pb-32">
          {/* Header */}
          <div className="flex items-center gap-2 text-[hsl(var(--speaking))] mb-8">
            <div className="p-2 rounded-lg bg-[hsl(var(--speaking))]/10">
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <p className="text-sm text-muted-foreground">
                {section.instructions || "Thực hiện các phần thi nói dưới đây"}
              </p>
            </div>
          </div>

          {questionGroups.map((group: any, gIndex: number) => (
            <div key={group.id} className="space-y-6">
              {/* Group Header */}
              {(group.title || group.instructions) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-[hsl(var(--speaking))] text-white text-xs font-bold uppercase tracking-wider">
                      Phần {gIndex + 1}
                    </span>
                    {group.title && (
                      <h3 className="text-xl font-bold">{group.title}</h3>
                    )}
                  </div>
                  {group.instructions && (
                    <div className="p-4 bg-muted/30 border border-muted rounded-xl text-sm italic text-muted-foreground">
                      {group.instructions}
                    </div>
                  )}
                </div>
              )}

              {/* Group Passage/Cue Card */}
              {group.passage && (
                <Card className="bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-4 uppercase text-xs tracking-widest">
                      <BookOpen className="h-4 w-4" />
                      Cue Card / Thông tin gợi ý
                    </div>
                    <div className="text-lg leading-relaxed whitespace-pre-wrap font-medium">
                      {group.passage}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Questions in this group */}
              <div className="space-y-4">
                {group.questions.map((question: any, qIndex: number) => {
                  const isCurrent = question.id === currentQuestionId;
                  const hasAnswer = !!answers[question.id];
                  const qGlobalIndex =
                    allQuestions.findIndex((q) => q.id === question.id) + 1;

                  return (
                    <Card
                      key={question.id}
                      ref={(el) => {
                        if (el && questionRefs) {
                          questionRefs.current.set(question.id, el);
                        }
                      }}
                      className={cn(
                        "transition-all duration-300 border-l-4 overflow-hidden",
                        isCurrent
                          ? "ring-1 ring-[hsl(var(--speaking))] shadow-md border-l-[hsl(var(--speaking))] bg-[hsl(var(--speaking))]/5"
                          : "border-l-transparent hover:border-l-muted-foreground/30",
                      )}
                      onClick={() => onQuestionFocus?.(question.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <span
                            className={cn(
                              "shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm transition-colors",
                              hasAnswer
                                ? "bg-[hsl(var(--success))] text-white"
                                : "bg-[hsl(var(--speaking))] text-white",
                            )}
                          >
                            {question.order_index || qGlobalIndex}
                          </span>

                          <div className="flex-1 space-y-4">
                            <p className="font-semibold text-lg leading-snug pt-1">
                              {question.question_text}
                            </p>

                            {/* Question Type Specific Interaction */}
                            <div className="pl-0 pb-2">
                              {question.question_type === "multiple_choice" && (
                                <RadioGroup
                                  value={answers[question.id] || ""}
                                  onValueChange={(val) =>
                                    onAnswerChange(question.id, val)
                                  }
                                  className="grid gap-2"
                                >
                                  {question.options.map(
                                    (opt: string, i: number) => (
                                      <div
                                        key={i}
                                        className={cn(
                                          "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                                          answers[question.id] === opt
                                            ? "bg-white border-[hsl(var(--speaking))]/30 shadow-sm"
                                            : "bg-transparent border-transparent hover:bg-white/50",
                                        )}
                                      >
                                        <RadioGroupItem
                                          value={opt}
                                          id={`${question.id}-${i}`}
                                        />
                                        <Label
                                          htmlFor={`${question.id}-${i}`}
                                          className="flex-1 cursor-pointer font-medium"
                                        >
                                          <span className="text-muted-foreground mr-2 text-xs font-bold">
                                            {String.fromCharCode(65 + i)}.
                                          </span>
                                          {opt}
                                        </Label>
                                      </div>
                                    ),
                                  )}
                                </RadioGroup>
                              )}

                              {(question.question_type === "speaking" ||
                                question.question_type === "essay") && (
                                <QuestionRecorder
                                  questionId={question.id}
                                  answer={answers[question.id]}
                                  onAnswerChange={onAnswerChange}
                                />
                              )}

                              {/* Generic input for others */}
                              {![
                                "multiple_choice",
                                "speaking",
                                "essay",
                              ].includes(question.question_type) && (
                                <Input
                                  placeholder="Nhập câu trả lời..."
                                  value={answers[question.id] || ""}
                                  onChange={(e) =>
                                    onAnswerChange(question.id, e.target.value)
                                  }
                                  className="max-w-md h-11 mt-4"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
