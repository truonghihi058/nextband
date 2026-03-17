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

const getSubQuestionCount = (q: any) => {
  if (q.question_type === "matching") {
    try {
      const parsed = JSON.parse(q.correct_answer || "{}");
      return Math.max(1, (parsed.items || []).length);
    } catch { return 1; }
  }
  const hasPlaceholders = hasFillBlankPlaceholders(q.question_text || "");
  if (q.question_type === "fill_blank" || hasPlaceholders) {
    const blanks = (q.question_text || "").match(/\[BLANK(_\d+)?\]/g);
    return Math.max(1, blanks ? blanks.length : 1);
  }
  return 1;
};

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
    .reduce((acc: number, g: any) => {
      const groupTotal = (g.questions || []).reduce((gAcc: number, q: any) => gAcc + getSubQuestionCount(q), 0);
      return acc + groupTotal;
    }, 0);

  // We'll use a local counter during rendering to handle multiple questions per block
  let runningQuestionCount = questionNumberOffset;

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Audio Player */}
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

      {/* Main Content Area */}
      {(() => {
        // We reset the counter for whichever branch is actually rendered
        let runningCount = questionNumberOffset;

        if (showTranscript && currentGroup?.passage) {
          return (
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

              {/* Right Panel - Questions */}
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

                        {currentQuestions.map((question: any) => {
                          const isCurrent = question.id === currentQuestionId;
                          const qSubCount = getSubQuestionCount(question);
                          const qStartNum = runningCount + 1;
                          const qEndNum = runningCount + qSubCount;
                          runningCount += qSubCount;

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
                                  <span className="shrink-0 inline-flex items-center justify-center min-w-[32px] px-2 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                                    {qSubCount > 1 ? `${qStartNum} - ${qEndNum}` : qStartNum}
                                  </span>
                                  <div className="flex-1 space-y-3">
                                    {hasFillBlankPlaceholders(question.question_text) ? (
                                      <FillBlankHtmlRenderer 
                                        html={question.question_text} 
                                        answers={answers[question.id] || {}} 
                                        questionId={question.id} 
                                        onAnswerChange={onAnswerChange} 
                                      />
                                    ) : (
                                      /<[^>]+>/.test(question.question_text) ? (
                                        <div
                                          className="font-semibold text-base leading-snug prose prose-sm max-w-none"
                                          dangerouslySetInnerHTML={{ __html: question.question_text }}
                                        />
                                      ) : (
                                        <p className="font-semibold text-base leading-snug">
                                          {question.question_text}
                                        </p>
                                      )
                                    )}
                                    {question.question_audio_url && (
                                      <div className="bg-muted/50 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                                        <audio src={question.question_audio_url} controls className="h-8 w-full max-w-[300px]" />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="ml-12 space-y-4">
                                  {/* Render inputs for non-placeholder questions */}
                                  {!hasFillBlankPlaceholders(question.question_text) && (
                                    <>
                                      {question.question_type === "multiple_choice" && question.options?.length > 0 && (
                                        <RadioGroup
                                          value={answers[question.id] || ""}
                                          onValueChange={(val) => onAnswerChange(question.id, val)}
                                          className="grid gap-2"
                                        >
                                          {question.options.map((opt: string, i: number) => (
                                            <div key={i} className={cn("flex items-center space-x-3 p-3 rounded-xl border", answers[question.id] === opt ? "bg-primary/5 border-primary/30" : "bg-background border-transparent hover:bg-muted/30")}>
                                              <RadioGroupItem value={opt} id={`${question.id}-${i}`} />
                                              <Label htmlFor={`${question.id}-${i}`} className="flex-1 cursor-pointer font-medium text-sm">{opt}</Label>
                                            </div>
                                          ))}
                                        </RadioGroup>
                                      )}

                                      {((question.question_type === "fill_blank") || question.question_type === "short_answer") && (
                                        <Input placeholder="Nhập câu trả lời..." value={answers[question.id] || ""} onChange={(e) => onAnswerChange(question.id, e.target.value)} className="w-full" />
                                      )}
                                    </>
                                  )}

                                  {question.question_type === "matching" && (
                                    <div className="space-y-6 pt-2">
                                      {(() => {
                                        try {
                                          const parsed = JSON.parse(question.correct_answer || "{}");
                                          const items = parsed.items || [];
                                          const optionsList = parsed.options || [];
                                          return (
                                            <>
                                              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-2">
                                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Các lựa chọn:</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                  {optionsList.map((opt: string, oi: number) => (
                                                    <div key={oi} className="flex gap-3 text-sm">
                                                      <span className="font-bold text-primary min-w-[20px]">{toRoman(oi + 1)}.</span>
                                                      <span className="text-foreground/80">{opt}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                              <div className="space-y-3">
                                                {items.map((item: string, idx: number) => {
                                                  const currentAnswers = answers[question.id] ? (typeof answers[question.id] === 'string' ? JSON.parse(answers[question.id]) : answers[question.id]) : {};
                                                  return (
                                                    <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center p-3 rounded-lg border bg-background hover:border-primary/30 transition-colors">
                                                      <div className="flex-1 text-sm font-medium">
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary text-[10px] font-bold mr-2">{qStartNum + idx}</span>
                                                        {item}
                                                      </div>
                                                      <div className="w-full sm:w-[140px] shrink-0">
                                                        <DropdownSelect value={currentAnswers[String(idx)] || ""} onChange={(v) => onAnswerChange(question.id, JSON.stringify({...currentAnswers, [String(idx)]: v}))} options={optionsList.map((_: any, oi: number) => toRoman(oi + 1))} placeholder="Chọn..." />
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </>
                                          );
                                        } catch { return null; }
                                      })()}
                                    </div>
                                  )}

                                  {(question.question_type === "true_false_not_given" || question.question_type === "yes_no_not_given") && (
                                    <div className="max-w-[200px]">
                                      <DropdownSelect
                                        value={answers[question.id] || ""}
                                        onChange={(val) => onAnswerChange(question.id, val)}
                                        options={question.question_type === "true_false_not_given" ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"]}
                                        placeholder="Chọn đáp án..."
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
          );
        } else {
          // Centered Layout
          return (
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

                      {currentQuestions.map((question: any) => {
                        const isCurrent = question.id === currentQuestionId;
                        const qSubCount = getSubQuestionCount(question);
                        const qStartNum = runningCount + 1;
                        const qEndNum = runningCount + qSubCount;
                        runningCount += qSubCount;

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
                              isCurrent ? "border-l-primary bg-primary/5 shadow-md" : "border-l-transparent"
                            )}
                            onClick={() => onQuestionFocus?.(question.id)}
                          >
                            <CardContent className="p-5">
                              <div className="flex items-start gap-4 mb-4">
                                <span className="shrink-0 inline-flex items-center justify-center min-w-[32px] px-2 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                  {qSubCount > 1 ? `${qStartNum} - ${qEndNum}` : qStartNum}
                                </span>
                                  <div className="flex-1">
                                    {hasFillBlankPlaceholders(question.question_text) ? (
                                      <FillBlankHtmlRenderer 
                                        html={question.question_text} 
                                        answers={answers[question.id] || {}} 
                                        questionId={question.id} 
                                        onAnswerChange={onAnswerChange} 
                                      />
                                    ) : (
                                      <div className="font-semibold text-base leading-snug" dangerouslySetInnerHTML={{ __html: question.question_text }} />
                                    )}
                                    {question.question_audio_url && (
                                      <audio src={question.question_audio_url} controls className="h-8 mt-2" />
                                    )}
                                  </div>
                              </div>
                              <div className="ml-12 space-y-4">
                                {question.question_type === "matching" && (
                                  <div className="space-y-6 pt-2">
                                    {(() => {
                                      try {
                                        const parsed = JSON.parse(question.correct_answer || "{}");
                                        const items = parsed.items || [];
                                        const optionsList = parsed.options || [];
                                        return (
                                          <>
                                            <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-2">
                                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Các lựa chọn:</p>
                                              <div className="grid grid-cols-1 gap-2">
                                                {optionsList.map((opt: string, oi: number) => (
                                                  <div key={oi} className="flex gap-3 text-sm">
                                                    <span className="font-bold text-primary min-w-[20px]">{toRoman(oi + 1)}.</span>
                                                    <span className="text-foreground/80">{opt}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                            <div className="space-y-3">
                                              {items.map((item: string, idx: number) => {
                                                const currentAnswers = answers[question.id] ? (typeof answers[question.id] === 'string' ? JSON.parse(answers[question.id]) : answers[question.id]) : {};
                                                return (
                                                  <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center p-3 rounded-lg border bg-background hover:border-primary/30 transition-colors">
                                                    <div className="flex-1 text-sm font-medium">
                                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary text-[10px] font-bold mr-2">{qStartNum + idx}</span>
                                                      {item}
                                                    </div>
                                                    <div className="w-full sm:w-[140px] shrink-0">
                                                      <DropdownSelect value={currentAnswers[String(idx)] || ""} onChange={(v) => onAnswerChange(question.id, JSON.stringify({...currentAnswers, [String(idx)]: v}))} options={optionsList.map((_: any, oi: number) => toRoman(oi + 1))} placeholder="Chọn..." />
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </>
                                        );
                                      } catch { return null; }
                                    })()}
                                  </div>
                                )}
                                
                                {/* Render inputs for non-placeholder questions */}
                                {!hasFillBlankPlaceholders(question.question_text) && (
                                  <>
                                    {question.question_type === "multiple_choice" && question.options?.length > 0 && (
                                      <RadioGroup
                                        value={answers[question.id] || ""}
                                        onValueChange={(val) => onAnswerChange(question.id, val)}
                                        className="grid gap-2"
                                      >
                                        {question.options.map((opt: string, i: number) => (
                                          <div key={i} className={cn("flex items-center space-x-3 p-3 rounded-xl border", answers[question.id] === opt ? "bg-primary/5 border-primary/30" : "bg-background border-transparent hover:bg-muted/30")}>
                                            <RadioGroupItem value={opt} id={`c-${question.id}-${i}`} />
                                            <Label htmlFor={`c-${question.id}-${i}`} className="flex-1 cursor-pointer font-medium text-sm">{opt}</Label>
                                          </div>
                                        ))}
                                      </RadioGroup>
                                    )}

                                    {((question.question_type === "fill_blank") || question.question_type === "short_answer") && (
                                      <Input placeholder="Nhập câu trả lời..." value={answers[question.id] || ""} onChange={(e) => onAnswerChange(question.id, e.target.value)} className="w-full" />
                                    )}

                                    {(question.question_type === "true_false_not_given" || question.question_type === "yes_no_not_given") && (
                                      <div className="max-w-[200px]">
                                        <DropdownSelect
                                          value={answers[question.id] || ""}
                                          onChange={(val) => onAnswerChange(question.id, val)}
                                          options={question.question_type === "true_false_not_given" ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"]}
                                          placeholder="Chọn đáp án..."
                                        />
                                      </div>
                                    )}
                                  </>
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
          );
        }
      })()}
    </div>
  );
}
