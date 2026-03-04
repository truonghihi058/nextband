import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PenTool } from "lucide-react";
import type { QuestionFormProps } from "./QuestionFormTypes";

export function EssayForm({ form, onChange }: QuestionFormProps) {
  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <CardContent className="p-4 space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/10">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
            <PenTool className="h-4 w-4" />
            CÂU HỎI BÀI LUẬN / VIẾT DÀI
          </div>
          <Badge
            variant="secondary"
            className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
          >
            Chấm thủ công
          </Badge>
        </div>

        {/* Question text */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Đề bài / Yêu cầu viết *
          </Label>
          <Textarea
            placeholder="VD: Some people believe that universities should focus more on practical skills. To what extent do you agree or disagree?"
            value={form.questionText}
            onChange={(e) => onChange({ questionText: e.target.value })}
            rows={4}
            className="bg-background"
          />
        </div>

        {/* Word limit */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Giới hạn từ tối thiểu
            </Label>
            <Input
              type="number"
              min={0}
              placeholder="VD: 150"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Giới hạn từ tối đa
            </Label>
            <Input
              type="number"
              min={0}
              placeholder="VD: 250"
              className="bg-background"
            />
          </div>
        </div>

        {/* Sample answer */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bài mẫu / Sample Answer (tham khảo cho giáo viên)
          </Label>
          <Textarea
            placeholder="Nhập bài viết mẫu hoặc các ý chính cần có..."
            value={form.correctAnswer}
            onChange={(e) => onChange({ correctAnswer: e.target.value })}
            rows={5}
            className="bg-background border-emerald-500/20 focus-visible:border-emerald-500"
          />
        </div>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 text-sm text-amber-700 dark:text-amber-400">
          ✍️ Bài luận sẽ được <strong>giáo viên chấm thủ công</strong>. Bài mẫu
          ở trên chỉ dùng làm tài liệu tham khảo khi chấm, không tính điểm tự
          động.
        </div>
      </CardContent>
    </Card>
  );
}
