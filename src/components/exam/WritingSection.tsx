import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface WritingSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  timeRemaining?: number;
}

export function WritingSection({
  section,
  answers,
  onAnswerChange,
  timeRemaining,
}: WritingSectionProps) {
  const rawGroups = section.question_groups || section.questionGroups || [];

  // Normalize question fields
  const questionGroups = rawGroups.map((g: any) => ({
    ...g,
    questions: (g.questions || []).map((q: any) => ({
      ...q,
      question_text: q.question_text || q.questionText || "",
      question_audio_url:
        q.audioUrl || q.audio_url || q.question_audio_url || null,
      order_index: q.order_index ?? q.orderIndex ?? 0,
      image_url: q.imageUrl || q.image_url || null,
    })),
  }));

  const firstQuestion = questionGroups[0]?.questions?.[0];

  // Use a consolidated prompt text
  const promptText = section.prompt_text || firstQuestion?.question_text || "";
  const imageUrl = section.image_url || firstQuestion?.image_url || "";
  const instructions =
    section.instructions || questionGroups[0]?.instructions || "";

  const taskId = firstQuestion?.id || section.id;
  const text = answers[taskId] || "";
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save simulation
  useEffect(() => {
    if (text) {
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
  }, [text]);

  const handleZoomIn = () => setImageZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () =>
    setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setImageZoom(1);

  const getMinWords = () => {
    // Task 1: 150 words, Task 2: 250 words
    const title = section.title?.toLowerCase() || "";
    if (title.includes("task 1") || title.includes("part 1")) return 150;
    return 250;
  };

  const minWords = getMinWords();
  const wordProgress = Math.min((wordCount / minWords) * 100, 100);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x overflow-hidden">
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
                    onClick={handleZoomOut}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleZoomReset}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleZoomIn}
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

      {/* Right - Writing Area */}
      <div className="p-6 flex flex-col bg-background">
        <div className="max-w-3xl mx-auto flex-1 flex flex-col w-full">
          <Card className="flex-1 flex flex-col shadow-lg border-muted/30">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                NHẬP BÀI VIẾT TẠI ĐÂY
              </CardTitle>
              <div className="flex items-center gap-3">
                {lastSaved && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                    <Save className="h-3 w-3 text-primary" />
                    Đã lưu {lastSaved.toLocaleTimeString("vi-VN")}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      "https://docs.google.com/document/create",
                      "_blank",
                    )
                  }
                  className="gap-1.5 text-xs h-8 border-primary/20 hover:bg-primary/5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Docs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <Textarea
                placeholder="Bắt đầu viết bài của bạn tại đây..."
                value={text}
                onChange={(e) => onAnswerChange(taskId, e.target.value)}
                className="flex-1 min-h-[400px] resize-none border-0 rounded-none focus-visible:ring-0 p-8 text-lg leading-relaxed font-serif"
              />
            </CardContent>
            <div className="border-t p-4 flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    SỐ TỪ:
                  </span>
                  <span
                    className={`text-xl font-bold ${wordCount >= minWords ? "text-green-600" : "text-primary"}`}
                  >
                    {wordCount}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground opacity-50">
                    / {minWords}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-1 max-w-[200px]">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden border border-muted shadow-inner">
                  <div
                    className={`h-full transition-all duration-700 ${wordCount >= minWords ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]"}`}
                    style={{ width: `${wordProgress}%` }}
                  />
                </div>
                {wordCount >= minWords && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    PASS
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
