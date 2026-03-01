import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionsApi, questionsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Save,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  FileText,
  Zap,
} from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sectionIcons = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
  general: FileText,
};

const sectionColors = {
  listening: "bg-listening text-white",
  reading: "bg-reading text-white",
  writing: "bg-writing text-white",
  speaking: "bg-speaking text-white",
  general: "bg-primary text-primary-foreground",
};

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Trắc nghiệm" },
  { value: "fill_blank", label: "Điền vào chỗ trống" },
  { value: "short_answer", label: "Trả lời ngắn" },
  { value: "true_false_not_given", label: "TRUE/FALSE/NOT GIVEN" },
  { value: "yes_no_not_given", label: "YES/NO/NOT GIVEN" },
  { value: "matching", label: "Nối đáp án" },
  { value: "essay", label: "Bài luận / Viết dài" },
  { value: "speaking", label: "Ghi âm (Speaking)" },
  { value: "listening", label: "Nghe hiểu (Listening)" },
];

interface QuestionGroup {
  id: string;
  title: string | null;
  passage: string | null;
  instructions: string | null;
  orderIndex: number;
  questions: Question[];
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: string[] | null;
  correctAnswer: string | null;
  points: number;
  orderIndex: number;
}

const FILL_BLANK_PLACEHOLDER_REGEX = /(\[BLANK(?:_\d+)?\]|_____)/g;

const extractFillBlankTokens = (text: string): string[] => {
  if (!text) return [];
  return text.match(FILL_BLANK_PLACEHOLDER_REGEX) || [];
};

const parseFillBlankAnswers = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item ?? "").trim());
    }
  } catch {
  }

  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
};

const stringifyFillBlankAnswers = (answers: string[]): string =>
  JSON.stringify(answers.map((item) => item.trim()));

export default function AdminSectionEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<QuestionGroup | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Bulk import states
  const [bulkImportGroupId, setBulkImportGroupId] = useState<string | null>(
    null,
  );
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkImportType, setBulkImportType] = useState("short_answer");

  // Delete states
  const [deleteGroup, setDeleteGroup] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<{
    id: string;
    text: string;
  } | null>(null);

  // Form states
  const [groupForm, setGroupForm] = useState({
    title: "",
    passage: "",
    instructions: "",
  });
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    questionType: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    fillBlankAnswers: [""],
    points: 1,
    audioUrl: "",
  });

  const { data: sectionData, isLoading: sectionLoading } = useQuery({
    queryKey: ["section-detail", id],
    queryFn: () => sectionsApi.getById(id!),
    enabled: !!id,
  });

  const section = sectionData;
  const questionGroups = section?.questionGroups || [];

  const fillBlankTokenCount = useMemo(() => {
    if (questionForm.questionType !== "fill_blank") return 0;
    return extractFillBlankTokens(questionForm.questionText).length;
  }, [questionForm.questionText, questionForm.questionType]);

  useEffect(() => {
    if (questionForm.questionType !== "fill_blank") return;

    const targetCount = fillBlankTokenCount;
    setQuestionForm((prev) => {
      const current = prev.fillBlankAnswers || [];

      if (current.length === targetCount) return prev;

      if (current.length < targetCount) {
        return {
          ...prev,
          fillBlankAnswers: [
            ...current,
            ...Array.from({ length: targetCount - current.length }, () => ""),
          ],
        };
      }

      return {
        ...prev,
        fillBlankAnswers: current.slice(0, targetCount),
      };
    });
  }, [fillBlankTokenCount, questionForm.questionType]);

  // --- Mutations ---

  const createGroupMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      passage: string;
      instructions: string;
    }) => {
      return questionsApi.createGroup({
        sectionId: id!,
        title: data.title || undefined,
        passage: data.passage || undefined,
        instructions: data.instructions || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      setGroupDialogOpen(false);
      setGroupForm({ title: "", passage: "", instructions: "" });
      toast({ title: "Thành công", description: "Đã tạo nhóm câu hỏi mới" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      passage: string;
      instructions: string;
    }) => {
      return questionsApi.updateGroup(data.id, {
        title: data.title || null,
        passage: data.passage || null,
        instructions: data.instructions || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      setGroupDialogOpen(false);
      setEditingGroup(null);
      toast({ title: "Thành công", description: "Đã cập nhật nhóm câu hỏi" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => questionsApi.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      toast({ title: "Đã xóa", description: "Nhóm câu hỏi đã được xóa" });
      setDeleteGroup(null);
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: typeof questionForm & { groupId: string }) => {
      const normalizedCorrectAnswer =
        data.questionType === "fill_blank" && data.fillBlankAnswers.length > 0
          ? stringifyFillBlankAnswers(data.fillBlankAnswers)
          : data.correctAnswer || undefined;

      return questionsApi.create({
        groupId: data.groupId,
        questionText: data.questionText,
        questionType: data.questionType,
        options:
          data.questionType === "multiple_choice"
            ? data.options.filter(Boolean)
            : undefined,
        correctAnswer: normalizedCorrectAnswer,
        audioUrl: data.audioUrl || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      setQuestionDialogOpen(false);
      setSelectedGroupId(null);
      setQuestionForm({
        questionText: "",
        questionType: "multiple_choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        fillBlankAnswers: [""],
        points: 1,
        audioUrl: "",
      });
      toast({ title: "Thành công", description: "Đã tạo câu hỏi mới" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: typeof questionForm & { id: string }) => {
      const normalizedCorrectAnswer =
        data.questionType === "fill_blank" && data.fillBlankAnswers.length > 0
          ? stringifyFillBlankAnswers(data.fillBlankAnswers)
          : data.correctAnswer || null;

      return questionsApi.update(data.id, {
        questionText: data.questionText,
        questionType: data.questionType,
        options:
          data.questionType === "multiple_choice"
            ? data.options.filter(Boolean)
            : null,
        correctAnswer: normalizedCorrectAnswer,
        points: data.points,
        audioUrl: data.audioUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: "Thành công", description: "Đã cập nhật câu hỏi" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => questionsApi.delete(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      toast({ title: "Đã xóa", description: "Câu hỏi đã được xóa" });
      setDeleteQuestion(null);
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async (data: {
      audioUrl?: string;
      instructions?: string;
      durationMinutes?: number;
    }) => {
      return sectionsApi.update(id!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      toast({
        title: "Đã lưu",
        description: "Thông tin section đã được cập nhật",
      });
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async ({
      groupId,
      text,
      questionType,
    }: {
      groupId: string;
      text: string;
      questionType: string;
    }) => {
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) throw new Error("Không có câu hỏi nào để nhập");

      const questions = lines.map((line) => ({
        questionText: line,
        questionType: questionType,
        points: 1,
      }));

      return questionsApi.bulkCreate(groupId, questions);
    },
    onSuccess: (_, { text }) => {
      const count = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean).length;
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      setBulkImportGroupId(null);
      setBulkImportText("");
      toast({ title: "Thành công", description: `Đã tạo ${count} câu hỏi` });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    },
  });

  // --- Handlers ---

  const handleOpenGroupDialog = (group?: QuestionGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        title: group.title || "",
        passage: group.passage || "",
        instructions: group.instructions || "",
      });
    } else {
      setEditingGroup(null);
      setGroupForm({ title: "", passage: "", instructions: "" });
    }
    setGroupDialogOpen(true);
  };

  const handleOpenQuestionDialog = (groupId: string, question?: Question) => {
    setSelectedGroupId(groupId);
    if (question) {
      setEditingQuestion(question);
      const parsedFillBlankAnswers =
        question.questionType === "fill_blank"
          ? parseFillBlankAnswers(question.correctAnswer)
          : [];

      setQuestionForm({
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options || ["", "", "", ""],
        correctAnswer:
          question.questionType === "fill_blank"
            ? ""
            : question.correctAnswer || "",
        fillBlankAnswers:
          parsedFillBlankAnswers.length > 0 ? parsedFillBlankAnswers : [""],
        points: question.points,
        audioUrl: (question as any).audioUrl || "",
      });
    } else {
      setEditingQuestion(null);
      const defaultType =
        section?.sectionType === "speaking"
          ? "speaking"
          : section?.sectionType === "listening"
            ? "listening"
            : "multiple_choice";
      setQuestionForm({
        questionText: "",
        questionType: defaultType,
        options: ["", "", "", ""],
        correctAnswer: "",
        fillBlankAnswers: [""],
        points: 1,
        audioUrl: "",
      });
    }
    setQuestionDialogOpen(true);
  };

  const handleSaveGroup = () => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, ...groupForm });
    } else {
      createGroupMutation.mutate(groupForm);
    }
  };

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({
        id: editingQuestion.id,
        ...questionForm,
      });
    } else if (selectedGroupId) {
      createQuestionMutation.mutate({
        ...questionForm,
        groupId: selectedGroupId,
      });
    }
  };

  const handleBulkImport = () => {
    if (!bulkImportGroupId) return;
    bulkImportMutation.mutate({
      groupId: bulkImportGroupId,
      text: bulkImportText,
      questionType: bulkImportType,
    });
  };

  const bulkImportLineCount = bulkImportText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;

  if (sectionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!section) {
    return <div className="text-center py-8">Section không tồn tại</div>;
  }

  const Icon =
    sectionIcons[section.sectionType as keyof typeof sectionIcons] || FileText;
  const colorClass =
    sectionColors[section.sectionType as keyof typeof sectionColors] ||
    sectionColors.general;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (section.exam?.id) {
                navigate(`/admin/exams/${section.exam.id}?tab=sections`);
              } else {
                navigate(-1);
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={colorClass}>
                <Icon className="mr-1 h-3 w-3" />
                {section.sectionType?.toUpperCase()}
              </Badge>
              {section.exam && (
                <span className="text-sm text-muted-foreground">
                  /{" "}
                  <Link
                    to={`/admin/exams/${section.exam.id}?tab=sections`}
                    className="hover:underline"
                  >
                    {section.exam.title}
                  </Link>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{section.title}</h1>
          </div>
        </div>
      </div>

      {/* Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cài đặt Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {section.sectionType === "listening" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>File Audio (Listening)</Label>
                <FileUpload
                  accept="audio/*"
                  currentUrl={section.audioUrl || undefined}
                  onUploadComplete={(url) =>
                    updateSectionMutation.mutate({ audioUrl: url })
                  }
                  onRemove={() =>
                    updateSectionMutation.mutate({ audioUrl: "" })
                  }
                  onDurationDetected={(duration) => {
                    const minutes = Math.max(1, Math.ceil(duration / 60));
                    if (section.durationMinutes !== minutes) {
                      updateSectionMutation.mutate({ durationMinutes: minutes });
                    }
                  }}
                  maxSizeMB={20}
                />
              </div>
              <div className="space-y-2">
                <Label>Thời gian (phút)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={section.durationMinutes || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateSectionMutation.mutate({ durationMinutes: isNaN(val) ? 0 : val });
                    }}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">phút</span>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  * Tự động cập nhật theo độ dài file audio (tối thiểu 1p)
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Hướng dẫn chung</Label>
            <Textarea
              placeholder="Nhập hướng dẫn cho section..."
              defaultValue={section.instructions || ""}
              onBlur={(e) =>
                updateSectionMutation.mutate({ instructions: e.target.value })
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Groups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Nhóm câu hỏi</CardTitle>
            <CardDescription>
              Quản lý passages, audios và câu hỏi
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenGroupDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            {section.sectionType === "speaking" ? "Thêm phần thi" : "Thêm nhóm"}
          </Button>
        </CardHeader>
        <CardContent>
          {questionGroups && questionGroups.length > 0 ? (
            <div className="max-w-4xl mx-auto space-y-4">
              <Accordion type="multiple" className="space-y-4">
                {questionGroups.map((group: QuestionGroup, gIndex: number) => (
                  <AccordionItem
                    key={group.id}
                    value={group.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">
                            {section.sectionType === "speaking"
                              ? group.title || `Phần ${gIndex + 1}`
                              : group.title || `Nhóm ${gIndex + 1}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {group.questions?.length || 0} câu hỏi
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenGroupDialog(group)}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              setDeleteGroup({
                                id: group.id,
                                title: group.title || "Nhóm này",
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      {group.passage && (
                        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                          <div className="text-sm font-medium mb-2">
                            Đoạn văn:
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {group.passage}
                          </p>
                        </div>
                      )}

                      {group.instructions && (
                        <div className="mb-4 p-3 bg-accent/30 rounded-lg border border-accent">
                          <div className="text-sm font-medium mb-1">
                            Hướng dẫn:
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {group.instructions}
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        {group.questions
                          ?.sort(
                            (a: Question, b: Question) =>
                              (b.orderIndex || 0) - (a.orderIndex || 0),
                          )
                          .map((q: Question, qIndex: number) => (
                            <div
                              key={q.id}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                            >
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                                {qIndex + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium line-clamp-2">
                                  {q.questionText}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {QUESTION_TYPES.find(
                                      (t) => t.value === q.questionType,
                                    )?.label || q.questionType}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {q.points} điểm
                                  </span>
                                  {q.correctAnswer && (
                                    <span className="text-xs text-primary">
                                      ✓ Có đáp án
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenQuestionDialog(group.id, q)
                                  }
                                >
                                  Sửa
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setDeleteQuestion({
                                      id: q.id,
                                      text: q.questionText,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleOpenQuestionDialog(group.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm câu hỏi
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setBulkImportGroupId(group.id);
                              setBulkImportText("");
                              setBulkImportType("short_answer");
                            }}
                          >
                            <Zap className="mr-2 h-4 w-4" />
                            Nhập nhanh
                          </Button>
                        </div>

                        {/* Bulk import inline panel */}
                        {bulkImportGroupId === group.id && (
                          <Card className="border-2 border-primary/30 bg-primary/5">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-primary" />
                                  Nhập nhanh câu hỏi
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setBulkImportGroupId(null)}
                                >
                                  ✕
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Mỗi dòng = 1 câu hỏi. Dòng trống sẽ được bỏ qua.
                              </p>
                              <Textarea
                                placeholder={`Ví dụ:\nNhiều học sinh cảm thấy căng thẳng trước kỳ thi. (feel stressed)\nSinh viên cần chú ý khi giáo viên giải thích bài. (pay attention to)\nTôi thường dành thời gian cho gia đình vào cuối tuần. (spend time with)`}
                                value={bulkImportText}
                                onChange={(e) =>
                                  setBulkImportText(e.target.value)
                                }
                                rows={8}
                                className="font-mono text-sm"
                              />
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 flex-1">
                                  <Label className="text-xs whitespace-nowrap">
                                    Loại câu hỏi:
                                  </Label>
                                  <Select
                                    value={bulkImportType}
                                    onValueChange={setBulkImportType}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {QUESTION_TYPES.map((t) => (
                                        <SelectItem
                                          key={t.value}
                                          value={t.value}
                                        >
                                          {t.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {bulkImportLineCount} câu hỏi
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={handleBulkImport}
                                  disabled={
                                    bulkImportLineCount === 0 ||
                                    bulkImportMutation.isPending
                                  }
                                >
                                  {bulkImportMutation.isPending ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : (
                                    <Zap className="mr-1 h-3 w-3" />
                                  )}
                                  Tạo {bulkImportLineCount} câu
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có nhóm câu hỏi nào. Nhấn "Thêm nhóm" để bắt đầu.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Chỉnh sửa nhóm" : "Thêm nhóm mới"}
            </DialogTitle>
            <DialogDescription>
              Nhóm câu hỏi có thể chứa đoạn văn (passage), hướng dẫn, và nhiều
              câu hỏi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {section.sectionType === "speaking"
                  ? "Tên phần thi (Part)"
                  : "Tiêu đề nhóm"}
              </Label>
              <Input
                placeholder={
                  section.sectionType === "speaking"
                    ? "VD: Part 1 - Introduction"
                    : "VD: Dịch câu sang tiếng Anh, Nhận diện Subject-Verb, Đọc hiểu..."
                }
                value={groupForm.title}
                onChange={(e) =>
                  setGroupForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Hướng dẫn</Label>
              <Textarea
                placeholder="VD: Dịch các câu sau sang câu đơn tiếng Anh, Gạch chân S và in đậm V..."
                value={groupForm.instructions}
                onChange={(e) =>
                  setGroupForm((f) => ({ ...f, instructions: e.target.value }))
                }
                rows={3}
              />
            </div>
            {section.sectionType !== "speaking" && (
              <div className="space-y-2">
                <Label>Đoạn văn (Passage) — nếu có</Label>
                <Textarea
                  placeholder="Nhập đoạn văn đọc hiểu (nếu nhóm này cần bài đọc kèm theo)..."
                  value={groupForm.passage}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, passage: e.target.value }))
                  }
                  rows={6}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSaveGroup}
              disabled={
                createGroupMutation.isPending || updateGroupMutation.isPending
              }
            >
              {(createGroupMutation.isPending ||
                updateGroupMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteGroup}
        onOpenChange={(open) => !open && setDeleteGroup(null)}
        onConfirm={() =>
          deleteGroup && deleteGroupMutation.mutate(deleteGroup.id)
        }
        loading={deleteGroupMutation.isPending}
        title="Xóa nhóm câu hỏi?"
        description={`Bạn có chắc chắn muốn xóa nhóm "${deleteGroup?.title}"? Tất cả câu hỏi trong nhóm sẽ bị xóa vĩnh viễn.`}
      />

      {/* Delete Question Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteQuestion}
        onOpenChange={(open) => !open && setDeleteQuestion(null)}
        onConfirm={() =>
          deleteQuestion && deleteQuestionMutation.mutate(deleteQuestion.id)
        }
        loading={deleteQuestionMutation.isPending}
        title="Xóa câu hỏi?"
        description="Bạn có chắc chắn muốn xóa câu hỏi này không? Hành động này không thể hoàn tác."
      />

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nội dung câu hỏi *</Label>
              <Textarea
                placeholder="Nhập câu hỏi..."
                value={questionForm.questionText}
                onChange={(e) =>
                  setQuestionForm((f) => ({
                    ...f,
                    questionText: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Loại câu hỏi</Label>
                <Select
                  value={questionForm.questionType}
                  onValueChange={(v) =>
                    setQuestionForm((f) => ({ ...f, questionType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {questionForm.questionType !== "speaking" &&
                questionForm.questionType !== "essay" && (
                  <div className="space-y-2">
                    <Label>Điểm</Label>
                    <Input
                      type="number"
                      min={1}
                      value={questionForm.points}
                      onChange={(e) =>
                        setQuestionForm((f) => ({
                          ...f,
                          points: parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>
                )}
            </div>

            {/* Upload audio cho câu hỏi Listening */}
            {questionForm.questionType === "listening" && (
              <div className="space-y-2">
                <Label>File Audio cho câu hỏi</Label>
                <FileUpload
                  accept="audio/*"
                  currentUrl={questionForm.audioUrl || undefined}
                  onUploadComplete={(url) =>
                    setQuestionForm((f) => ({ ...f, audioUrl: url }))
                  }
                  onRemove={() =>
                    setQuestionForm((f) => ({ ...f, audioUrl: "" }))
                  }
                  maxSizeMB={20}
                />
              </div>
            )}

            {questionForm.questionType === "multiple_choice" && (
              <div className="space-y-2">
                <Label>Các lựa chọn</Label>
                {questionForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-6">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <Input
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...questionForm.options];
                        newOpts[i] = e.target.value;
                        setQuestionForm((f) => ({ ...f, options: newOpts }));
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {questionForm.questionType !== "speaking" &&
              questionForm.questionType !== "essay" &&
              questionForm.questionType !== "fill_blank" && (
                <div className="space-y-2">
                  <Label>Đáp án đúng</Label>
                  <Input
                    placeholder="Nhập đáp án đúng..."
                    value={questionForm.correctAnswer}
                    onChange={(e) =>
                      setQuestionForm((f) => ({
                        ...f,
                        correctAnswer: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

            {questionForm.questionType === "fill_blank" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Đáp án cho từng ô trống</Label>
                  <p className="text-xs text-muted-foreground">
                    Dùng placeholder <code>[BLANK]</code>, <code>[BLANK_1]</code>
                    ... hoặc <code>_____</code> trong nội dung câu hỏi.
                  </p>
                </div>

                {fillBlankTokenCount > 0 && (
                  <div className="text-xs text-primary">
                    Phát hiện {fillBlankTokenCount} ô trống trong nội dung.
                  </div>
                )}

                {fillBlankTokenCount === 0 && (
                  <div className="text-xs text-amber-600">
                    Chưa có placeholder nào trong nội dung câu hỏi, nên chưa tạo ô đáp án.
                  </div>
                )}

                {questionForm.fillBlankAnswers.map((answer, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-16">Ô {idx + 1}</span>
                    <Input
                      placeholder={`Đáp án ô ${idx + 1}`}
                      value={answer}
                      onChange={(e) => {
                        const updated = [...questionForm.fillBlankAnswers];
                        updated[idx] = e.target.value;
                        setQuestionForm((f) => ({ ...f, fillBlankAnswers: updated }));
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Ghi chú cho Speaking */}
            {questionForm.questionType === "speaking" && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                💡 Câu hỏi dạng <strong>Ghi âm (Speaking)</strong>: Chỉ cần nhập
                nội dung câu hỏi ở trên. Khi thí sinh làm bài sẽ có nút ghi âm
                để trả lời.
              </div>
            )}

            {/* Ghi chú cho Listening */}
            {questionForm.questionType === "listening" && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                🎧 Câu hỏi dạng <strong>Nghe hiểu (Listening)</strong>: Upload
                file audio ở trên, nhập nội dung câu hỏi, và đáp án nếu có. Thí
                sinh sẽ nghe audio và trả lời câu hỏi.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuestionDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveQuestion}
              disabled={
                !questionForm.questionText ||
                (questionForm.questionType === "fill_blank" &&
                  questionForm.fillBlankAnswers.some((a) => !a.trim())) ||
                createQuestionMutation.isPending ||
                updateQuestionMutation.isPending
              }
            >
              {(createQuestionMutation.isPending ||
                updateQuestionMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Sticky Audio Player for Listening Sections */}
      {section.sectionType === "listening" && section.audioUrl && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-background/95 backdrop-blur shadow-2xl rounded-full border border-primary/20 p-2 pl-4 pr-4 transition-all hover:scale-105 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">
              Audio Section
            </span>
          </div>
          <audio
            controls
            src={section.audioUrl}
            className="h-10 outline-none w-[350px]"
          />
        </div>
      )}
    </div>
  );
}
