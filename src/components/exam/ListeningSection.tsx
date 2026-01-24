import { useState, MutableRefObject } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Headphones } from 'lucide-react';
import { StickyAudioPlayer } from './StickyAudioPlayer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DropdownSelect } from './DropdownSelect';

interface ListeningSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  strictMode?: boolean;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

export function ListeningSection({ 
  section, 
  answers, 
  onAnswerChange, 
  strictMode = false,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: ListeningSectionProps) {
  const [currentPart, setCurrentPart] = useState(0);
  const questionGroups = section.question_groups || [];

  // Get current part questions
  const currentGroup = questionGroups[currentPart];
  const currentQuestions = currentGroup?.questions || [];

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

      {/* Split-screen layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x overflow-hidden">
        {/* Left Panel - Transcript/Passage (if available) */}
        {currentGroup?.passage && (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-6">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold mb-4">Transcript</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                  {currentGroup.passage}
                </p>
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Right Panel - Questions */}
        <ScrollArea className={cn(
          "h-[calc(100vh-280px)]",
          !currentGroup?.passage && "lg:col-span-2"
        )}>
          <div className="p-6">
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

              {currentGroup && (
                <div className="space-y-4">
                  {currentGroup.instructions && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {currentGroup.instructions}
                    </p>
                  )}

                  {currentQuestions.map((question: any, qIndex: number) => {
                    const isCurrent = question.id === currentQuestionId;
                    
                    return (
                      <Card 
                        key={question.id}
                        ref={(el) => {
                          if (el && questionRefs) {
                            questionRefs.current.set(question.id, el);
                          }
                        }}
                        className={cn(
                          'transition-all',
                          isCurrent && 'ring-2 ring-primary shadow-lg'
                        )}
                        onClick={() => onQuestionFocus?.(question.id)}
                      >
                        <CardContent className="p-4">
                          <p className="font-medium mb-3">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[hsl(var(--listening))] text-white text-sm font-bold mr-2">
                              {question.order_index || qIndex + 1}
                            </span>
                            {question.question_text}
                          </p>

                          {question.question_type === 'multiple_choice' && question.options && (
                            <RadioGroup
                              value={answers[question.id] || ''}
                              onValueChange={(value) => onAnswerChange(question.id, value)}
                              className="space-y-2 ml-9"
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
                            <div className="ml-9">
                              <Input
                                placeholder="Nhập câu trả lời..."
                                value={answers[question.id] || ''}
                                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                                className="max-w-md"
                              />
                              <p className="text-xs text-muted-foreground mt-1 italic">ONE WORD ONLY</p>
                            </div>
                          )}

                          {question.question_type === 'true_false_not_given' && (
                            <div className="ml-9">
                              <DropdownSelect
                                value={answers[question.id] || ''}
                                onChange={(value) => onAnswerChange(question.id, value)}
                                options={['TRUE', 'FALSE', 'NOT GIVEN']}
                                placeholder="Chọn đáp án"
                              />
                            </div>
                          )}
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
    </div>
  );
}
