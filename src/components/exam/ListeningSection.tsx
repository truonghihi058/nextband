import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Headphones, Volume2 } from 'lucide-react';

interface ListeningSectionProps {
  section: any;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
}

export function ListeningSection({ section, answers, onAnswerChange }: ListeningSectionProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Audio Player - Sticky */}
      {section.audio_url && (
        <div className="sticky top-0 bg-muted/50 backdrop-blur p-4 border-b">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Volume2 className="h-5 w-5 text-listening" />
            <audio controls className="flex-1" src={section.audio_url}>
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-listening mb-6">
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

          {section.question_groups?.map((group: any, groupIndex: number) => (
            <div key={group.id} className="space-y-4">
              {group.title && (
                <h3 className="font-medium text-foreground">{group.title}</h3>
              )}
              {group.instructions && (
                <p className="text-sm text-muted-foreground">{group.instructions}</p>
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

                    {question.question_type === 'fill_blank' && (
                      <Input
                        placeholder="Nhập câu trả lời..."
                        value={answers[question.id] || ''}
                        onChange={(e) => onAnswerChange(question.id, e.target.value)}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
