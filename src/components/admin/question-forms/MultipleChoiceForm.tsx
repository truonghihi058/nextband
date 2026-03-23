import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ListChecks,
  Plus,
  Trash2,
  CheckCircle2,
  CheckSquare,
  ToggleLeft,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import FileUpload from "@/components/admin/FileUpload";
import type { QuestionFormProps } from "./QuestionFormTypes";

export function MultipleChoiceForm({ form, onChange }: QuestionFormProps) {
  const currentAnswers = useMemo(
    () =>
      (form.correctAnswer || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
    [form.correctAnswer],
  );

  // Explicit state for multi-mode so toggle is always controllable
  const [isMultiMode, setIsMultiMode] = useState(() => currentAnswers.length > 1);

  const addOption = () => {
    onChange({ options: [...form.options, ""] });
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 2) return;
    const removedValue = form.options[index];
    const newOpts = form.options.filter((_, i) => i !== index);
    if (currentAnswers.includes(removedValue)) {
      const newAnswers = currentAnswers.filter((a) => a !== removedValue);
      onChange({ options: newOpts, correctAnswer: newAnswers.join(" | ") });
    } else {
      onChange({ options: newOpts });
    }
  };

  const toggleCorrectAnswer = (optionValue: string) => {
    const val = optionValue.trim();
    if (!val) return;
    let newAnswers = [...currentAnswers];
    if (newAnswers.includes(val)) {
      newAnswers = newAnswers.filter((a) => a !== val);
    } else {
      newAnswers.push(val);
    }
    onChange({ correctAnswer: newAnswers.join(" | ") });
  };

  const handleSingleAnswer = (optionValue: string) => {
    onChange({ correctAnswer: optionValue.trim() });
  };

  const updateOptionText = (index: number, newValue: string) => {
    const newOpts = [...form.options];
    const oldValue = newOpts[index].trim();
    newOpts[index] = newValue;
    const valTrimmed = newValue.trim();
    if (oldValue !== "" && currentAnswers.includes(oldValue)) {
      const newAnswers = currentAnswers.map((a) =>
        a === oldValue ? valTrimmed : a,
      );
      onChange({
        options: newOpts,
        correctAnswer: newAnswers.filter(Boolean).join(" | "),
      });
    } else {
      onChange({ options: newOpts });
    }
  };

  const handleToggleMultiMode = (enabled: boolean) => {
    setIsMultiMode(enabled);
    if (!enabled) {
      // Switching to single: keep only first correct answer
      const first = currentAnswers[0] || "";
      onChange({ correctAnswer: first });
    }
    // Switching to multi: no change needed, admin clicks multiple options
  };

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardContent className="p-4 space-y-5">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-blue-500/10">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
            <ListChecks className="h-4 w-4" />
            CÂU HỎI TRẮC NGHIỆM
          </div>
          <Badge
            variant={isMultiMode ? "default" : "secondary"}
            className="text-xs"
          >
            {isMultiMode
              ? `MULTI — ${currentAnswers.length} đáp án đúng`
              : "SINGLE — 1 đáp án đúng"}
          </Badge>
        </div>

        {/* Question text */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Nội dung câu hỏi *
          </Label>
          <RichTextEditor
            placeholder="Nhập câu hỏi..."
            value={form.questionText}
            onChange={(html) => onChange({ questionText: html })}
            minHeight={100}
          />
        </div>

        {/* Audio URL */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Audio câu hỏi (không bắt buộc)
          </Label>
          <FileUpload
            accept="audio/*"
            currentUrl={form.audioUrl || undefined}
            onUploadComplete={(url) => onChange({ audioUrl: url })}
            onRemove={() => onChange({ audioUrl: "" })}
            maxSizeMB={20}
          />
        </div>

        {/* Multi-answer toggle */}
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800/40 p-3 gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <ToggleLeft className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Cho phép nhiều đáp án đúng</p>
              <p className="text-xs text-muted-foreground">
                {isMultiMode
                  ? "Học sinh phải chọn tất cả đáp án đúng (Checkbox)"
                  : "Học sinh chỉ chọn 1 đáp án (Radio button)"}
              </p>
            </div>
          </div>
          <Switch
            checked={isMultiMode}
            onCheckedChange={handleToggleMultiMode}
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isMultiMode
                ? "Lựa chọn (click để bật/tắt đáp án đúng)"
                : "Lựa chọn (click để chọn đáp án đúng)"}
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

          {isMultiMode && (
            <div className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-2 rounded flex items-start gap-2">
              <CheckSquare className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Đang ở chế độ <strong>nhiều đáp án</strong>. Click vào lựa chọn để thêm/bỏ đáp án đúng.
                Frontend sẽ hiển thị dạng <strong>Checkbox</strong> cho học sinh.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {form.options.map((opt, i) => {
              const isCorrect =
                opt.trim() !== "" && currentAnswers.includes(opt.trim());
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${
                    isCorrect
                      ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                      : "border-border bg-white/50 dark:bg-background/50 hover:border-blue-300"
                  }`}
                  onClick={() => {
                    if (!opt.trim()) return;
                    if (isMultiMode) {
                      toggleCorrectAnswer(opt);
                    } else {
                      handleSingleAnswer(opt);
                    }
                  }}
                >
                  <div
                    className={`flex-shrink-0 w-7 h-7 ${isMultiMode ? "rounded-md" : "rounded-full"} flex items-center justify-center text-xs font-bold ${
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
                    onChange={(e) => updateOptionText(i, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-none shadow-none focus-visible:ring-0 h-8 flex-1 min-w-0"
                  />
                  {form.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
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

          {currentAnswers.length > 0 && (
            <div className="text-xs text-green-600 flex items-center gap-1 flex-wrap">
              <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
              Đáp án đúng:
              {currentAnswers.map((ans, idx) => (
                <span
                  key={idx}
                  className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-sm dark:bg-green-900 dark:text-green-100"
                >
                  {ans}
                </span>
              ))}
            </div>
          )}
          {currentAnswers.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              * Click vào lựa chọn để đặt đáp án đúng
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
