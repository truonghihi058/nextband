import { useState, useEffect, useCallback, useMemo, MutableRefObject } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Mic,
  MicOff,
  Play,
  Square,
  Pause,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Headphones,
  BookOpen,
} from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { AudioWaveform } from "./AudioWaveform";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DropdownSelect } from "./DropdownSelect";

interface SpeakingSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

type SpeakingPhase = "preparation" | "recording" | "review";

export function SpeakingSection({
  section,
  answers,
  onAnswerChange,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: SpeakingSectionProps) {
  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<SpeakingPhase>("preparation");
  const [prepTime, setPrepTime] = useState(60);
  const [recordTime, setRecordTime] = useState(0);
  const [maxRecordTime, setMaxRecordTime] = useState(120);

  const {
    isRecording,
    audioUrl,
    startRecording,
    stopRecording,
    resetRecording,
    permissionStatus,
    requestPermission,
    analyserData,
  } = useAudioRecorder();

  const { transcript, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

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
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
      })),
    }));
  }, [rawGroups]);

  // Flatten for calculations
  const allQuestions = useMemo(() => {
    return questionGroups.flatMap((g: any) => g.questions);
  }, [questionGroups]);

  // Timer for Preparation
  useEffect(() => {
    if (phase === "preparation" && prepTime > 0) {
      const timer = setInterval(() => {
        setPrepTime((prev) => {
          if (prev <= 1) {
            // Auto transition to recording if it's preparation phase
            // Typically for Part 2 cue cards
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, prepTime]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => {
        setRecordTime((prev) => {
          if (prev >= maxRecordTime - 1) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRecording, maxRecordTime]);

  // Handle recorded audio
  useEffect(() => {
    if (audioUrl && recordingQuestionId) {
      onAnswerChange(recordingQuestionId, audioUrl);
      // We don't reset recordingQuestionId here so the user can see/playback their answer
    }
  }, [audioUrl, recordingQuestionId, onAnswerChange]);

  const handleStartRecording = async (questionId: string) => {
    if (permissionStatus !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    // If already recording elsewhere, stop it first
    if (isRecording) {
      handleStopRecording();
    }

    resetRecording(); // Reset previous state before starting new recording
    setRecordingQuestionId(questionId);
    setRecordTime(0);
    resetTranscript();
    setPhase("recording");

    await startRecording();
    startListening();
  };

  const handleStopRecording = () => {
    stopRecording();
    stopListening();
    setPhase("review");
  };

  const handleRetry = (questionId: string) => {
    resetRecording();
    resetTranscript();
    setRecordTime(0);
    setRecordingQuestionId(questionId);
    setPhase("recording");
    // Start again immediately
    handleStartRecording(questionId);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (permissionStatus === "denied") {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Quyền truy cập microphone bị từ chối. Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
              <p className="text-sm text-muted-foreground">{section.instructions || "Thực hiện các phần thi nói dưới đây"}</p>
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
                    {group.title && <h3 className="text-xl font-bold">{group.title}</h3>}
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
                  const isBeingRecorded = isRecording && recordingQuestionId === question.id;
                  const hasAnswer = !!answers[question.id];
                  const qGlobalIndex = allQuestions.findIndex(q => q.id === question.id) + 1;

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
                          : "border-l-transparent hover:border-l-muted-foreground/30"
                      )}
                      onClick={() => onQuestionFocus?.(question.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <span className={cn(
                            "shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm transition-colors",
                            hasAnswer ? "bg-[hsl(var(--success))] text-white" : "bg-[hsl(var(--speaking))] text-white"
                          )}>
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
                                  onValueChange={(val) => onAnswerChange(question.id, val)}
                                  className="grid gap-2"
                                >
                                  {question.options.map((opt: string, i: number) => (
                                    <div key={i} className={cn(
                                      "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                                      answers[question.id] === opt ? "bg-white border-[hsl(var(--speaking))]/30 shadow-sm" : "bg-transparent border-transparent hover:bg-white/50"
                                    )}>
                                      <RadioGroupItem value={opt} id={`${question.id}-${i}`} />
                                      <Label htmlFor={`${question.id}-${i}`} className="flex-1 cursor-pointer font-medium">
                                        <span className="text-muted-foreground mr-2 text-xs font-bold">{String.fromCharCode(65 + i)}.</span>
                                        {opt}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              )}

                              {(question.question_type === "speaking" || question.question_type === "essay") && (
                                <div className="space-y-4 pt-2">
                                  {/* Individual Recorder UI */}
                                  {!isBeingRecorded && !(hasAnswer && recordingQuestionId === question.id && phase === "review") ? (
                                    <div className="flex flex-wrap items-center gap-3">
                                      <Button
                                        size="sm"
                                        onClick={() => handleStartRecording(question.id)}
                                        className="bg-[hsl(var(--speaking))] hover:bg-[hsl(var(--speaking))]/90 rounded-full px-6"
                                      >
                                        <Mic className="mr-2 h-4 w-4" />
                                        {hasAnswer ? "Ghi âm lại" : "Bắt đầu ghi âm"}
                                      </Button>

                                      {hasAnswer && (
                                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 overflow-hidden bg-white/60 dark:bg-black/20 p-1.5 rounded-full border">
                                          <audio src={answers[question.id]} controls className="h-8 max-w-[200px]" />
                                          <span className="text-[10px] font-bold text-[hsl(var(--success))] pr-3 uppercase">Đã trả lời</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : null}

                                  {/* Active Recording UI */}
                                  {isBeingRecorded && (
                                    <div className="bg-white/80 dark:bg-black/40 rounded-2xl p-4 border-2 border-dashed border-[hsl(var(--speaking))]/40 space-y-4 animate-in zoom-in-95 fill-mode-both">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-destructive animate-pulse">
                                          <div className="w-2 h-2 rounded-full bg-destructive" />
                                          <span className="text-xs font-bold uppercase tracking-wider">Đang ghi âm...</span>
                                        </div>
                                        <span className="font-mono font-bold text-xl">{formatTime(recordTime)}</span>
                                      </div>

                                      <AudioWaveform data={analyserData} isRecording={true} className="h-12 w-full" />

                                      <div className="bg-muted/50 p-3 rounded-xl text-sm min-h-[60px] max-h-[100px] overflow-auto border italic text-muted-foreground">
                                        {transcript || "Đang chuyển giọng nói thành văn bản..."}
                                      </div>

                                      <Button
                                        onClick={handleStopRecording}
                                        variant="destructive"
                                        className="w-full rounded-xl"
                                      >
                                        <Square className="mr-2 h-4 w-4" /> Dừng ghi và lưu
                                      </Button>
                                    </div>
                                  )}

                                  {/* Local Review UI (Just finished recording) */}
                                  {!isRecording && recordingQuestionId === question.id && phase === "review" && (
                                    <div className="bg-[hsl(var(--success))]/5 rounded-2xl p-4 border border-[hsl(var(--success))]/20 space-y-4 animate-in slide-in-from-top-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[hsl(var(--success))]">
                                          <CheckCircle2 className="h-4 w-4" />
                                          <span className="text-xs font-bold uppercase tracking-wider">Hoàn tất ghi âm</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleRetry(question.id)} className="text-xs h-7">
                                          Ghi lại
                                        </Button>
                                      </div>
                                      <audio src={answers[question.id]} controls className="w-full h-10" />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Generic input for others */}
                              {!["multiple_choice", "speaking", "essay"].includes(question.question_type) && (
                                <Input
                                  placeholder="Nhập câu trả lời..."
                                  value={answers[question.id] || ""}
                                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                                  className="max-w-md h-11"
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

