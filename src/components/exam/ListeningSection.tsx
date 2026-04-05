import { useState, MutableRefObject } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Headphones, CheckSquare } from "lucide-react";
import { StickyAudioPlayer } from "./StickyAudioPlayer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { RichContent } from "./RichContent";
import {
  FillBlankHtmlRenderer,
  hasFillBlankPlaceholders,
} from "./FillBlankHtmlRenderer";
import { DropdownSelect } from "./DropdownSelect";
import { MatchingRenderer } from "./MatchingRenderer";

interface ListeningSectionProps {
  section: any;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  strictMode?: boolean;
  showTranscript?: boolean;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

export function ListeningSection({
  section,
  answers,
  onAnswerChange,
  strictMode = false,
  showTranscript = false,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: ListeningSectionProps) {
  const [currentPart, setCurrentPart] = useState(0);
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

  // Get current part questions
  const currentGroup = questionGroups[currentPart];
  const currentQuestions = currentGroup?.questions || [];
  const currentGroupAudioUrl =
    currentGroup?.audioUrl || currentGroup?.audio_url || null;

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Audio Player */}
      {(section.audio_url || section.audioUrl) && (
        <StickyAudioPlayer
          audioUrl={section.audio_url || section.audioUrl}
          strictMode={strictMode}
        />
      )}

      {/* Part Navigation */}
      {questionGroups.length > 1 && (
        <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
          {questionGroups.map((group: any, index: number) => (
            <Button
              key={group.id}
              variant={currentPart === index ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPart(index)}
              className="text-xs"
            >
              {group.title || `Part ${index + 1}`}
            </Button>
          ))}
        </div>
      )}

      {/* Single-column layout */}
      <div className="flex-1 overflow-hidden">
        {/* Transcript/Passage - Hidden during exam, only shown in review mode */}
        {showTranscript && currentGroup?.passage && (
          <div className="p-6 pb-0">
            <Card className="border-muted/60">
              <CardContent className="p-5">
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold mb-4">Transcript</h3>
                  <RichContent
                    html={currentGroup.passage}
                    className="leading-relaxed text-foreground"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Questions */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center gap-2 text-[hsl(var(--listening))] mb-6">
                <Headphones className="h-5 w-5" />
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>

              {section.instructions && (
                <Card className="bg-white border-orange-500 border shadow-sm">
                  <CardContent className="p-4 text-sm text-black font-medium leading-relaxed">
                    <RichContent html={section.instructions} />
                  </CardContent>
                </Card>
              )}

              {currentGroupAudioUrl && (
                <Card className="bg-primary/5 border-primary/20 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                      <Headphones className="h-3.5 w-3.5" />
                      Audio Part {currentPart + 1}
                    </div>
                    <audio
                      src={currentGroupAudioUrl}
                      controls
                      className="h-10 w-full"
                    />
                  </CardContent>
                </Card>
              )}

              {currentGroup && (
                <div className="space-y-4">
                  {currentGroup.instructions && (
                    <div className="p-3 bg-white border-orange-500/50 border rounded-lg text-sm text-black font-semibold shadow-sm mb-4">
                      <RichContent html={currentGroup.instructions} />
                    </div>
                  )}

                  {currentQuestions.map((question: any, qIndex: number) => {
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
                              {question.order_index || qIndex + 1}
                            </span>
                            <div className="flex-1 space-y-3">
                              {!(
                                question.question_type === "fill_blank" &&
                                hasFillBlankPlaceholders(question.question_text)
                              ) && (
                                <RichContent
                                  html={question.question_text}
                                  className="font-semibold text-base"
                                />
                              )}



                              {question.question_audio_url && (
                                <div className="bg-muted/50 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                                  <div className="bg-primary/10 p-2 rounded-full">
                                    <Headphones className="h-4 w-4 text-primary" />
                                  </div>
                                  <audio
                                    src={question.question_audio_url}
                                    controls
                                    className="h-8 w-full max-w-[300px]"
                                  />
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    Audio riêng
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-12 space-y-4">
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
                                            const checked = selectedValues.includes(
                                              option,
                                            );
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
                                                    if (next) {
                                                      nextValues.add(option);
                                                    } else {
                                                      nextValues.delete(option);
                                                    }
                                                    onAnswerChange(
                                                      question.id,
                                                      Array.from(nextValues),
                                                    );
                                                  }}
                                                />
                                                <span className="font-medium text-sm">
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
                                          {option}
                                        </Label>
                                      </div>
                                    ),
                                  )}
                                  </RadioGroup>
                                );
                              })()}

                            {/* Fill Blank with placeholders - HTML rendering support */}
                            {question.question_type === "fill_blank" &&
                              hasFillBlankPlaceholders(
                                question.question_text,
                              ) && (
                                <FillBlankHtmlRenderer
                                  html={question.question_text}
                                  answers={answers[question.id] || {}}
                                  questionId={question.id}
                                  onAnswerChange={onAnswerChange}
                                />
                              )}
                            {/* Simple text input for short_answer or fill_blank without placeholders */}
                            {((question.question_type === "fill_blank" &&
                              !hasFillBlankPlaceholders(
                                question.question_text,
                              )) ||
                              question.question_type === "short_answer") && (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Nhập câu trả lời của bạn..."
                                  value={answers[question.id] || ""}
                                  onChange={(e) =>
                                    onAnswerChange(
                                      question.id,
                                      e.target.value,
                                    )
                                  }
                                  className="max-w-md h-11 bg-background shadow-sm focus-visible:ring-primary/30"
                                />
                                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 opacity-70">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                  Gợi ý: Nhập văn bản vào ô trên
                                </p>
                              </div>
                            )}

                            {question.question_type ===
                              "true_false_not_given" && (
                                <div className="max-w-[200px]">
                                  <DropdownSelect
                                    value={answers[question.id] || ""}
                                    onChange={(value) =>
                                      onAnswerChange(question.id, value)
                                    }
                                    options={["TRUE", "FALSE", "NOT GIVEN"]}
                                    placeholder="Chọn đáp án"
                                  />
                                </div>
                              )}

                            {question.question_type === "yes_no_not_given" && (
                              <div className="max-w-[200px]">
                                <DropdownSelect
                                  value={answers[question.id] || ""}
                                  onChange={(value) =>
                                    onAnswerChange(question.id, value)
                                  }
                                  options={["YES", "NO", "NOT GIVEN"]}
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
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
