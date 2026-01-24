import { RefObject, MutableRefObject } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DropdownSelect } from './DropdownSelect';

interface GrammarSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

export function GrammarSection({ 
  section, 
  answers, 
  onAnswerChange,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: GrammarSectionProps) {
  const questionGroups = section.question_groups || [];
  
  // Flatten all questions
  const allQuestions = questionGroups.flatMap((g: any, gIdx: number) => 
    (g.questions || []).map((q: any, qIdx: number) => ({
      ...q,
      groupId: g.id,
      groupTitle: g.title,
      groupInstructions: g.instructions,
      isFirstInGroup: qIdx === 0,
    }))
  );

  return (
    <div className="h-full overflow-auto">
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{section.title}</h2>
          </div>

          {section.instructions && (
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-sm text-muted-foreground">
                {section.instructions}
              </CardContent>
            </Card>
          )}

          {/* Questions */}
          <div className="space-y-4">
            {allQuestions.map((question: any, qIndex: number) => {
              const isCurrent = question.id === currentQuestionId;
              
              return (
                <div key={question.id}>
                  {/* Group Header */}
                  {question.isFirstInGroup && question.groupTitle && (
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg">{question.groupTitle}</h3>
                      {question.groupInstructions && (
                        <p className="text-sm text-muted-foreground mt-1">{question.groupInstructions}</p>
                      )}
                    </div>
                  )}

                  <Card 
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
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-2">
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
                                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
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

                      {question.question_type === 'yes_no_not_given' && (
                        <div className="ml-9">
                          <DropdownSelect
                            value={answers[question.id] || ''}
                            onChange={(value) => onAnswerChange(question.id, value)}
                            options={['YES', 'NO', 'NOT GIVEN']}
                            placeholder="Chọn đáp án"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
