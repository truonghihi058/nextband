import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Headphones } from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { QuestionFormProps } from "./QuestionFormTypes";

export function ListeningForm({ form, onChange }: QuestionFormProps) {
  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-primary pb-2 border-b border-primary/10">
            <Headphones className="h-4 w-4" />
            CẤU HÌNH CÂU HỎI LISTENING
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Audio câu hỏi (bắt buộc)
              </Label>
              <FileUpload
                accept="audio/*"
                currentUrl={form.audioUrl || undefined}
                onUploadComplete={(url) => onChange({ audioUrl: url })}
                onRemove={() => onChange({ audioUrl: "" })}
                maxSizeMB={20}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Kiểu tương tác
              </Label>
              <Select
                value={
                  form.options && form.options.length > 0
                    ? "multiple_choice"
                    : "short_answer"
                }
                onValueChange={(v) => {
                  if (v === "multiple_choice") {
                    onChange({ options: ["", "", "", ""] });
                  } else {
                    onChange({ options: [] });
                  }
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Chọn kiểu tương tác" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_answer">
                    Trả lời ngắn / Điền từ
                  </SelectItem>
                  <SelectItem value="multiple_choice">
                    Trắc nghiệm (MCQ)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic">
                * Chọn Trắc nghiệm nếu muốn có các lựa chọn A, B, C, D
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Nội dung câu hỏi đi kèm audio
            </Label>
            <RichTextEditor
              placeholder="Ví dụ: What is the main reason the speaker moved to the city?"
              value={form.questionText}
              onChange={(html) => onChange({ questionText: html })}
              minHeight={100}
            />
          </div>

          {form.options && form.options.length > 0 && (
            <div className="space-y-3 pt-2 bg-white/50 p-3 rounded-lg border border-dashed">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Các lựa chọn trắc nghiệm
              </Label>
              <div className="grid gap-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm font-bold w-6 text-primary">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <Input
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...form.options];
                        newOpts[i] = e.target.value;
                        onChange({ options: newOpts });
                      }}
                      className="bg-background h-9"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Đáp án chính xác
            </Label>
            <Input
              placeholder="Nhập đáp án đúng..."
              value={form.correctAnswer}
              onChange={(e) => onChange({ correctAnswer: e.target.value })}
              className="bg-background h-10 border-primary/20 focus-visible:border-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              * Nếu là trắc nghiệm, hãy nhập nội dung chính xác của lựa chọn
              (VD: "New York")
            </p>
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

      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        🎧 Câu hỏi dạng <strong>Nghe hiểu (Listening)</strong>: Upload file
        audio ở trên, nhập nội dung câu hỏi, và đáp án nếu có. Thí sinh sẽ nghe
        audio và trả lời câu hỏi.
      </div>
    </>
  );
}
