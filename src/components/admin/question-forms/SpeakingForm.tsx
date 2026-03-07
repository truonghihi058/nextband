import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mic } from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { QuestionFormProps } from "./QuestionFormTypes";

export function SpeakingForm({ form, onChange }: QuestionFormProps) {
  return (
    <Card className="border-[hsl(var(--speaking))]/30 bg-[hsl(var(--speaking))]/5">
      <CardContent className="p-4 space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--speaking))] pb-2 border-b border-[hsl(var(--speaking))]/10">
          <Mic className="h-4 w-4" />
          CẤU HÌNH CÂU HỎI SPEAKING
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Audio đề bài / Câu hỏi mẫu (không bắt buộc)
          </Label>
          <FileUpload
            accept="audio/*"
            currentUrl={form.audioUrl || undefined}
            onUploadComplete={(url) => onChange({ audioUrl: url })}
            onRemove={() => onChange({ audioUrl: "" })}
            maxSizeMB={20}
          />
          <p className="text-[10px] text-muted-foreground italic">
            * Upload file âm thanh nếu muốn thí sinh nghe đề bài thay vì chỉ đọc
            chữ.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Nội dung câu hỏi / Yêu cầu Speaking
          </Label>
          <RichTextEditor
            placeholder="Ví dụ: Describe a place you visited that had a significant impact on you."
            value={form.questionText}
            onChange={(html) => onChange({ questionText: html })}
            minHeight={100}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Câu trả lời mẫu / Gợi ý (Reference Answer)
          </Label>
          <RichTextEditor
            placeholder="Nhập nội dung trả lời mẫu hoặc các ý chính cần có..."
            value={form.correctAnswer}
            onChange={(html) => onChange({ correctAnswer: html })}
            minHeight={120}
          />
        </div>
      </CardContent>
    </Card>
  );
}
