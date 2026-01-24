import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Square } from 'lucide-react';

interface SpeakingSectionProps {
  section: any;
}

export function SpeakingSection({ section }: SpeakingSectionProps) {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-speaking">
          <Mic className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{section.title}</h2>
        </div>

        {section.instructions && (
          <Card className="bg-muted/30">
            <CardContent className="p-4 text-sm text-muted-foreground">
              {section.instructions}
            </CardContent>
          </Card>
        )}

        {/* Speaking Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chủ đề</CardTitle>
          </CardHeader>
          <CardContent>
            {section.prompt_text && (
              <p className="whitespace-pre-wrap text-lg">{section.prompt_text}</p>
            )}
          </CardContent>
        </Card>

        {/* Recording Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ghi âm</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
              isRecording ? 'bg-destructive animate-pulse' : 'bg-speaking'
            }`}>
              {isRecording ? (
                <MicOff className="h-10 w-10 text-white" />
              ) : (
                <Mic className="h-10 w-10 text-white" />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Dừng ghi
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Bắt đầu ghi
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {isRecording 
                ? 'Đang ghi âm... Nhấn "Dừng ghi" khi hoàn thành.'
                : 'Nhấn "Bắt đầu ghi" để ghi âm câu trả lời của bạn.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
