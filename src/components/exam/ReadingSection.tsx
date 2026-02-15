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

interface ReadingSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

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
  ).map((g: any) => ({
    ...g,
    questions: (g.questions || []).map((q: any) => ({
      ...q,
      question_text: q.question_text || q.questionText || "",
      question_type: q.question_type || q.questionType || "short_answer",
      order_index: q.order_index ?? q.orderIndex ?? 0,
      correct_answer: q.correct_answer || q.correctAnswer || null,
    })),
  }));

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
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x relative">
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
              <p className="whitespace-pre-wrap leading-relaxed text-foreground select-text">
                {renderHighlightedText()}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Right - Questions */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-6 space-y-6">
          {section.instructions && (
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-sm text-muted-foreground">
                {section.instructions}
              </CardContent>
            </Card>
          )}

          {questionGroups?.map((group: any, gIdx: number) => (
            <div key={group.id} className="space-y-4">
              {group.title && (
                <h3 className="font-semibold text-lg text-foreground">
                  {group.title}
                </h3>
              )}
              {group.instructions && (
                <p className="text-sm text-muted-foreground">
                  {group.instructions}
                </p>
              )}

              {group.questions
                ?.sort(
                  (a: any, b: any) =>
                    (b.order_index || 0) - (a.order_index || 0),
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
                        "transition-all hover:shadow-md",
                        isCurrent && "ring-2 ring-primary shadow-lg",
                      )}
                      onClick={() => onQuestionFocus?.(question.id)}
                    >
                      <CardContent className="p-4">
                        <p className="font-medium mb-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[hsl(var(--reading))] text-white text-sm font-bold mr-2">
                            {question.order_index || qIndex + 1}
                          </span>
                          {/* Only show question text here if it's NOT a fill_blank with placeholders (which renders its own text) */}
                          {!(
                            question.question_type === "fill_blank" &&
                            (question.question_text.includes("_____") ||
                              question.question_text.includes("[BLANK]"))
                          ) && question.question_text}
                        </p>

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
                                      {option}
                                    </Label>
                                  </div>
                                ),
                              )}
                            </RadioGroup>
                          )}

                        {(question.question_type === "fill_blank" ||
                          question.question_type === "short_answer") && (
                          <div className="ml-9">
                            {question.question_type === "fill_blank" &&
                            (question.question_text.includes("_____") ||
                              question.question_text.includes("[BLANK]")) ? (
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
                              /* Standard rendering for short_answer or fill_blank without placeholders */
                              <div>
                                <Input
                                  placeholder="Nhập câu trả lời..."
                                  value={answers[question.id] || ""}
                                  onChange={(e) =>
                                    onAnswerChange(question.id, e.target.value)
                                  }
                                  className="max-w-md"
                                />
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  ONE WORD ONLY
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {question.question_type === "true_false_not_given" && (
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
