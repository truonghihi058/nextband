import { MutableRefObject } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, BookOpen, CheckSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { QuestionRecorder } from "./QuestionRecorder";
import {
  FillBlankHtmlRenderer,
  hasFillBlankPlaceholders,
} from "./FillBlankHtmlRenderer";
import { DropdownSelect } from "./DropdownSelect";
import { MatchingRenderer } from "./MatchingRenderer";

interface GrammarSectionProps {
  section: any;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

function WordCount({ text }: { text: string }) {
  const count = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="text-xs text-muted-foreground text-right mt-1">
      {count} từ
    </div>
  );
}

export function GrammarSection({
  section,
  answers,
  onAnswerChange,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: GrammarSectionProps) {
  const rawGroups = section.question_groups || section.questionGroups || [];

  // Normalize question fields from camelCase to snake_case
  const questionGroups = rawGroups
    .map((g: any) => ({
      ...g,
      questions: (g.questions || [])
        .map((q: any) => ({
          ...q,
          question_text: q.question_text || q.questionText || "",
          question_type: q.question_type || q.questionType || "short_answer",
          question_audio_url:
            q.audioUrl || q.audio_url || q.question_audio_url || null,
          order_index: q.order_index ?? q.orderIndex ?? 0,
          correct_answer: q.correct_answer || q.correctAnswer || null,
          options: q.options
            ? typeof q.options === "string"
              ? JSON.parse(q.options)
              : q.options
            : [],
        }))
        .sort((a: any, b: any) => {
          const orderDiff = (a.order_index || 0) - (b.order_index || 0);
          return orderDiff !== 0
            ? orderDiff
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }),
    }))
    .sort((a: any, b: any) => {
      const orderDiff =
        (a.order_index || a.orderIndex || 0) -
        (b.order_index || b.orderIndex || 0);
      return orderDiff !== 0
        ? orderDiff
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  return (
    <div className="h-full overflow-auto">
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{section.title}</h2>
          </div>

          {section.instructions && (
            <Card className="bg-white border-orange-500 border shadow-sm">
              <CardContent className="p-4 text-sm text-black font-medium leading-relaxed">
                <div
                  dangerouslySetInnerHTML={{ __html: section.instructions }}
                />
              </CardContent>
            </Card>
          )}

          {/* Question Groups */}
          <div className="space-y-8">
            {(() => { let questionCounter = 0; return questionGroups.map((group: any, gIndex: number) => (
              <div key={group.id} className="space-y-4">
                {/* Group Header */}
                {(group.title || group.instructions) && (
                  <div className="space-y-2">
                    {group.title && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                          Phần {gIndex + 1}
                        </span>
                        <h3 className="font-semibold text-lg">{group.title}</h3>
                      </div>
                    )}
                    {group.instructions && (
                      <div className="p-3 bg-white border-orange-500/50 border rounded-lg text-sm text-black font-semibold shadow-sm mb-4">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: group.instructions,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Group Passage */}
                {group.passage && (
                  <Card className="bg-muted/40 border-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                        <BookOpen className="h-4 w-4" />
                        Bài đọc
                      </div>
                      {/<[^>]+>/.test(group.passage) ? (
                        <div
                          className="text-sm leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: group.passage }}
                        />
                      ) : (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {group.passage}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Group Audio */}
                {(group.audioUrl || group.audio_url) && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                    <audio
                      src={group.audioUrl || group.audio_url}
                      controls
                      className="h-10 w-full"
                    />
                  </div>
                )}



                {/* Questions */}
                <div className="space-y-4">
                  {(group.questions || []).map(
                    (question: any, qIndex: number) => {
                      questionCounter++;
                      const isCurrent = question.id === currentQuestionId;

                      return (
                        <Card
                          key={question.id}
                          ref={(el) => {
                            if (el && questionRefs) {
                              questionRefs.current.set(question.id, el);
                            }
                          }}
                          className={cn(
                            "transition-all duration-300 border-l-4",
                            isCurrent
                              ? "ring-1 ring-primary shadow-md border-l-primary bg-primary/5"
                              : "border-l-transparent hover:border-l-muted-foreground/30 hover:shadow-sm",
                          )}
                          onClick={() => onQuestionFocus?.(question.id)}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4 mb-4">
                              <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                                {questionCounter}
                              </span>

                              <div className="flex-1 space-y-3">
                                {!(
                                  question.question_type === "fill_blank" &&
                                  hasFillBlankPlaceholders(
                                    question.question_text,
                                  )
                                ) &&
                                  (/<[^>]+>/.test(question.question_text) ? (
                                    <div
                                      className="font-semibold text-base leading-snug prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{
                                        __html: question.question_text,
                                      }}
                                    />
                                  ) : (
                                    <p className="font-semibold text-base leading-snug">
                                      {question.question_text}
                                    </p>
                                  ))}

                                {question.question_audio_url && (
                                  <div className="bg-muted/50 p-3 rounded-xl border border-border/50 flex items-center gap-3 max-w-sm">
                                    <audio
                                      src={question.question_audio_url}
                                      controls
                                      className="h-8 w-full"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="ml-12 space-y-4">
                              {/* Multiple Choice or Listening with Options */}
                              {(question.question_type === "multiple_choice" ||
                                (question.question_type === "listening" &&
                                  question.options &&
                                  question.options.length > 0)) &&
                                question.options &&
                                question.options.length > 0 &&
                                (() => {
                                  const selectedRaw = answers[question.id];
                                  const selectedValues = Array.isArray(selectedRaw)
                                    ? selectedRaw
                                    : selectedRaw
                                      ? [selectedRaw]
                                      : [];
                                  const hasMultipleCorrect =
                                    typeof question.correct_answer === "string" &&
                                    question.correct_answer
                                      .split("|")
                                      .map((v: string) => v.trim())
                                      .filter(Boolean).length > 1;

                                  const currentAnswers = typeof question.correct_answer === "string"
                                    ? question.correct_answer.split("|").map((v: string) => v.trim()).filter(Boolean)
                                    : [];
                                  if (hasMultipleCorrect) {
                                    const expectedCount = currentAnswers.length;
                                    return (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/8 border border-primary/20 rounded-lg px-3 py-1.5">
                                          <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" />
                                          <span>Chọn {expectedCount} đáp án phù hợp</span>
                                          <span className="ml-auto text-muted-foreground font-normal">
                                            Đã chọn: {selectedValues.length}/{expectedCount}
                                          </span>
                                        </div>
                                        <div className="grid gap-2">
                                          {question.options.map(
                                            (option: string, i: number) => {
                                              const checked =
                                                selectedValues.includes(option);
                                              return (
                                                <label
                                                  key={i}
                                                  className={cn(
                                                    "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                                    checked
                                                      ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                                                      : "bg-background border-transparent hover:bg-muted/30",
                                                  )}
                                                >
                                                  <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={(next) => {
                                                      const nextValues = new Set(
                                                        selectedValues,
                                                      );
                                                      if (next) nextValues.add(option);
                                                      else nextValues.delete(option);
                                                      onAnswerChange(
                                                        question.id,
                                                        Array.from(nextValues),
                                                      );
                                                    }}
                                                  />
                                                  <span className="font-medium text-sm">
                                                    <span className="text-muted-foreground mr-2 text-xs font-bold w-4 inline-block">
                                                      {String.fromCharCode(65 + i)}
                                                    </span>
                                                    {option}
                                                  </span>
                                                </label>
                                              );
                                            },
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }


                                  return (
                                    <RadioGroup
                                      value={selectedValues[0] || ""}
                                      onValueChange={(value) =>
                                        onAnswerChange(question.id, value)
                                      }
                                      className="grid gap-2"
                                    >
                                      {question.options.map(
                                        (option: string, i: number) => (
                                        <div
                                          key={i}
                                          className={cn(
                                            "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                                            answers[question.id] === option
                                              ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                                              : "bg-background border-transparent hover:bg-muted/30",
                                          )}
                                        >
                                          <RadioGroupItem
                                            value={option}
                                            id={`${question.id}-${i}`}
                                          />
                                          <Label
                                            htmlFor={`${question.id}-${i}`}
                                            className="flex-1 cursor-pointer font-medium text-sm"
                                          >
                                            <span className="text-muted-foreground mr-2 text-xs font-bold w-4 inline-block">
                                              {String.fromCharCode(65 + i)}
                                            </span>
                                            {option}
                                          </Label>
                                        </div>
                                      ),
                                    )}
                                    </RadioGroup>
                                  );
                                })()}

                              {/* Fill Blank */}
                              {question.question_type === "fill_blank" && (
                                <div className="space-y-3">
                                  {hasFillBlankPlaceholders(
                                    question.question_text,
                                  ) ? (
                                    <FillBlankHtmlRenderer
                                      html={question.question_text}
                                      answers={answers[question.id] || {}}
                                      questionId={question.id}
                                      onAnswerChange={onAnswerChange}
                                    />
                                  ) : (
                                    <Input
                                      placeholder="Nhập đáp án của bạn..."
                                      value={answers[question.id] || ""}
                                      onChange={(e) =>
                                        onAnswerChange(
                                          question.id,
                                          e.target.value,
                                        )
                                      }
                                      className="max-w-md h-11"
                                    />
                                  )}
                                </div>
                              )}

                              {/* Short Answer */}
                              {question.question_type === "short_answer" && (
                                <Input
                                  placeholder="Nhập câu trả lời..."
                                  value={answers[question.id] || ""}
                                  onChange={(e) =>
                                    onAnswerChange(
                                      question.id,
                                      e.target.value,
                                    )
                                  }
                                  className="max-w-2xl h-11"
                                />
                              )}


                              {/* Speaking / Audio Answer */}
                              {question.question_type === "speaking" && (
                                <QuestionRecorder
                                  questionId={question.id}
                                  answer={answers[question.id]}
                                  onAnswerChange={onAnswerChange}
                                />
                              )}

                              {/* Essay */}
                              {question.question_type === "essay" && (
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder="Viết câu trả lời của bạn..."
                                    value={answers[question.id] || ""}
                                    onChange={(e) =>
                                      onAnswerChange(
                                        question.id,
                                        e.target.value,
                                      )
                                    }
                                    rows={8}
                                    className="resize-y shadow-sm"
                                  />
                                  <WordCount
                                    text={answers[question.id] || ""}
                                  />
                                </div>
                              )}

                              {/* TRUE/FALSE/NOT GIVEN */}
                              {(question.question_type ===
                                "true_false_not_given" ||
                                question.question_type ===
                                "yes_no_not_given") && (
                                  <div className="max-w-[200px]">
                                    <DropdownSelect
                                      value={answers[question.id] || ""}
                                      onChange={(value) =>
                                        onAnswerChange(question.id, value)
                                      }
                                      options={
                                        question.question_type ===
                                          "true_false_not_given"
                                          ? ["TRUE", "FALSE", "NOT GIVEN"]
                                          : ["YES", "NO", "NOT GIVEN"]
                                      }
                                      placeholder="Chọn đáp án"
                                    />
                                  </div>
                                )}

                              {question.question_type === "matching" && (
                                <MatchingRenderer
                                  question={question}
                                  answers={answers}
                                  onAnswerChange={onAnswerChange}
                                />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    },
                  )}
                </div>
              </div>
            )); })()}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
