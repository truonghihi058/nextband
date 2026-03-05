import { useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { QuestionFormProps } from "./QuestionFormTypes";
import { extractFillBlankTokens } from "./QuestionFormTypes";

export function FillBlankForm({ form, onChange }: QuestionFormProps) {
  const fillBlankTokenCount = useMemo(() => {
    return extractFillBlankTokens(form.questionText).length;
  }, [form.questionText]);

  useEffect(() => {
    const targetCount = fillBlankTokenCount;
    const current = form.fillBlankAnswers || [];

    if (current.length === targetCount) return;

    if (current.length < targetCount) {
      onChange({
        fillBlankAnswers: [
          ...current,
          ...Array.from({ length: targetCount - current.length }, () => ""),
        ],
      });
    } else {
      onChange({ fillBlankAnswers: current.slice(0, targetCount) });
    }
  }, [fillBlankTokenCount]);

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-600 pb-2 border-b border-amber-500/10">
          <Zap className="h-4 w-4" />
          CẤU HÌNH CÂU HỎI ĐIỀN VÀO CHỖ TRỐNG
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Nội dung câu hỏi (chứa ô trống)
          </Label>
          <RichTextEditor
            placeholder="Ví dụ: I live in [BLANK] which is a big city."
            value={form.questionText}
            onChange={(html) => onChange({ questionText: html })}
            minHeight={120}
          />
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mt-1 px-1">
            <span>Placeholder hợp lệ:</span>
            <code className="bg-muted px-1 rounded text-primary">[BLANK]</code>
            <code className="bg-muted px-1 rounded text-primary">
              [BLANK_1]
            </code>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Audio đính kèm (không bắt buộc)
          </Label>
          <FileUpload
            accept="audio/*"
            currentUrl={form.audioUrl || undefined}
            onUploadComplete={(url) => onChange({ audioUrl: url })}
            onRemove={() => onChange({ audioUrl: "" })}
            maxSizeMB={20}
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Đáp án cho từng ô trống
            </Label>
            {fillBlankTokenCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-100/50 text-amber-700 border-amber-200"
              >
                Phát hiện {fillBlankTokenCount} ô trống
              </Badge>
            )}
          </div>

          {fillBlankTokenCount === 0 ? (
            <div className="rounded-lg border border-dashed border-amber-200 p-4 text-center bg-white/50">
              <p className="text-xs text-amber-600 italic">
                Chưa có placeholder nào trong nội dung câu hỏi. Hãy thêm [BLANK]
                để tạo ô đáp án.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {form.fillBlankAnswers.map((answer, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-white/50 p-2 rounded-lg border border-amber-100"
                >
                  <span className="text-xs font-bold w-12 text-amber-600">
                    Ô #{idx + 1}
                  </span>
                  <Input
                    placeholder={`Nhập đáp án đúng cho ô ${idx + 1}...`}
                    value={answer}
                    onChange={(e) => {
                      const updated = [...form.fillBlankAnswers];
                      updated[idx] = e.target.value;
                      onChange({ fillBlankAnswers: updated });
                    }}
                    className="bg-background h-9 border-none focus-visible:ring-1 focus-visible:ring-amber-500/30"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

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
