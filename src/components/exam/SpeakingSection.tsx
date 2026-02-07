import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Play, Square, Pause, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioWaveform } from './AudioWaveform';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SpeakingSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
}

type SpeakingPhase = 'preparation' | 'recording' | 'review';

export function SpeakingSection({ section, answers, onAnswerChange }: SpeakingSectionProps) {
  const [currentPart, setCurrentPart] = useState(0);
  const [phase, setPhase] = useState<SpeakingPhase>('preparation');
  const [prepTime, setPrepTime] = useState(60); // 1 minute preparation
  const [recordTime, setRecordTime] = useState(0);
  const [maxRecordTime, setMaxRecordTime] = useState(120); // 2 minutes max
  
  const {
    isRecording,
    audioUrl,
    audioBlob,
    duration,
    analyserData,
    startRecording,
    stopRecording,
    resetRecording,
    permissionStatus,
    requestPermission,
  } = useAudioRecorder();

  const questionGroups = section.question_groups || [];
  const currentGroup = questionGroups[currentPart];
  const isPart2 = currentGroup?.title?.toLowerCase().includes('part 2') || currentPart === 1;

  // Preparation timer for Part 2
  useEffect(() => {
    if (phase === 'preparation' && isPart2 && prepTime > 0) {
      const timer = setInterval(() => {
        setPrepTime(prev => {
          if (prev <= 1) {
            setPhase('recording');
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, isPart2, prepTime]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => {
        setRecordTime(prev => {
          if (prev >= maxRecordTime - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRecording, maxRecordTime, stopRecording]);

  // Save audio URL when recording stops
  // Use the first question's ID in the group as the answer key (valid FK reference)
  useEffect(() => {
    if (audioUrl && currentGroup) {
      const firstQuestion = currentGroup.questions?.[0];
      const answerId = firstQuestion?.id || currentGroup.id;
      onAnswerChange(answerId, audioUrl);
    }
  }, [audioUrl, currentGroup, onAnswerChange]);

  const handleStartRecording = async () => {
    if (permissionStatus !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    setRecordTime(0);
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
    setPhase('review');
  };

  const handleNextPart = () => {
    if (currentPart < questionGroups.length - 1) {
      setCurrentPart(prev => prev + 1);
      setPhase('preparation');
      setPrepTime(60);
      setRecordTime(0);
      resetRecording();
    }
  };

  const handleRetry = () => {
    resetRecording();
    setPhase(isPart2 ? 'preparation' : 'recording');
    setPrepTime(60);
    setRecordTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (permissionStatus === 'denied') {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Quyền truy cập microphone bị từ chối. Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt để tiếp tục phần Speaking.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[hsl(var(--speaking))]">
            <Mic className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{section.title}</h2>
          </div>
          
          {/* Part Navigation */}
          <div className="flex items-center gap-2">
            {questionGroups.map((_: any, index: number) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index === currentPart
                    ? 'bg-[hsl(var(--speaking))] text-white'
                    : index < currentPart
                    ? 'bg-[hsl(var(--success))] text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentPart ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Permission Request */}
        {permissionStatus === 'prompt' && (
          <Alert>
            <Mic className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Cho phép truy cập microphone để ghi âm câu trả lời.</span>
              <Button size="sm" onClick={requestPermission}>
                Cho phép
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {currentGroup && (
          <>
            {/* Prompt Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {currentGroup.title || `Part ${currentPart + 1}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentGroup.questions?.map((question: any, index: number) => (
                  <div key={question.id} className="p-4 bg-muted/50 rounded-lg">
                    <p className="whitespace-pre-wrap text-lg">
                      {index + 1}. {question.question_text}
                    </p>
                  </div>
                ))}
                
                {currentGroup.instructions && (
                  <p className="text-sm text-muted-foreground border-t pt-4">
                    {currentGroup.instructions}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recording Interface */}
            <Card>
              <CardContent className="p-6">
                {/* Preparation Phase (Part 2) */}
                {phase === 'preparation' && isPart2 && (
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-bold text-[hsl(var(--speaking))]">
                      {formatTime(prepTime)}
                    </div>
                    <p className="text-muted-foreground">
                      Thời gian chuẩn bị - Hãy đọc kỹ câu hỏi
                    </p>
                    <Progress value={((60 - prepTime) / 60) * 100} className="h-2" />
                  </div>
                )}

                {/* Recording Phase */}
                {(phase === 'recording' || (phase === 'preparation' && !isPart2)) && permissionStatus === 'granted' && (
                  <div className="flex flex-col items-center gap-6">
                    <AudioWaveform data={analyserData} isRecording={isRecording} className="w-full" />
                    
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">
                        {formatTime(recordTime)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Thời gian tối đa: {formatTime(maxRecordTime)}
                      </p>
                    </div>

                    <Progress value={(recordTime / maxRecordTime) * 100} className="h-2 w-full" />

                    <div className="flex items-center gap-4">
                      {!isRecording ? (
                        <Button
                          size="lg"
                          className="bg-[hsl(var(--speaking))] hover:bg-[hsl(var(--speaking))]/90"
                          onClick={handleStartRecording}
                        >
                          <Mic className="mr-2 h-5 w-5" />
                          Bắt đầu ghi
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant="destructive"
                          onClick={handleStopRecording}
                        >
                          <Square className="mr-2 h-5 w-5" />
                          Dừng ghi
                        </Button>
                      )}
                    </div>

                    {isRecording && (
                      <div className="flex items-center gap-2 text-destructive animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        <span>Đang ghi âm...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Review Phase */}
                {phase === 'review' && audioUrl && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-2 text-[hsl(var(--success))]">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Đã ghi âm xong</span>
                    </div>

                    <audio controls src={audioUrl} className="w-full" />

                    <div className="flex items-center justify-center gap-4">
                      <Button variant="outline" onClick={handleRetry}>
                        Ghi lại
                      </Button>
                      {currentPart < questionGroups.length - 1 && (
                        <Button onClick={handleNextPart}>
                          Phần tiếp theo
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
