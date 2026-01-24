import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Headphones } from 'lucide-react';
import { StickyAudioPlayer } from './StickyAudioPlayer';

interface ListeningSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  strictMode?: boolean;
}

export function ListeningSection({ section, answers, onAnswerChange, strictMode = false }: ListeningSectionProps) {
  const [currentPart, setCurrentPart] = useState(0);
  const questionGroups = section.question_groups || [];

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Audio Player */}
      {section.audio_url && (
        <StickyAudioPlayer audioUrl={section.audio_url} strictMode={strictMode} />
      )}

      {/* Part Navigation */}
      {questionGroups.length > 1 && (
        <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
          {questionGroups.map((group: any, index: number) => (
            <Button
              key={group.id}
              variant={currentPart === index ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPart(index)}
              className="text-xs"
            >
              {group.title || `Part ${index + 1}`}
            </Button>
          ))}
        </div>
      )}

      {/* Questions */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-[hsl(var(--listening))] mb-6">
            <Headphones className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{section.title}</h2>
          </div>

          {section.instructions && (
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-sm text-muted-foreground">
                {section.instructions}
              </CardContent>
            </Card>
          )}

          {questionGroups[currentPart] && (
            <div className="space-y-4">
              {questionGroups[currentPart].instructions && (
                <p className="text-sm text-muted-foreground font-medium">
                  {questionGroups[currentPart].instructions}
                </p>
              )}

              {questionGroups[currentPart].questions?.map((question: any, qIndex: number) => (
                <Card key={question.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <p className="font-medium mb-3">
                      {question.order_index || qIndex + 1}. {question.question_text}
                    </p>

                    {question.question_type === 'multiple_choice' && question.options && (
                      <RadioGroup
                        value={answers[question.id] || ''}
                        onValueChange={(value) => onAnswerChange(question.id, value)}
                        className="space-y-2"
                      >
                        {(question.options as string[]).map((option: string, i: number) => (
                          <div key={i} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                            <Label htmlFor={`${question.id}-${i}`} className="flex-1 cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {question.question_type === 'fill_blank' && (
                      <Input
                        placeholder="Nhập câu trả lời..."
                        value={answers[question.id] || ''}
                        onChange={(e) => onAnswerChange(question.id, e.target.value)}
                        className="max-w-md"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
