import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ListChecks, Plus, Trash2, CheckCircle2 } from "lucide-react";
import type { QuestionFormProps } from "./QuestionFormTypes";

export function MultipleChoiceForm({ form, onChange }: QuestionFormProps) {
  const addOption = () => {
    onChange({ options: [...form.options, ""] });
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 2) return;
    const newOpts = form.options.filter((_, i) => i !== index);
    // If removed option was the correct answer, clear it
    const removedValue = form.options[index];
    if (form.correctAnswer === removedValue) {
      onChange({ options: newOpts, correctAnswer: "" });
    } else {
      onChange({ options: newOpts });
    }
  };

  const selectCorrectAnswer = (optionValue: string) => {
    onChange({ correctAnswer: optionValue });
  };

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardContent className="p-4 space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-600 pb-2 border-b border-blue-500/10">
          <ListChecks className="h-4 w-4" />
          CÂU HỎI TRẮC NGHIỆM
        </div>

        {/* Question text */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Nội dung câu hỏi *
          </Label>
          <Textarea
            placeholder="Nhập câu hỏi..."
            value={form.questionText}
            onChange={(e) => onChange({ questionText: e.target.value })}
            rows={3}
            className="bg-background"
          />
        </div>

        {/* Options with radio select */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Các lựa chọn (click để chọn đáp án đúng)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Thêm
            </Button>
          </div>

          <div className="grid gap-2">
            {form.options.map((opt, i) => {
              const isCorrect = opt.trim() !== "" && form.correctAnswer === opt;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${
                    isCorrect
                      ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                      : "border-border bg-white/50 hover:border-blue-300"
                  }`}
                  onClick={() => opt.trim() && selectCorrectAnswer(opt)}
                >
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCorrect
                        ? "bg-green-500 text-white"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </div>
                  <Input
                    placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...form.options];
                      const oldValue = newOpts[i];
                      newOpts[i] = e.target.value;
                      // Update correctAnswer if this was the selected one
                      if (form.correctAnswer === oldValue && oldValue !== "") {
                        onChange({
                          options: newOpts,
                          correctAnswer: e.target.value,
                        });
                      } else {
                        onChange({ options: newOpts });
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-none shadow-none focus-visible:ring-0 h-8"
                  />
                  {form.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(i);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {form.correctAnswer && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Đáp án đúng: <strong>{form.correctAnswer}</strong>
            </p>
          )}
          {!form.correctAnswer && (
            <p className="text-xs text-muted-foreground italic">
              * Click vào một lựa chọn để đặt làm đáp án đúng
            </p>
          )}
        </div>

        {/* Points */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Điểm
            </Label>
            <Input
              type="number"
              min={1}
              value={form.points}
              onChange={(e) =>
                onChange({ points: parseInt(e.target.value) || 1 })
              }
              className="bg-background"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
