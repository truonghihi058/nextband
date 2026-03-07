import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examsApi, sectionsApi } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Settings,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Edit,
  FileText,
  Check,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import ExamForm from "@/components/admin/ExamForm";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

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

export default function AdminExamEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get("tab") || "info";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => examsApi.getById(id!),
    enabled: !!id,
  });

  const sections = examData?.sections || [];

  const handleBack = () => {
    if (examData?.courseId) {
      navigate(`/admin/courses/${examData.courseId}?tab=exams`);
    } else {
      navigate("/admin/exams");
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    queryClient.invalidateQueries({ queryKey: ["exam", id] });
  };

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSection, setNewSection] = useState({
    title: "",
    sectionType: "reading",
    orderIndex: 0,
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createSectionMutation = useMutation({
    mutationFn: (data: any) => sectionsApi.create({ ...data, examId: id! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam", id] });
      setCreateDialogOpen(false);
      setNewSection({
        title: "",
        sectionType: "reading",
        orderIndex: sections.length,
      });
      toast({ title: "Đã thêm section" });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => sectionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam", id] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => sectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam", id] });
      setDeleteId(null);
      toast({ title: "Đã xóa section" });
    },
  });

  const moveSection = (section: any, direction: "up" | "down") => {
    const currentIndex = section.orderIndex ?? 0;
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0) return;

    updateSectionMutation.mutate({ id: section.id, orderIndex: newIndex });
  };

  if (!id) {
    return <div>ID không hợp lệ</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Chỉnh sửa bài thi</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <Settings className="h-4 w-4" />
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Sections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ExamForm mode="edit" examId={id} onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quản lý Sections</CardTitle>
                  <CardDescription>
                    Chỉnh sửa nội dung từng phần thi
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setNewSection((s) => ({
                      ...s,
                      orderIndex: sections.length,
                    }));
                    setCreateDialogOpen(true);
                  }}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Thêm Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {examLoading ? (
                <p className="text-muted-foreground">Đang tải...</p>
              ) : sections && sections.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {sections
                    .sort(
                      (a: any, b: any) =>
                        (a.orderIndex || 0) - (b.orderIndex || 0),
                    )
                    .map((section: any) => {
                      const Icon =
                        sectionIcons[
                          section.sectionType as keyof typeof sectionIcons
                        ] || BookOpen;
                      const colorClass =
                        sectionColors[
                          section.sectionType as keyof typeof sectionColors
                        ] || "bg-muted";

                      return (
                        <Card
                          key={section.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge className={colorClass}>
                                  <Icon className="mr-1 h-3 w-3" />
                                  {section.sectionType.toUpperCase()}
                                </Badge>
                                {section.questionGroups?.some(
                                  (g: any) => (g.questions?.length || 0) > 0,
                                ) && (
                                  <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                                    <Check className="h-3 w-3 mr-1" />
                                    Filled
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="flex flex-col">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveSection(section, "up")}
                                    disabled={updateSectionMutation.isPending}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveSection(section, "down")}
                                    disabled={updateSectionMutation.isPending}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="h-8"
                                >
                                  <Link to={`/admin/sections/${section.id}`}>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Sửa
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => setDeleteId(section.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <CardTitle className="text-lg mt-2">
                              {section.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {section.durationMinutes && (
                                <p>Thời gian: {section.durationMinutes} phút</p>
                              )}
                              {section.instructions && (
                                <p className="line-clamp-2">
                                  {section.instructions.replace(/<[^>]*>/g, "")}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Chưa có section nào.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Section Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Section mới</DialogTitle>
            <DialogDescription>
              Tạo một phần thi mới cho bài thi này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tiêu đề Section</Label>
              <Input
                placeholder="VD: Listening Section 1, Reading Passage 1..."
                value={newSection.title}
                onChange={(e) =>
                  setNewSection((s) => ({ ...s, title: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại Section</Label>
                <Select
                  value={newSection.sectionType}
                  onValueChange={(val) =>
                    setNewSection((s) => ({ ...s, sectionType: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="listening">Listening</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="speaking">Speaking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Thứ tự (Index)</Label>
                <Input
                  type="number"
                  value={newSection.orderIndex}
                  onChange={(e) =>
                    setNewSection((s) => ({
                      ...s,
                      orderIndex: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              disabled={createSectionMutation.isPending || !newSection.title}
              onClick={() => createSectionMutation.mutate(newSection)}
            >
              {createSectionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tạo Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteSectionMutation.mutate(deleteId)}
        title="Xóa Section?"
        description="Toàn bộ câu hỏi và dữ liệu trong section này sẽ bị xóa vĩnh viễn."
        isLoading={deleteSectionMutation.isPending}
      />
    </div>
  );
}
