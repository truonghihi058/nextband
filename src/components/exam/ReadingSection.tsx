import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReadingSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
}

export function ReadingSection({ section, answers, onAnswerChange }: ReadingSectionProps) {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
      {/* Left - Passage */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-6">
          <div className="flex items-center gap-2 text-reading mb-4">
            <BookOpen className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{section.title}</h2>
          </div>
          
          {section.passage_text && (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                {section.passage_text}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Right - Questions */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-6 space-y-6">
          {section.instructions && (
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-sm text-muted-foreground">
                {section.instructions}
              </CardContent>
            </Card>
          )}

          {section.question_groups?.map((group: any) => (
            <div key={group.id} className="space-y-4">
              {group.title && (
                <h3 className="font-medium text-foreground">{group.title}</h3>
              )}

              {group.questions?.map((question: any, qIndex: number) => (
                <Card key={question.id}>
                  <CardContent className="p-4">
                    <p className="font-medium mb-3">
                      {question.order_index || qIndex + 1}. {question.question_text}
                    </p>

                    {question.question_type === 'multiple_choice' && question.options && (
                      <RadioGroup
                        value={answers[question.id] || ''}
                        onValueChange={(value) => onAnswerChange(question.id, value)}
                      >
                        {(question.options as string[]).map((option: string, i: number) => (
                          <div key={i} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                            <Label htmlFor={`${question.id}-${i}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {(question.question_type === 'fill_blank' || question.question_type === 'short_answer') && (
                      <Input
                        placeholder="Nhập câu trả lời..."
                        value={answers[question.id] || ''}
                        onChange={(e) => onAnswerChange(question.id, e.target.value)}
                      />
                    )}

                    {question.question_type === 'true_false_not_given' && (
                      <RadioGroup
                        value={answers[question.id] || ''}
                        onValueChange={(value) => onAnswerChange(question.id, value)}
                      >
                        {['TRUE', 'FALSE', 'NOT GIVEN'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                            <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
