import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionsApi, questionsApi, uploadsApi } from "@/lib/api";
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
  Edit,
} from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichContent } from "@/components/exam/RichContent";
import {
  QuestionFormRenderer,
  stringifyFillBlankAnswers,
  parseFillBlankAnswers,
} from "@/components/admin/question-forms";
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

const ALL_QUESTION_TYPES = [
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

const SECTION_QUESTION_TYPES: Record<string, string[]> = {
  listening: [
    "multiple_choice",
    "fill_blank",
    "short_answer",
    "true_false_not_given",
    "yes_no_not_given",
    "matching",
  ],
  reading: [
    "multiple_choice",
    "fill_blank",
    "short_answer",
    "true_false_not_given",
    "yes_no_not_given",
    "matching",
  ],
  writing: [
    "essay",
    "fill_blank",
    "short_answer",
    "multiple_choice",
    "matching",
    "true_false_not_given",
    "yes_no_not_given",
  ],
  speaking: ["speaking"],
  general: ALL_QUESTION_TYPES.map((t) => t.value),
};

function getQuestionTypesForSection(sectionType: string) {
  const allowed =
    SECTION_QUESTION_TYPES[sectionType] || SECTION_QUESTION_TYPES.general;
  return ALL_QUESTION_TYPES.filter((t) => allowed.includes(t.value));
}

interface QuestionGroup {
  id: string;
  title: string | null;
  passage: string | null;
  instructions: string | null;
  audioUrl: string | null;
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
  orderIndex?: number;
  order_index?: number;
}

// Helper to extract detailed validation error messages from API response
function getErrorMessage(error: any, defaultMsg: string) {
  const data = error?.response?.data;
  if (!data) return error?.message || defaultMsg;
  if (data.details) {
    const messages: string[] = [];
    for (const key in data.details) {
      if (Array.isArray(data.details[key])) {
        messages.push(...data.details[key]);
      } else if (typeof data.details[key] === "string") {
        messages.push(data.details[key]);
      }
    }
    if (messages.length > 0) return messages.join(", ");
  }
  return data.error || data.message || defaultMsg;
}

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

  // Image Cleanup Tracking
  const pendingImagesRef = useRef<string[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string }>;
      pendingImagesRef.current.push(customEvent.detail.url);
    };
    window.addEventListener("rich-text-image-uploaded", handler);
    return () => window.removeEventListener("rich-text-image-uploaded", handler);
  }, []);

  const cleanupImages = useCallback((retainedHtmlStrings: (string | undefined | null)[]) => {
    if (pendingImagesRef.current.length === 0) return;
    const combinedHtml = retainedHtmlStrings.filter(Boolean).join(" ");
    
    const orphans = pendingImagesRef.current.filter(url => !combinedHtml.includes(url));
    orphans.forEach(url => {
      uploadsApi.deleteFile(url).catch(console.error);
    });
    
    pendingImagesRef.current = [];
  }, []);

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
    audioUrl: "",
    orderIndex: 0,
  });
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    questionType: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    fillBlankAnswers: [""],
    points: 1,
    audioUrl: "",
    orderIndex: 0,
  });

  const { data: sectionData, isLoading: sectionLoading } = useQuery({
    queryKey: ["section-detail", id],
    queryFn: () => sectionsApi.getById(id!),
    enabled: !!id,
  });

  const section = sectionData;
  const questionGroups = section?.questionGroups || [];

  const getNextOrderIndexForGroup = (groupId: string) => {
    const group = questionGroups.find((g: any) => g.id === groupId);
    const questions = Array.isArray(group?.questions) ? group.questions : [];
    if (questions.length === 0) return 0;

    const maxOrder = questions.reduce((max: number, q: any) => {
      const value =
        typeof q?.orderIndex === "number"
          ? q.orderIndex
          : Number.parseInt(String(q?.orderIndex ?? 0), 10) || 0;
      return Math.max(max, value);
    }, -1);

    return maxOrder + 1;
  };

  // --- Mutations ---

  const createGroupMutation = useMutation({
    mutationFn: async (data: any) =>
      questionsApi.createGroup({ ...data, sectionId: id! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      closeGroupDialog(true);
      toast({ title: "Đã thêm nhóm câu hỏi" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể thêm nhóm câu hỏi"),
        variant: "destructive",
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id: groupId, ...data }: any) =>
      questionsApi.updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      closeGroupDialog(true);
      toast({ title: "Đã cập nhật nhóm câu hỏi" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể cập nhật nhóm câu hỏi"),
        variant: "destructive",
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => questionsApi.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      setDeleteGroup(null);
      toast({ title: "Đã xóa nhóm câu hỏi" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể xóa nhóm câu hỏi"),
        variant: "destructive",
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      let finalData = { ...data };
      if (data.questionType === "fill_blank") {
        finalData.correctAnswer = stringifyFillBlankAnswers(
          data.fillBlankAnswers,
        );
      }
      return questionsApi.create(finalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      closeQuestionDialog(true);
      toast({ title: "Đã thêm câu hỏi" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi tạo câu hỏi",
        description: getErrorMessage(error, "Không thể thêm câu hỏi"),
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id: questionId, ...data }: any) => {
      let finalData = { ...data };
      if (data.questionType === "fill_blank") {
        finalData.correctAnswer = stringifyFillBlankAnswers(
          data.fillBlankAnswers,
        );
      }
      return questionsApi.update(questionId, finalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      closeQuestionDialog(true);
      toast({ title: "Đã cập nhật câu hỏi" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi cập nhật câu hỏi",
        description: getErrorMessage(error, "Không thể cập nhật câu hỏi"),
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => questionsApi.delete(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      setDeleteQuestion(null);
      toast({ title: "Đã xóa câu hỏi" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể xóa câu hỏi"),
        variant: "destructive",
      });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: (data: any) => sectionsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể cập nhật Section"),
        variant: "destructive",
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async ({ groupId, text, questionType }: any) => {
      const lines = text
        .split("\n")
        .map((l: string) => l.trim())
        .filter(Boolean);
      const startOrderIndex = getNextOrderIndexForGroup(groupId);
      const payload = lines.map((line: string, idx: number) => ({
        questionType,
        questionText: line,
        points: 1,
        orderIndex: startOrderIndex + idx,
      }));
      return questionsApi.bulkCreate(groupId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-detail", id] });
      setBulkImportGroupId(null);
      setBulkImportText("");
      toast({ title: "Đã nhập thành công các câu hỏi" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi nhập liệu",
        description: getErrorMessage(error, "Có lỗi xảy ra khi tạo câu hỏi hàng loạt"),
        variant: "destructive",
      });
    },
  });

  // Local state for auto-saving fields to prevent cursor jumps
  const [localInstructions, setLocalInstructions] = useState<string | null>(
    null,
  );
  const [localAudioScript, setLocalAudioScript] = useState<string | null>(null);

  useEffect(() => {
    if (sectionData && localInstructions === null) {
      setLocalInstructions(sectionData.instructions || "");
    }
  }, [sectionData, localInstructions]);

  useEffect(() => {
    if (sectionData && localAudioScript === null) {
      setLocalAudioScript(sectionData.audioScript || "");
    }
  }, [sectionData, localAudioScript]);

  useEffect(() => {
    if (localInstructions === null || !sectionData) return;
    if (localInstructions !== (sectionData.instructions || "")) {
      const timer = setTimeout(() => {
        updateSectionMutation.mutate({ instructions: localInstructions });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [localInstructions, sectionData, updateSectionMutation]);

  useEffect(() => {
    if (localAudioScript === null || !sectionData) return;
    if (localAudioScript !== (sectionData.audioScript || "")) {
      const timer = setTimeout(() => {
        updateSectionMutation.mutate({ audioScript: localAudioScript });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [localAudioScript, sectionData, updateSectionMutation]);

  // --- Handlers ---

  const closeGroupDialog = (saved: boolean) => {
    setGroupDialogOpen(false);
    if (saved) {
      cleanupImages([groupForm.passage, groupForm.instructions]);
    } else {
      cleanupImages([editingGroup?.passage, editingGroup?.instructions]);
    }
  };

  const closeQuestionDialog = (saved: boolean) => {
    setQuestionDialogOpen(false);
    if (saved) {
      cleanupImages([questionForm.questionText]);
    } else {
      cleanupImages([editingQuestion?.questionText]);
    }
  };

  const handleOpenGroupDialog = (group?: QuestionGroup) => {
    pendingImagesRef.current = [];
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        title: group.title || "",
        passage: group.passage || "",
        instructions: group.instructions || "",
        audioUrl: group.audioUrl || "",
        orderIndex: group.orderIndex || 0,
      });
    } else {
      setEditingGroup(null);
      setGroupForm({
        title: "",
        passage: "",
        instructions: "",
        audioUrl: "",
        orderIndex: questionGroups.length,
      });
    }
    setGroupDialogOpen(true);
  };

  const handleOpenQuestionDialog = (groupId: string, question?: Question) => {
    pendingImagesRef.current = [];
    setSelectedGroupId(groupId);
    if (question) {
      const normalizedOrderIndex =
        question.orderIndex ?? (question as any).order_index ?? 0;
      setEditingQuestion(question);
      setQuestionForm({
        questionText: question.questionText || "",
        questionType: question.questionType,
        options: Array.isArray(question.options)
          ? (question.options as string[])
          : ["", "", "", ""],
        correctAnswer: question.correctAnswer || "",
        fillBlankAnswers:
          question.questionType === "fill_blank"
            ? parseFillBlankAnswers(question.correctAnswer)
            : [""],
        points: question.points || 1,
        audioUrl: (question as any).audioUrl || "",
        orderIndex: normalizedOrderIndex,
      });
    } else {
      setEditingQuestion(null);
      const allowedTypes = getQuestionTypesForSection(
        section?.sectionType || "general",
      );
      const defaultType =
        section?.sectionType === "speaking"
          ? "speaking"
          : section?.sectionType === "writing"
            ? "essay"
            : allowedTypes[0]?.value || "multiple_choice";

      const groupCount =
        questionGroups.find((g: any) => g.id === groupId)?.questions?.length ||
        0;

      setQuestionForm({
        questionText: "",
        questionType: defaultType,
        options: ["", "", "", ""],
        correctAnswer: "",
        fillBlankAnswers: [""],
        points: 1,
        audioUrl: "",
        orderIndex: groupCount,
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
      const originalOrder =
        editingQuestion.orderIndex ?? (editingQuestion as any).order_index ?? 0;
      const { orderIndex, ...rest } = questionForm;
      const updatePayload =
        orderIndex === originalOrder ? rest : { ...rest, orderIndex };

      updateQuestionMutation.mutate({
        id: editingQuestion.id,
        ...updatePayload,
      });
    } else if (selectedGroupId) {
      const nextOrderIndex = getNextOrderIndexForGroup(selectedGroupId);
      const { orderIndex: _ignoredOrderIndex, ...questionWithoutOrder } =
        questionForm;
      createQuestionMutation.mutate({
        ...questionWithoutOrder,
        groupId: selectedGroupId,
        orderIndex: nextOrderIndex,
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground text-lg">Section không tồn tại</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
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
              if (section.examId) {
                navigate(`/admin/exams/${section.examId}?tab=sections`);
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
                {(section.sectionType || "").toUpperCase()}
              </Badge>
              {section.examTitle && (
                <span className="text-sm text-muted-foreground italic">
                  / {section.examTitle}
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
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>File Audio chính (Listening)</Label>
                  <FileUpload
                    accept="audio/*"
                    currentUrl={section.audioUrl || undefined}
                    onUploadComplete={(url) =>
                      updateSectionMutation.mutate({ audioUrl: url })
                    }
                    onRemove={() =>
                      updateSectionMutation.mutate({ audioUrl: "" })
                    }
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
                        updateSectionMutation.mutate({
                          durationMinutes: isNaN(val) ? 0 : val,
                        });
                      }}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      phút
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Transcript audio (chỉ hiển thị sau khi nộp)</Label>
                <RichTextEditor
                  placeholder="Nhập toàn bộ script khớp với audio..."
                  value={
                    localAudioScript !== null
                      ? localAudioScript
                      : section.audioScript || ""
                  }
                  onChange={(html) => setLocalAudioScript(html)}
                  minHeight={140}
                />
                <p className="text-xs text-muted-foreground">
                  Script chỉ được gửi xuống client sau khi thí sinh nộp bài để xem lại.
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Hướng dẫn chung cho Section</Label>
            <RichTextEditor
              placeholder="Nhập hướng dẫn cho toàn bộ section..."
              value={
                localInstructions !== null
                  ? localInstructions
                  : section.instructions || ""
              }
              onChange={(html) => setLocalInstructions(html)}
              minHeight={100}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Groups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Nhóm câu hỏi</CardTitle>
              <CardDescription>
                Tạo các nhóm câu hỏi (Passage, Section con...)
              </CardDescription>
            </div>
            <Button
              onClick={() => handleOpenGroupDialog()}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Thêm nhóm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questionGroups && questionGroups.length > 0 ? (
            <div className="space-y-4">
              <Accordion
                type="multiple"
                defaultValue={questionGroups.map((g: any) => g.id)}
                className="space-y-4"
              >
                {questionGroups.map((group: any) => (
                  <AccordionItem
                    key={group.id}
                    value={group.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center justify-between w-full pr-4 text-left">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <span className="font-bold text-sm">
                              {group.title || "Nhóm câu hỏi (không tiêu đề)"}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px]">
                                {group.questions?.length || 0} câu hỏi
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                #{group.orderIndex}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenGroupDialog(group);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteGroup({
                                id: group.id,
                                title: group.title || "Nhóm này",
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6 border-t mt-2">
                      {/* Group Audio (For Listening sections) */}
                      {group.audioUrl && (
                        <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-center gap-3">
                          <Headphones className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <audio
                              src={group.audioUrl}
                              controls
                              className="h-8 w-full outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Group Content (Passage or Instructions) */}
                      {group.passage && (
                        <div className="mb-4 p-4 bg-muted/50 rounded-lg prose prose-sm max-w-none">
                          <div className="text-[10px] uppercase text-muted-foreground font-bold mb-2">
                            Passage / Nội dung:
                          </div>
                          <RichContent html={group.passage} variant="passage" />
                        </div>
                      )}

                      {group.instructions && (
                        <div className="mb-4 p-3 bg-white border-orange-500/50 border rounded-lg text-sm text-black font-semibold shadow-sm">
                          <div className="text-[10px] uppercase text-orange-600 font-bold mb-1 opacity-70">
                            Hướng dẫn:
                          </div>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: group.instructions,
                            }}
                          />
                        </div>
                      )}

                      {/* Questions List */}
                      <div className="space-y-3 pl-4 border-l-2 border-primary/10 ml-2">
                        {(group.questions || [])
                          .sort(
                            (a: any, b: any) =>
                              (a.orderIndex || 0) - (b.orderIndex || 0),
                          )
                          .map((q: any, qIndex: number) => (
                            <div
                              key={q.id}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors bg-card"
                            >
                              <div className="flex-shrink-0 flex flex-col items-center gap-1 mt-1">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                  {qIndex + 1}
                                </span>
                                <span className="text-[8px] font-mono text-muted-foreground">
                                  #{q.orderIndex}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="font-medium text-sm line-clamp-2 prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: q.questionText,
                                  }}
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 h-4"
                                  >
                                    {ALL_QUESTION_TYPES.find(
                                      (t) => t.value === q.questionType,
                                    )?.label || q.questionType}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {q.points} điểm
                                  </span>
                                  {q.audioUrl && (
                                    <Badge className="bg-blue-500 h-4 px-1.5">
                                      <Headphones className="h-2 w-2 mr-1" />{" "}
                                      Audio
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    handleOpenQuestionDialog(group.id, q)
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setDeleteQuestion({
                                      id: q.id,
                                      text: q.questionText.replace(
                                        /<[^>]*>/g,
                                        "",
                                      ),
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}

                        {/* Question Action buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            className="flex-1 border-dashed h-9"
                            onClick={() => handleOpenQuestionDialog(group.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Thêm câu hỏi
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-dashed h-9"
                            onClick={() => {
                              const defaultTypeForSection =
                                section?.sectionType === "speaking"
                                  ? "speaking"
                                  : section?.sectionType === "writing"
                                    ? "essay"
                                    : "short_answer";
                              setBulkImportGroupId(group.id);
                              setBulkImportText("");
                              setBulkImportType(defaultTypeForSection);
                            }}
                          >
                            <Zap className="mr-2 h-4 w-4" /> Nhập nhanh
                          </Button>
                        </div>

                        {/* Bulk import inline panel */}
                        {bulkImportGroupId === group.id && (
                          <Card className="border-2 border-primary/30 bg-primary/5 mt-3">
                            <CardContent className="p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-primary" />
                                  Nhập nhanh câu hỏi
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6"
                                  onClick={() => setBulkImportGroupId(null)}
                                >
                                  ✕
                                </Button>
                              </div>
                              <Textarea
                                placeholder="Paste mỗi dòng là 1 câu hỏi..."
                                value={bulkImportText}
                                onChange={(e) =>
                                  setBulkImportText(e.target.value)
                                }
                                rows={6}
                                className="font-mono text-xs"
                              />
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 flex-1">
                                  <Label className="text-xs whitespace-nowrap">
                                    Dạng:
                                  </Label>
                                  <Select
                                    value={bulkImportType}
                                    onValueChange={setBulkImportType}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getQuestionTypesForSection(
                                        section.sectionType,
                                      ).map((t) => (
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
                                <Button
                                  size="sm"
                                  onClick={handleBulkImport}
                                  disabled={
                                    !bulkImportText ||
                                    bulkImportMutation.isPending
                                  }
                                >
                                  {bulkImportMutation.isPending && (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
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
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
              <p className="text-muted-foreground mb-4">
                Chưa có nội dung nào trong section này.
              </p>
              <Button onClick={() => handleOpenGroupDialog()} className="gap-2">
                <Plus className="h-4 w-4" /> Thêm nhóm câu hỏi đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={(open) => !open && closeGroupDialog(false)}>
        <DialogContent className="max-w-[96vw] sm:max-w-[980px]">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Cập nhật nhóm" : "Thêm nhóm mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Tiêu đề nhóm (Passage title, Section header...)</Label>
                <Input
                  value={groupForm.title}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input
                  type="number"
                  value={groupForm.orderIndex}
                  onChange={(e) =>
                    setGroupForm((f) => ({
                      ...f,
                      orderIndex: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hướng dẫn nhóm (Instructions)</Label>
              <RichTextEditor
                value={groupForm.instructions}
                onChange={(html) =>
                  setGroupForm((f) => ({ ...f, instructions: html }))
                }
                minHeight={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Audio nhóm (Không bắt buộc)</Label>
              <FileUpload
                accept="audio/*"
                currentUrl={groupForm.audioUrl}
                onUploadComplete={(url) =>
                  setGroupForm((f) => ({ ...f, audioUrl: url }))
                }
                onRemove={() => setGroupForm((f) => ({ ...f, audioUrl: "" }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Nội dung chính / Đoạn văn (Passage)</Label>
              <RichTextEditor
                value={groupForm.passage}
                onChange={(html) =>
                  setGroupForm((f) => ({ ...f, passage: html }))
                }
                minHeight={250}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => closeGroupDialog(false)}>
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
              Lưu nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={(open) => !open && closeQuestionDialog(false)}>
        <DialogContent className="max-w-[96vw] sm:max-w-[980px] max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>
              {editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Dạng câu hỏi</Label>
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
                    {getQuestionTypesForSection(section.sectionType).map(
                      (t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input
                  type="number"
                  value={questionForm.orderIndex}
                  onChange={(e) =>
                    setQuestionForm((f) => ({
                      ...f,
                      orderIndex: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mx-auto w-full max-w-2xl">
              <QuestionFormRenderer
                questionType={questionForm.questionType}
                form={questionForm as any}
                onChange={(updates) =>
                  setQuestionForm((f) => ({ ...f, ...updates }))
                }
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button
              variant="outline"
              onClick={() => closeQuestionDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveQuestion}
              disabled={
                createQuestionMutation.isPending ||
                updateQuestionMutation.isPending
              }
            >
              {(createQuestionMutation.isPending ||
                updateQuestionMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Lưu câu hỏi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteGroup}
        onOpenChange={(open) => !open && setDeleteGroup(null)}
        onConfirm={() =>
          deleteGroup && deleteGroupMutation.mutate(deleteGroup.id)
        }
        title="Xóa nhóm?"
        description={`Bạn có chắc muốn xóa nhóm "${deleteGroup?.title}"?`}
        loading={deleteGroupMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteQuestion}
        onOpenChange={(open) => !open && setDeleteQuestion(null)}
        onConfirm={() =>
          deleteQuestion && deleteQuestionMutation.mutate(deleteQuestion.id)
        }
        title="Xóa câu hỏi?"
        description="Câu hỏi này sẽ bị xóa khỏi hệ thống."
        loading={deleteQuestionMutation.isPending}
      />
    </div>
  );
}
