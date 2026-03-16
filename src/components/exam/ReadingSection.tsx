import {
  useState,
  useEffect,
  useRef,
  useCallback,
  MutableRefObject,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BookOpen, Highlighter, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTextHighlight, Highlight } from "@/hooks/useTextHighlight";
import { cn } from "@/lib/utils";
import { DropdownSelect } from "./DropdownSelect";

import {
  FillBlankHtmlRenderer,
  hasFillBlankPlaceholders,
} from "./FillBlankHtmlRenderer";

interface ReadingSectionProps {
  section: any;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

const containsHtml = (text: string) => /<[^>]+>/.test(text);

const toRoman = (num: number): string => {
  if (num <= 0) return "";
  const roman: Record<string, number> = {
    M: 1000, CM: 900, D: 500, CD: 400,
    C: 100, XC: 90, L: 50, XL: 40,
    X: 10, IX: 9, V: 5, IV: 4, I: 1
  };
  let str = "";
  for (const i of Object.keys(roman)) {
    const q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    str += i.repeat(q);
  }
  return str;
};

export function ReadingSection({
  section,
  answers,
  onAnswerChange,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: ReadingSectionProps) {
  const passageRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState<{
    text: string;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const { highlights, addHighlight, removeHighlight, loadHighlights } =
    useTextHighlight(section.id);

  // Normalize question groups and their fields from camelCase to snake_case
  const questionGroups = (
    section.question_groups ||
    section.questionGroups ||
    []
  )
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
          if (orderDiff !== 0) return orderDiff;
          // Secondary sort by createdAt to maintain insertion order if index is the same
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }),
    }))
    .sort((a: any, b: any) => {
      const orderDiff =
        (a.order_index || a.orderIndex || 0) -
        (b.order_index || b.orderIndex || 0);
      if (orderDiff !== 0) return orderDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  // Get passage text from first question group or section
  const passageText = questionGroups[0]?.passage || section.passage_text || "";

  useEffect(() => {
    if (section.id) {
      loadHighlights(section.id);
    }
  }, [section.id, loadHighlights]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !passageRef.current) {
      setShowHighlightMenu(false);
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setShowHighlightMenu(false);
      return;
    }

    const startIndex = passageText.indexOf(text);

    if (startIndex >= 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText({
        text,
        startIndex,
        endIndex: startIndex + text.length,
      });
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setShowHighlightMenu(true);
    }
  }, [passageText]);

  const handleHighlight = async (color: "yellow" | "green") => {
    if (selectedText) {
      await addHighlight(selectedText.startIndex, selectedText.endIndex, color);
      setShowHighlightMenu(false);
      setSelectedText(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const renderHighlightedText = () => {
    const text = passageText;
    if (!text) return null;
    if (highlights.length === 0) return text;

    const sortedHighlights = [...highlights].sort(
      (a, b) => a.startIndex - b.startIndex,
    );
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight) => {
      if (highlight.startIndex > lastIndex) {
        result.push(text.slice(lastIndex, highlight.startIndex));
      }

      const highlightBg =
        highlight.color === "yellow"
          ? "bg-yellow-200 dark:bg-yellow-900/50"
          : "bg-green-200 dark:bg-green-900/50";

      result.push(
        <mark
          key={highlight.id}
          className={`${highlightBg} px-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={() => removeHighlight(highlight.id)}
          title="Click để xóa highlight"
        >
          {text.slice(highlight.startIndex, highlight.endIndex)}
        </mark>,
      );

      lastIndex = highlight.endIndex;
    });

    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result;
  };

  // Flatten all questions from all groups
  const allQuestions =
    questionGroups?.flatMap((group: any, gIdx: number) =>
      (group.questions || []).map((q: any) => ({
        ...q,
        groupTitle: group.title,
        groupInstructions: group.instructions,
      })),
    ) || [];

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x relative">
      {/* Highlight Menu */}
      {showHighlightMenu && (
        <div
          className="fixed z-50 bg-card border rounded-lg shadow-lg p-2 flex items-center gap-1"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-yellow-200 hover:bg-yellow-300"
            onClick={() => handleHighlight("yellow")}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-green-200 hover:bg-green-300"
            onClick={() => handleHighlight("green")}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setShowHighlightMenu(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Left - Passage */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div ref={passageRef} className="p-6" onMouseUp={handleTextSelection}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-[hsl(var(--reading))]">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-xl font-semibold">{section.title}</h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Highlighter className="h-3 w-3" />
              <span>Chọn văn bản để highlight</span>
            </div>
          </div>

          {passageText && (
            <div className="prose prose-sm max-w-none">
              {containsHtml(passageText) ? (
                <div
                  className="leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: passageText }}
                />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-foreground select-text">
                  {renderHighlightedText()}
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Right - Questions */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-6 space-y-6">
          {section.instructions && (
            <Card className="bg-white border-orange-500 border shadow-sm">
              <CardContent className="p-4 text-sm text-black font-medium leading-relaxed">
                <div
                  dangerouslySetInnerHTML={{ __html: section.instructions }}
                />
              </CardContent>
            </Card>
          )}

          {/* Track cumulative question number across groups */}
          {(() => { let questionCounter = 0; return questionGroups?.map((group: any, gIdx: number) => (
            <div key={group.id} className="space-y-4">
              {group.title && (
                <h3 className="font-semibold text-lg text-foreground">
                  {group.title}
                </h3>
              )}
              {group.instructions && (
                <div className="p-3 bg-white border-orange-500/50 border rounded-lg text-sm text-black font-semibold shadow-sm mb-4">
                  <div
                    dangerouslySetInnerHTML={{ __html: group.instructions }}
                  />
                </div>
              )}

              {(group.questions || []).map((question: any, qIndex: number) => {
                const isMatching = question.question_type === "matching";
                const hasPlaceholders = hasFillBlankPlaceholders(
                  question.question_text || "",
                );
                const isFillBlankLike =
                  question.question_type === "fill_blank" || hasPlaceholders;

                // Calculate how many numbers this question occupies
                let subQuestionCount = 1;
                if (isMatching) {
                  try {
                    const parsed = JSON.parse(question.correct_answer || "{}");
                    subQuestionCount = Math.max(1, (parsed.items || []).length);
                  } catch (e) {}
                } else if (isFillBlankLike) {
                  const blanks = (question.question_text || "").match(/\[BLANK(_\d+)?\]/g);
                  subQuestionCount = Math.max(1, blanks ? blanks.length : 1);
                }

                const startNumber = questionCounter + 1;
                const endNumber = questionCounter + subQuestionCount;
                questionCounter += subQuestionCount;

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
                        <span className="shrink-0 inline-flex items-center justify-center min-w-[32px] px-2 h-8 rounded-full bg-[hsl(var(--reading))] text-white text-sm font-bold shadow-sm">
                          {subQuestionCount > 1 ? `${startNumber} - ${endNumber}` : startNumber}
                        </span>
                        <div className="flex-1 space-y-3">
                          {/* Only show question text here if it's NOT a fill_blank-like question */}
                          {!isFillBlankLike &&
                            (containsHtml(question.question_text) ? (
                              <div
                                className="font-semibold text-base leading-snug prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: question.question_text,
                                }}
                              />
                            ) : (
                              <div className="font-semibold text-base leading-snug">
                                {question.question_text}
                              </div>
                            ))}

                          {question.question_audio_url && (
                            <div className="bg-muted/50 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                              <audio
                                src={question.question_audio_url}
                                controls
                                className="h-8 w-full max-w-[250px]"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-12 space-y-4">
                        {question.question_type === "multiple_choice" &&
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
                                        ? "bg-[hsl(var(--reading))]/5 border-[hsl(var(--reading))]/30 ring-1 ring-[hsl(var(--reading))]/20"
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

                        {/* Simple text input for listening/short_answer/fill_blank without placeholders */}
                        {((question.question_type === "fill_blank" &&
                          !hasFillBlankPlaceholders(
                            question.question_text,
                          )) ||
                          question.question_type === "listening" ||
                          question.question_type === "short_answer") && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Nhập câu trả lời..."
                              value={answers[question.id] || ""}
                              onChange={(e) =>
                                onAnswerChange(question.id, e.target.value)
                              }
                              className="w-full h-11"
                            />
                            <p className="text-[11px] text-muted-foreground font-medium italic">
                              Gợi ý: ONE WORD ONLY
                            </p>
                          </div>
                        )}

                        {question.question_type === "fill_blank" && hasFillBlankPlaceholders(question.question_text) && (
                          <FillBlankHtmlRenderer 
                            html={question.question_text} 
                            answers={answers[question.id] || {}} 
                            questionId={question.id} 
                            onAnswerChange={onAnswerChange} 
                          />
                        )}

                        {question.question_type === "matching" && (
                          <div className="space-y-6 pt-2">
                            {(() => {
                              try {
                                const parsedCorrectAnswer = JSON.parse(question.correct_answer || "{}");
                                const items = parsedCorrectAnswer.items || [];
                                const optionsList = parsedCorrectAnswer.options || [];
                                
                                return (
                                  <>
                                    {/* Options Legend */}
                                    <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-2">
                                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Các lựa chọn:</p>
                                      <div className="grid grid-cols-1 gap-2">
                                        {optionsList.map((opt: string, oi: number) => (
                                          <div key={oi} className="flex gap-3 text-sm">
                                            <span className="font-bold text-primary min-w-[20px]">{toRoman(oi + 1)}.</span>
                                            <span className="text-foreground/80">{opt}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Items to Match */}
                                    <div className="space-y-3">
                                      {items.map((item: string, idx: number) => {
                                        const currentMatchingAnswers = answers[question.id] ? 
                                          (typeof answers[question.id] === 'string' ? JSON.parse(answers[question.id]) : answers[question.id]) 
                                          : {};
                                          
                                        const romanOptions = optionsList.map((_: any, oi: number) => toRoman(oi + 1));

                                        return (
                                          <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center p-3 rounded-lg border bg-background border-border/50 hover:border-primary/30 transition-colors">
                                            <div className="flex-1 text-sm font-medium leading-relaxed">
                                              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary text-[10px] font-bold mr-2 mb-0.5">
                                                {startNumber + idx}
                                              </span>
                                              {item}
                                            </div>
                                            <div className="w-full sm:w-[140px] shrink-0">
                                              <DropdownSelect
                                                value={currentMatchingAnswers[String(idx)] || ""}
                                                onChange={(value) => {
                                                  const newAnswers = { ...currentMatchingAnswers, [String(idx)]: value };
                                                  onAnswerChange(question.id, JSON.stringify(newAnswers));
                                                }}
                                                options={romanOptions}
                                                placeholder="Chọn..."
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                );
                              } catch (e) {
                                return <p className="text-sm text-destructive font-medium italic">Dữ liệu câu hỏi nối bị lỗi.</p>;
                              }
                            })()}
                          </div>
                        )}

                        {question.question_type === "true_false_not_given" && (
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
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )); })()}
        </div>
      </ScrollArea>
    </div>
  );
}
