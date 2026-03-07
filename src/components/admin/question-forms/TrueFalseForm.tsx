import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { CheckSquare } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { QuestionFormProps } from "./QuestionFormTypes";

const ANSWER_OPTIONS = {
  true_false_not_given: [
    { value: "TRUE", label: "TRUE" },
    { value: "FALSE", label: "FALSE" },
    { value: "NOT GIVEN", label: "NOT GIVEN" },
  ],
  yes_no_not_given: [
    { value: "YES", label: "YES" },
    { value: "NO", label: "NO" },
    { value: "NOT GIVEN", label: "NOT GIVEN" },
  ],
};

export function TrueFalseForm({ form, onChange }: QuestionFormProps) {
  const isYesNo = form.questionType === "yes_no_not_given";
  const options =
    ANSWER_OPTIONS[form.questionType as keyof typeof ANSWER_OPTIONS] ||
    ANSWER_OPTIONS.true_false_not_given;

  return (
    <Card className="border-violet-500/30 bg-violet-500/5">
      <CardContent className="p-4 space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-violet-600 pb-2 border-b border-violet-500/10">
          <CheckSquare className="h-4 w-4" />
          {isYesNo ? "YES / NO / NOT GIVEN" : "TRUE / FALSE / NOT GIVEN"}
        </div>

        {/* Statement */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Statement (Nhận định) *
          </Label>
          <RichTextEditor
            placeholder={
              isYesNo
                ? "VD: The writer believes that technology has improved education."
                : "VD: The company was founded in 1995."
            }
            value={form.questionText}
            onChange={(html) => onChange({ questionText: html })}
            minHeight={100}
          />
          <p className="text-[10px] text-muted-foreground italic">
            * Nhập nhận định để thí sinh xác định{" "}
            {isYesNo
              ? "YES, NO, hoặc NOT GIVEN"
              : "TRUE, FALSE, hoặc NOT GIVEN"}
          </p>
        </div>

        {/* Answer selection */}
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Đáp án đúng
          </Label>
          <ToggleGroup
            type="single"
            value={form.correctAnswer}
            onValueChange={(value) => {
              if (value) onChange({ correctAnswer: value });
            }}
            className="justify-start gap-2"
          >
            {options.map((opt) => (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                className={`px-6 py-2 text-sm font-semibold border-2 transition-all ${
                  form.correctAnswer === opt.value
                    ? "border-violet-500 bg-violet-500 text-white shadow-md"
                    : "border-violet-200 hover:border-violet-400 dark:border-violet-800"
                }`}
              >
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {form.correctAnswer && (
            <Badge className="bg-violet-500">
              Đáp án: {form.correctAnswer}
            </Badge>
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
