import { useState, MutableRefObject } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Headphones } from "lucide-react";
import { StickyAudioPlayer } from "./StickyAudioPlayer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  FillBlankHtmlRenderer,
  hasFillBlankPlaceholders,
} from "./FillBlankHtmlRenderer";
import { DropdownSelect } from "./DropdownSelect";

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

  // Calculate cumulative question number offset for each part
  const questionNumberOffset = questionGroups
    .slice(0, currentPart)
    .reduce((acc: number, g: any) => acc + (g.questions?.length || 0), 0);

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Audio Player - show group-level audio if available, else section-level */}
      {(currentGroup?.audio_url || currentGroup?.audioUrl) ? (
        <StickyAudioPlayer
          key={currentGroup.id}
          audioUrl={currentGroup.audio_url || currentGroup.audioUrl}
          strictMode={strictMode}
        />
      ) : (section.audio_url || section.audioUrl) ? (
        <StickyAudioPlayer
          audioUrl={section.audio_url || section.audioUrl}
          strictMode={strictMode}
        />
      ) : null}

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

      {/* Layout: split-screen if transcript is shown, otherwise full-width centered */}
      {showTranscript && currentGroup?.passage ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x overflow-hidden">
          {/* Left Panel - Transcript */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-6">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold mb-4">Transcript</h3>
                {/\<[^>]+>/.test(currentGroup.passage) ? (
                  <div
                    className="leading-relaxed text-foreground"
                    dangerouslySetInnerHTML={{ __html: currentGroup.passage }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                    {currentGroup.passage}
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Right Panel - Questions (split mode) */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-6">
              <div className="w-full space-y-6">
              <div className="flex items-center gap-2 text-[hsl(var(--listening))] mb-6">
                <Headphones className="h-5 w-5" />
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

              {currentGroup && (
                <div className="space-y-4">
                  {currentGroup.instructions && (
                    <div className="p-3 bg-white border-orange-500/50 border rounded-lg text-sm text-black font-semibold shadow-sm mb-4">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: currentGroup.instructions,
                        }}
                      />
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
                              {questionNumberOffset + qIndex + 1}
                            </span>
                            <div className="flex-1 space-y-3">
                              {!(
                                question.question_type === "fill_blank" &&
                                hasFillBlankPlaceholders(question.question_text)
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
                              question.options.length > 0 && (
                                <RadioGroup
                                  value={answers[question.id] || ""}
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
                              )}

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

                            {/* Simple text input for listening/short_answer/fill_blank without placeholders */}
                            {((question.question_type === "fill_blank" &&
                              !hasFillBlankPlaceholders(
                                question.question_text,
                              )) ||
                              question.question_type === "listening" ||
                              question.question_type === "short_answer") &&
                              (!question.options ||
                                question.options.length === 0) && (
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
                                    className="w-full h-11 bg-background shadow-sm focus-visible:ring-primary/30"
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
      ) : (
        /* Layout: Full-width centered when no transcript */
        <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
          <div className="p-6">
            <div className="w-full max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-2 text-[hsl(var(--listening))] mb-6">
                <Headphones className="h-5 w-5" />
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>

              {section.instructions && (
                <Card className="bg-white border-orange-500 border shadow-sm">
                  <CardContent className="p-4 text-sm text-black font-medium leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: section.instructions }} />
                  </CardContent>
                </Card>
              )}

              {currentGroup && (
                <div className="space-y-4">
                  {currentGroup.instructions && (
                    <div className="p-3 bg-white border-orange-500/50 border rounded-lg text-sm text-black font-semibold shadow-sm mb-4">
                      <div dangerouslySetInnerHTML={{ __html: currentGroup.instructions }} />
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
                              {questionNumberOffset + qIndex + 1}
                            </span>
                            <div className="flex-1 space-y-3">
                              {!(
                                question.question_type === "fill_blank" &&
                                hasFillBlankPlaceholders(question.question_text)
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
                              question.options.length > 0 && (
                                <RadioGroup
                                  value={answers[question.id] || ""}
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
                              )}

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

                            {/* Simple text input for listening/short_answer/fill_blank without placeholders */}
                            {((question.question_type === "fill_blank" &&
                              !hasFillBlankPlaceholders(
                                question.question_text,
                              )) ||
                              question.question_type === "listening" ||
                              question.question_type === "short_answer") &&
                              (!question.options ||
                                question.options.length === 0) && (
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
                                    className="w-full h-11 bg-background shadow-sm focus-visible:ring-primary/30"
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
      )}
    </div>
  );
}
