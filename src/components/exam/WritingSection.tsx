import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PenTool,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownSelect } from "./DropdownSelect";
import {
  FillBlankHtmlRenderer,
  hasFillBlankPlaceholders,
} from "./FillBlankHtmlRenderer";
import { MatchingRenderer } from "./MatchingRenderer";
import { cn } from "@/lib/utils";

interface WritingSectionProps {
  section: any;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  timeRemaining?: number;
}

const countWords = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

const getMinWords = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("task 1") || lower.includes("part 1")) return 150;
  return 250;
};

export function WritingSection({
  section,
  answers,
  onAnswerChange,
}: WritingSectionProps) {
  const rawGroups = section.question_groups || section.questionGroups || [];

  // Normalize question fields
  const questionGroups = rawGroups
    .map((g: any) => ({
      ...g,
      questions: (g.questions || [])
        .map((q: any) => ({
          ...q,
          question_text: q.question_text || q.questionText || "",
          question_type: q.question_type || q.questionType || "essay",
          question_audio_url:
            q.audioUrl || q.audio_url || q.question_audio_url || null,
          order_index: q.order_index ?? q.orderIndex ?? 0,
          image_url: q.imageUrl || q.image_url || null,
          options: q.options
            ? typeof q.options === "string"
              ? JSON.parse(q.options)
              : q.options
            : [],
          correct_answer: q.correct_answer || q.correctAnswer || null,
        }))
        .sort((a: any, b: any) => {
          const orderDiff = (a.order_index || 0) - (b.order_index || 0);
          if (orderDiff !== 0) return orderDiff;
          return new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime();
        }),
    }))
    .sort((a: any, b: any) => {
      const orderDiff =
        (a.order_index || a.orderIndex || 0) -
        (b.order_index || b.orderIndex || 0);
      if (orderDiff !== 0) return orderDiff;
      return new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime();
    });

  const allQuestions = useMemo(
    () =>
      questionGroups.flatMap((group: any) =>
        (group.questions || []).map((q: any) => ({
          ...q,
          groupTitle: group.title,
          groupInstructions: group.instructions,
        })),
      ),
    [questionGroups],
  );

  const primaryQuestionId = allQuestions[0]?.id || section.id;
  const primaryText = answers[primaryQuestionId] || "";
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save indicator based on first question text
  useEffect(() => {
    if (primaryText) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        setLastSaved(new Date());
      }, 30000);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [primaryText]);

  const firstQuestion = allQuestions[0];
  const promptText =
    section.prompt_text || firstQuestion?.question_text || section.title || "";
  const imageUrl =
    section.image_url ||
    firstQuestion?.image_url ||
    questionGroups[0]?.image_url ||
    "";
  const instructions =
    section.instructions || questionGroups[0]?.instructions || "";

  const renderAnswerField = (question: any) => {
    const value = answers[question.id] || "";
    const wordCount = countWords(typeof value === "string" ? value : "");
    const minWords = getMinWords(section.title || "");

    // Essay block with word progress
    if (question.question_type === "essay") {
      const progress = Math.min((wordCount / minWords) * 100, 100);
      return (
        <div className="space-y-3">
          <Textarea
            placeholder="Nhập bài viết..."
            value={value}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            rows={8}
            className="resize-y shadow-sm"
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm font-semibold">
              <span>Số từ:</span>
              <span
                className={wordCount >= minWords ? "text-green-600" : "text-primary"}
              >
                {wordCount}
              </span>
              <span className="text-xs text-muted-foreground">/ {minWords}</span>
            </div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[220px]">
              <div
                className={`h-full transition-all ${wordCount >= minWords ? "bg-green-500" : "bg-primary"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (
      question.question_type === "multiple_choice" &&
      question.options &&
      question.options.length > 0
    ) {
      const selectedValues = Array.isArray(value)
        ? value
        : value
          ? [value]
          : [];
      const hasMultipleCorrect =
        typeof question.correct_answer === "string" &&
        question.correct_answer
          .split("|")
          .map((v: string) => v.trim())
          .filter(Boolean).length > 1;

      if (hasMultipleCorrect) {
        return (
          <div className="grid gap-2">
            {question.options.map((opt: string, idx: number) => {
              const checked = selectedValues.includes(opt);
              return (
                <label
                  key={idx}
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
                      const nextValues = new Set(selectedValues);
                      if (next) nextValues.add(opt);
                      else nextValues.delete(opt);
                      onAnswerChange(question.id, Array.from(nextValues));
                    }}
                  />
                  <span className="font-medium text-sm">{opt}</span>
                </label>
              );
            })}
          </div>
        );
      }

      return (
        <RadioGroup
          value={selectedValues[0] || ""}
          onValueChange={(v) => onAnswerChange(question.id, v)}
          className="grid gap-2"
        >
          {question.options.map((opt: string, idx: number) => (
            <div
              key={idx}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                value === opt
                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                  : "bg-background border-transparent hover:bg-muted/30",
              )}
            >
              <RadioGroupItem value={opt} id={`${question.id}-${idx}`} />
              <Label
                htmlFor={`${question.id}-${idx}`}
                className="flex-1 cursor-pointer font-medium text-sm"
              >
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    if (
      question.question_type === "fill_blank" &&
      hasFillBlankPlaceholders(question.question_text)
    ) {
      return (
        <FillBlankHtmlRenderer
          html={question.question_text}
          answers={value || {}}
          questionId={question.id}
          onAnswerChange={onAnswerChange}
        />
      );
    }

    if (question.question_type === "fill_blank") {
      return (
        <Textarea
          placeholder="Nhập câu trả lời/điền chỗ trống..."
          value={value}
          onChange={(e) => onAnswerChange(question.id, e.target.value)}
          rows={4}
          className="shadow-sm"
        />
      );
    }

    if (question.question_type === "short_answer") {
      return (
        <Input
          placeholder="Nhập câu trả lời ngắn..."
          value={value}
          onChange={(e) => onAnswerChange(question.id, e.target.value)}
          className="max-w-xl h-11"
        />
      );
    }

    if (
      question.question_type === "true_false_not_given" ||
      question.question_type === "yes_no_not_given"
    ) {
      return (
        <div className="max-w-[220px]">
          <DropdownSelect
            value={value || ""}
            onChange={(v) => onAnswerChange(question.id, v)}
            options={
              question.question_type === "true_false_not_given"
                ? ["TRUE", "FALSE", "NOT GIVEN"]
                : ["YES", "NO", "NOT GIVEN"]
            }
            placeholder="Chọn đáp án"
          />
        </div>
      );
    }

    if (question.question_type === "matching") {
      return (
        <MatchingRenderer
          question={question}
          answers={answers}
          onAnswerChange={onAnswerChange}
        />
      );
    }

    // Fallback: textarea for any other structured response
    return (
      <Textarea
        placeholder="Nhập câu trả lời..."
        value={value}
        onChange={(e) => onAnswerChange(question.id, e.target.value)}
        rows={6}
        className="shadow-sm"
      />
    );
  };

  return (
    <div className="h-full grid grid-cols-1 overflow-hidden">
      {/* Left - Task Prompt */}
      <div className="p-6 overflow-auto bg-muted/5">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-[hsl(var(--writing))] mb-4">
            <PenTool className="h-5 w-5" />
            <h2 className="text-xl font-bold">{section.title}</h2>
          </div>

          {/* Prompt Card */}
          <Card className="shadow-sm border-muted/50">
            <CardHeader className="py-4 bg-muted/20 border-b">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                ĐỀ BÀI (QUESTION PROMPT)
              </CardTitle>
            </CardHeader>
            <CardContent className="py-6 space-y-4">
              {promptText &&
                (/<[^>]+>/.test(promptText) ? (
                  <div
                    className="prose prose-sm max-w-none text-foreground leading-relaxed font-medium text-base"
                    dangerouslySetInnerHTML={{ __html: promptText }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed font-medium text-base">
                    {promptText}
                  </p>
                ))}
              {instructions && (
                <div className="p-4 bg-white border-orange-500 border rounded-xl text-black font-medium shadow-sm leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: instructions }} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image with zoom (for Task 1 charts/maps) */}
          {imageUrl && (
            <Card className="shadow-sm border-muted/50 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-muted/20 border-b">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  HÌNH ẢNH MINH HỌA
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setImageZoom((prev) => Math.max(prev - 0.25, 0.5))
                    }
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setImageZoom(1)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setImageZoom((prev) => Math.min(prev + 0.25, 3))
                    }
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="overflow-auto cursor-zoom-in border rounded-lg bg-white p-4 shadow-inner min-h-[200px] flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt="Task image"
                        style={{
                          transform: `scale(${imageZoom})`,
                          transformOrigin: "center center",
                        }}
                        className="transition-transform max-w-full h-auto drop-shadow-md"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
                    <img
                      src={imageUrl}
                      alt="Task image"
                      className="w-full h-auto"
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right - Questions */}
      <div className="p-6 flex flex-col bg-background">
        <div className="max-w-3xl mx-auto flex-1 flex flex-col w-full space-y-5">
          {lastSaved && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-end">
              <Save className="h-3 w-3 text-primary" />
              Đã lưu {lastSaved.toLocaleTimeString("vi-VN")}
            </div>
          )}

          {questionGroups.map((group: any, gIdx: number) => (
            <div key={group.id || gIdx} className="space-y-4">
              {(group.title || group.instructions) && (
                <div className="space-y-1">
                  {group.title && (
                    <h3 className="font-semibold text-lg text-foreground">
                      {group.title}
                    </h3>
                  )}
                  {group.instructions && (
                    <div
                      className="p-3 bg-white border-orange-500/50 border rounded-lg text-sm text-black font-semibold shadow-sm"
                      dangerouslySetInnerHTML={{ __html: group.instructions }}
                    />
                  )}
                </div>
              )}

              {(group.questions || []).map((question: any, index: number) => {
                const displayIndex =
                  question.order_index || index + 1;

                return (
                  <Card
                    key={question.id || index}
                    className="transition-all duration-300 border-l-4 border-l-transparent hover:border-l-muted-foreground/30 hover:shadow-sm"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                          {displayIndex}
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
                                <PenTool className="h-4 w-4 text-primary" />
                              </div>
                              <audio
                                src={question.question_audio_url}
                                controls
                                className="h-8 w-full max-w-[300px]"
                              />
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Audio
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-12 space-y-4">
                        {renderAnswerField(question)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
