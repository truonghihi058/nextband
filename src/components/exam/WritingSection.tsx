import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PenTool } from 'lucide-react';

interface WritingSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
}

export function WritingSection({ section, answers, onAnswerChange }: WritingSectionProps) {
  const taskId = section.id;
  const text = answers[taskId] || '';
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-writing">
          <PenTool className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{section.title}</h2>
        </div>

        {/* Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Đề bài</CardTitle>
          </CardHeader>
          <CardContent>
            {section.prompt_text && (
              <p className="whitespace-pre-wrap">{section.prompt_text}</p>
            )}
            {section.instructions && (
              <p className="mt-4 text-sm text-muted-foreground">{section.instructions}</p>
            )}
          </CardContent>
        </Card>

        {/* Writing Area */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Bài viết của bạn</CardTitle>
            <div className="text-sm text-muted-foreground">
              Số từ: <span className="font-medium text-foreground">{wordCount}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Bắt đầu viết bài của bạn tại đây..."
              value={text}
              onChange={(e) => onAnswerChange(taskId, e.target.value)}
              className="min-h-[400px] resize-none"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
