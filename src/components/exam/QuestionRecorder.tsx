import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, CheckCircle2 } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { AudioWaveform } from "./AudioWaveform";
import { cn } from "@/lib/utils";
import { uploadsApi } from "@/lib/api";

interface QuestionRecorderProps {
  questionId: string;
  answer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
  className?: string;
}

export function QuestionRecorder({
  questionId,
  answer,
  onAnswerChange,
  className,
}: QuestionRecorderProps) {
  const [phase, setPhase] = useState<"idle" | "recording" | "review">(
    answer ? "review" : "idle",
  );
  const [recordTime, setRecordTime] = useState(0);

  const {
    isRecording,
    audioUrl,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    permissionStatus,
    requestPermission,
    analyserData,
  } = useAudioRecorder();

  const { transcript, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  const [isUploading, setIsUploading] = useState(false);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRecording]);

  // Handle recorded audio
  useEffect(() => {
    const uploadAudio = async () => {
      if (audioBlob && phase === "recording") {
        setIsUploading(true);
        try {
          // Add a small delay to ensure mediaRecorder has finished processing the blob
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const file = new File([audioBlob], `speaking_${questionId}.webm`, { type: 'audio/webm' });
          const response = await uploadsApi.uploadAudio(file);
          
          if (response?.url) {
            onAnswerChange(questionId, response.url);
          } else {
            // Fallback to blob URL if upload fails (though it will be temporary)
            onAnswerChange(questionId, audioUrl || "");
          }
        } catch (error) {
          console.error("Upload error:", error);
          onAnswerChange(questionId, audioUrl || "");
        } finally {
          setIsUploading(false);
          setPhase("review");
        }
      }
    };

    if (audioBlob && phase === "recording") {
      uploadAudio();
    }
  }, [audioBlob, phase, questionId, onAnswerChange, audioUrl]);

  const handleStartRecording = async () => {
    if (permissionStatus !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    resetRecording();
    resetTranscript();
    setRecordTime(0);
    setPhase("recording");

    await startRecording();
    startListening();
  };

  const handleStopRecording = () => {
    stopRecording();
    stopListening();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (permissionStatus === "denied") {
    return (
      <div className="text-xs text-destructive">
        Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt.
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 pt-2", className)}>
      {phase !== "recording" && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={handleStartRecording}
            disabled={isUploading}
            className="bg-[hsl(var(--speaking))] hover:bg-[hsl(var(--speaking))]/90 rounded-full px-6"
          >
            <Mic className="mr-2 h-4 w-4" />
            {answer ? "Ghi âm lại" : "Bắt đầu ghi âm"}
          </Button>

          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <div className="h-4 w-4 border-2 border-[hsl(var(--speaking))] border-t-transparent rounded-full animate-spin" />
              Đang tải lên máy chủ...
            </div>
          )}

          {answer && !isUploading && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 overflow-hidden bg-white/60 dark:bg-black/20 p-1.5 rounded-full border">
              <audio src={answer} controls className="h-8 max-w-[200px]" />
              <span className="text-[10px] font-bold text-[hsl(var(--success))] pr-3 uppercase">
                Đã trả lời
              </span>
            </div>
          )}
        </div>
      )}

      {phase === "recording" && (
        <div className="bg-white/80 dark:bg-black/40 rounded-2xl p-4 border-2 border-dashed border-[hsl(var(--speaking))]/40 space-y-4 animate-in zoom-in-95 fill-mode-both">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive animate-pulse">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Đang ghi âm...
              </span>
            </div>
            <span className="font-mono font-bold text-xl">
              {formatTime(recordTime)}
            </span>
          </div>

          <AudioWaveform
            data={analyserData}
            isRecording={true}
            className="h-12 w-full"
          />

          <div className="bg-muted/50 p-3 rounded-xl text-sm min-h-[60px] max-h-[100px] overflow-auto border italic text-muted-foreground text-left">
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

      {phase === "review" && !isRecording && (
        <div className="flex items-center gap-2 text-[hsl(var(--success))] text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 className="h-3 w-3" />
          Hoàn tất ghi âm
        </div>
      )}
    </div>
  );
}
