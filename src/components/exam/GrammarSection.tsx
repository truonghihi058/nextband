import { useState, MutableRefObject } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileText, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DropdownSelect } from "./DropdownSelect";

interface GrammarSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
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
  const questionGroups = section.question_groups || [];

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
            <Card className="bg-muted/30 border-muted">
              <CardContent className="p-4 text-sm text-muted-foreground">
                {section.instructions}
              </CardContent>
            </Card>
          )}

          {/* Question Groups */}
          <div className="space-y-8">
            {questionGroups.map((group: any, gIndex: number) => (
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
                      <Card className="bg-accent/20 border-accent/40">
                        <CardContent className="p-3 text-sm text-accent-foreground">
                          {group.instructions}
                        </CardContent>
                      </Card>
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
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {group.passage}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Questions */}
                <div className="space-y-3">
                  {(group.questions || [])
                    .sort(
                      (a: any, b: any) =>
                        (a.order_index || 0) - (b.order_index || 0),
                    )
                    .map((question: any, qIndex: number) => {
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
                            "transition-all",
                            isCurrent && "ring-2 ring-primary shadow-lg",
                          )}
                          onClick={() => onQuestionFocus?.(question.id)}
                        >
                          <CardContent className="p-4">
                            <p className="font-medium mb-3">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-2">
                                {question.order_index || qIndex + 1}
                              </span>
                              {/* Only show question text here if it's NOT a fill_blank with placeholders */}
                              {!(
                                question.question_type === "fill_blank" &&
                                (question.question_text.includes("_____") ||
                                  question.question_text.includes("[BLANK]"))
                              ) && question.question_text}
                            </p>

                            {/* Multiple Choice */}
                            {question.question_type === "multiple_choice" &&
                              question.options && (
                                <RadioGroup
                                  value={answers[question.id] || ""}
                                  onValueChange={(value) =>
                                    onAnswerChange(question.id, value)
                                  }
                                  className="space-y-2 ml-9"
                                >
                                  {(question.options as string[]).map(
                                    (option: string, i: number) => (
                                      <div
                                        key={i}
                                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                      >
                                        <RadioGroupItem
                                          value={option}
                                          id={`${question.id}-${i}`}
                                        />
                                        <Label
                                          htmlFor={`${question.id}-${i}`}
                                          className="flex-1 cursor-pointer"
                                        >
                                          <span className="font-medium mr-2">
                                            {String.fromCharCode(65 + i)}.
                                          </span>
                                          {option}
                                        </Label>
                                      </div>
                                    ),
                                  )}
                                </RadioGroup>
                              )}

                            {/* Fill Blank */}
                            {question.question_type === "fill_blank" && (
                              <div className="ml-9">
                                {question.question_text.includes("_____") ||
                                question.question_text.includes("[BLANK]") ? (
                                  <div className="text-base leading-relaxed">
                                    {/* Inline rendering for fill_blank with placeholders */}
                                    {(() => {
                                      const text = question.question_text;
                                      const parts =
                                        text.split(/(_____|\[BLANK\])/g);
                                      return (
                                        <div className="flex flex-wrap items-baseline gap-2">
                                          {parts.map(
                                            (part: string, index: number) => {
                                              if (
                                                part === "_____" ||
                                                part === "[BLANK]"
                                              ) {
                                                return (
                                                  <Input
                                                    key={index}
                                                    placeholder="Answer..."
                                                    value={
                                                      answers[question.id] || ""
                                                    }
                                                    onChange={(e) =>
                                                      onAnswerChange(
                                                        question.id,
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-40 inline-flex h-8 mx-1"
                                                  />
                                                );
                                              }
                                              return (
                                                <span key={index}>{part}</span>
                                              );
                                            },
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <Input
                                    placeholder="Nhập đáp án..."
                                    value={answers[question.id] || ""}
                                    onChange={(e) =>
                                      onAnswerChange(
                                        question.id,
                                        e.target.value,
                                      )
                                    }
                                    className="max-w-xs"
                                  />
                                )}
                              </div>
                            )}

                            {/* Short Answer */}
                            {question.question_type === "short_answer" && (
                              <div className="ml-9">
                                <Input
                                  placeholder="Nhập câu trả lời..."
                                  value={answers[question.id] || ""}
                                  onChange={(e) =>
                                    onAnswerChange(question.id, e.target.value)
                                  }
                                  className="max-w-2xl"
                                />
                              </div>
                            )}

                            {/* Essay */}
                            {question.question_type === "essay" && (
                              <div className="ml-9">
                                <Textarea
                                  placeholder="Viết câu trả lời của bạn..."
                                  value={answers[question.id] || ""}
                                  onChange={(e) =>
                                    onAnswerChange(question.id, e.target.value)
                                  }
                                  rows={6}
                                  className="resize-y"
                                />
                                <WordCount text={answers[question.id] || ""} />
                              </div>
                            )}

                            {/* TRUE/FALSE/NOT GIVEN */}
                            {question.question_type ===
                              "true_false_not_given" && (
                              <div className="ml-9">
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

                            {/* YES/NO/NOT GIVEN */}
                            {question.question_type === "yes_no_not_given" && (
                              <div className="ml-9">
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
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
