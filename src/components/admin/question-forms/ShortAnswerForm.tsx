import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";
import type { QuestionFormProps } from "./QuestionFormTypes";

export function ShortAnswerForm({ form, onChange }: QuestionFormProps) {
  return (
    <Card className="border-sky-500/30 bg-sky-500/5">
      <CardContent className="p-4 space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-sky-600 pb-2 border-b border-sky-500/10">
          <MessageSquare className="h-4 w-4" />
          CÂU HỎI TRẢ LỜI NGẮN
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

        {/* Audio (optional) */}
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

        {/* Correct answer */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Đáp án đúng
          </Label>
          <Input
            placeholder="Nhập đáp án. Nhiều đáp án phân cách bởi | (VD: answer1 | answer2)"
            value={form.correctAnswer}
            onChange={(e) => onChange({ correctAnswer: e.target.value })}
            className="bg-background"
          />
          <p className="text-[10px] text-muted-foreground">
            * Dùng dấu <code className="bg-muted px-1 rounded">|</code> để phân
            cách nhiều đáp án chấp nhận được (VD: "big | large | huge")
          </p>
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
