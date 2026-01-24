import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from "lucide-react";

// Exam section types
const EXAM_SECTION_TYPES = ["listening", "reading", "writing", "speaking"] as const;
const EXAM_TYPES = ["ielts", "grammar"] as const;
const examSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  course_id: z.string().optional().nullable(),
  exam_type: z.enum(["ielts", "grammar"]).default("ielts"),
  week: z.coerce.number().min(1).default(1),
  duration_minutes: z.coerce.number().min(1).default(60),
  is_published: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type ExamFormData = z.infer<typeof examSchema>;

interface ExamFormProps {
  mode: "create" | "edit" | "view";
  examId?: string;
  defaultCourseId?: string;
  onSuccess?: () => void;
}

export default function ExamForm({ mode, examId, defaultCourseId, onSuccess }: ExamFormProps) {
  const navigate = useNavigate();

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode !== "create");
  const isReadOnly = mode === "view";
  const { data: courses } = useQuery({
    queryKey: ["admin-courses-select"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title").order("title");
      return data || [];
    },
  });

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      description: "",
      course_id: defaultCourseId || null,
      exam_type: "ielts",
      week: 1,
      duration_minutes: 60,
      is_published: false,
      is_active: true,
    },
  });

  useEffect(() => {
    if (examId && mode !== "create") {
      fetchExam();
    }
  }, [mode]);

  const fetchExam = async () => {
    try {
      const { data, error } = await supabase.from("exams").select("*").eq("id", examId!).single();

      if (error) throw error;
      if (data) {
        form.reset({
          title: data.title,
          description: data.description || "",
          course_id: data.course_id,
          exam_type: (data as any).exam_type || "ielts",
          week: data.week || 1,
          duration_minutes: data.duration_minutes || 60,
          is_published: data.is_published || false,
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const createDefaultSections = async (examId: string, examType: string) => {
    const sectionTypes = examType === "grammar" ? ["general"] : EXAM_SECTION_TYPES;

    const sectionsToCreate = sectionTypes.map((type, index) => ({
      exam_id: examId,
      section_type: type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      order_index: index,
    }));

    await supabase.from("exam_sections").insert(sectionsToCreate as any);
  };

  const onSubmit = async (values: ExamFormData) => {
    setLoading(true);
    try {
      const examData = {
        title: values.title,
        description: values.description || null,
        course_id: values.course_id || null,
        exam_type: values.exam_type,
        week: values.week,
        duration_minutes: values.duration_minutes,
        is_published: values.is_published,
        is_active: values.is_active,
      };

      if (mode === "create") {
        const { data: newExam, error } = await supabase
          .from("exams")
          .insert({
            ...examData,
          } as any)
          .select()
          .single();

        if (error) throw error;

        // Auto-create sections based on exam type
        await createDefaultSections(newExam.id, values.exam_type);

        const sectionCount = values.exam_type === "grammar" ? 1 : 4;
        toast({ title: "Thành công", description: `Bài thi đã được tạo với ${sectionCount} section!` });
        navigate(`/admin/exams/${newExam.id}`);
      } else if (mode === "edit") {
        const { error } = await supabase
          .from("exams")
          .update(examData as any)
          .eq("id", examId!);
        if (error) throw error;
        toast({ title: "Thành công", description: "Bài thi đã được cập nhật!" });
        onSuccess?.();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin bài thi</CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Tạo bài thi mới (sẽ tự động tạo 4 sections)"
                : mode === "edit"
                  ? "Chỉnh sửa thông tin"
                  : "Xem chi tiết"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isReadOnly} placeholder="Nhập tiêu đề bài thi" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={isReadOnly} placeholder="Mô tả về bài thi" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="course_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Khóa học</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khóa học (tuỳ chọn)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses?.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="exam_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại đề thi</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={isReadOnly || mode == "edit"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khóa học (tuỳ chọn)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXAM_TYPES.map((type: string, index) => (
                          <SelectItem key={index} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tuần</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isReadOnly} min={1} />
                    </FormControl>
                    <FormDescription>Dùng để sắp xếp bài thi trong khóa học</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian làm bài (phút)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isReadOnly} min={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Xuất bản</FormLabel>
                      <FormDescription>Bài thi sẽ hiển thị cho học viên</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Kích hoạt</FormLabel>
                      <FormDescription>Cho phép học viên làm bài</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {!isReadOnly && (
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? "Tạo bài thi" : "Lưu thay đổi"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
