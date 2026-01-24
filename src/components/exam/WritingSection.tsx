import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PenTool, ZoomIn, ZoomOut, RotateCcw, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface WritingSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  timeRemaining?: number;
}

export function WritingSection({ section, answers, onAnswerChange, timeRemaining }: WritingSectionProps) {
  const taskId = section.id;
  const text = answers[taskId] || '';
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save every 30 seconds
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

  const handleZoomIn = () => setImageZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setImageZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setImageZoom(1);

  const getMinWords = () => {
    // Task 1: 150 words, Task 2: 250 words
    const title = section.title?.toLowerCase() || '';
    if (title.includes('task 1') || title.includes('part 1')) return 150;
    return 250;
  };

  const minWords = getMinWords();
  const wordProgress = Math.min((wordCount / minWords) * 100, 100);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
      {/* Left - Task Prompt */}
      <div className="p-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-[hsl(var(--writing))]">
            <PenTool className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{section.title}</h2>
          </div>

          {/* Prompt Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Đề bài</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.prompt_text && (
                <p className="whitespace-pre-wrap">{section.prompt_text}</p>
              )}
              {section.instructions && (
                <p className="text-sm text-muted-foreground border-t pt-4">
                  {section.instructions}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Image with zoom (for Task 1 charts/maps) */}
          {section.image_url && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Hình ảnh</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomReset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="overflow-auto cursor-zoom-in border rounded-lg">
                      <img
                        src={section.image_url}
                        alt="Task image"
                        style={{ transform: `scale(${imageZoom})`, transformOrigin: 'top left' }}
                        className="transition-transform"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <img src={section.image_url} alt="Task image" className="w-full" />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right - Writing Area */}
      <div className="p-6 flex flex-col">
        <div className="max-w-2xl mx-auto flex-1 flex flex-col w-full">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-3 border-b">
              <CardTitle className="text-base">Bài viết của bạn</CardTitle>
              <div className="flex items-center gap-4">
                {lastSaved && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Save className="h-3 w-3" />
                    Đã lưu {lastSaved.toLocaleTimeString('vi-VN')}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <Textarea
                placeholder="Bắt đầu viết bài của bạn tại đây..."
                value={text}
                onChange={(e) => onAnswerChange(taskId, e.target.value)}
                className="flex-1 min-h-[400px] resize-none border-0 rounded-none focus-visible:ring-0"
              />
            </CardContent>
            <div className="border-t p-3 flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Số từ:</span>
                  <span className={`font-semibold ${wordCount >= minWords ? 'text-[hsl(var(--success))]' : 'text-foreground'}`}>
                    {wordCount}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {minWords} tối thiểu</span>
                </div>
              </div>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${wordCount >= minWords ? 'bg-[hsl(var(--success))]' : 'bg-primary'}`}
                  style={{ width: `${wordProgress}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
