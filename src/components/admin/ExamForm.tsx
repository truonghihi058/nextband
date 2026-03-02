import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi, examsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

const examSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  courseId: z
    .string({
      required_error: "Vui lòng chọn khóa học",
      invalid_type_error: "Vui lòng chọn khóa học",
    })
    .min(1, "Vui lòng chọn khóa học"),
  week: z.coerce
    .number({
      required_error: "Vui lòng nhập tuần",
      invalid_type_error: "Vui lòng nhập số",
    })
    .min(1, { message: "Tuần phải lớn hơn 0" })
    .default(1),
  durationMinutes: z.coerce
    .number({
      required_error: "Vui lòng nhập thời gian",
      invalid_type_error: "Vui lòng nhập số",
    })
    .min(1, { message: "Thời gian phải lớn hơn 0" })
    .default(60),
  isPublished: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type ExamFormData = z.infer<typeof examSchema>;

interface ExamFormProps {
  mode: "create" | "edit" | "view";
  examId?: string;
  defaultCourseId?: string;
  onSuccess?: () => void;
}

export default function ExamForm({
  mode,
  examId,
  defaultCourseId,
  onSuccess,
}: ExamFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode !== "create");
  const isReadOnly = mode === "view";

  const { data: coursesData } = useQuery({
    queryKey: ["admin-courses-select"],
    queryFn: () => coursesApi.list({ limit: 100 }),
  });

  const courses = coursesData?.data || [];

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: defaultCourseId || "",
      week: 1,
      durationMinutes: 60,
      isPublished: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (examId && mode !== "create") {
      fetchExam();
    }
  }, [mode, examId]);

  const fetchExam = async () => {
    try {
      const data = await examsApi.getById(examId!);

      if (data) {
        form.reset({
          title: data.title,
          description: data.description || "",
          courseId: data.courseId,
          week: data.week || 1,
          durationMinutes: data.durationMinutes || 60,
          isPublished: data.isPublished || false,
          isActive: data.isActive ?? true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin bài thi",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (values: ExamFormData) => {
    setLoading(true);
    try {
      if (mode === "create") {
        const newExam = await examsApi.create({
          courseId: values.courseId,
          title: values.title,
          description: values.description || undefined,
          week: values.week,
          durationMinutes: values.durationMinutes,
        } as any);

        toast({
          title: "Thành công",
          description: "Bài thi đã được tạo với 5 sections mặc định!",
        });
        navigate(`/admin/exams/${newExam.id}`);
      } else if (mode === "edit") {
        await examsApi.update(examId!, {
          title: values.title,
          description: values.description || "",
          isPublished: values.isPublished,
          isActive: values.isActive,
          week: values.week,
          durationMinutes: values.durationMinutes,
        } as any);

        toast({
          title: "Thành công",
          description: "Bài thi đã được cập nhật!",
        });

        queryClient.invalidateQueries({ queryKey: ["exam-sections", examId] });
        queryClient.invalidateQueries({ queryKey: ["exam", examId] });
        onSuccess?.();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || error.message || "Có lỗi xảy ra",
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
                ? "Tạo bài thi mới (sẽ tự động tạo 5 sections: Listening, Reading, Writing, Speaking, Grammar)"
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
                    <Input
                      {...field}
                      disabled={isReadOnly}
                      placeholder="Nhập tiêu đề bài thi"
                    />
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
                    <Textarea
                      {...field}
                      disabled={isReadOnly}
                      placeholder="Mô tả về bài thi"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Khóa học</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={
                        isReadOnly || (mode === "edit" && !!field.value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khóa học" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course: any) => (
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
                name="week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tuần</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        disabled={isReadOnly}
                        min={1}
                      />
                    </FormControl>
                    <FormDescription>
                      Dùng để sắp xếp bài thi trong khóa học
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian làm bài (phút)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        disabled={isReadOnly}
                        min={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Xuất bản</FormLabel>
                      <FormDescription>
                        Bài thi sẽ hiển thị cho học viên
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Kích hoạt</FormLabel>
                      <FormDescription>
                        Cho phép học viên làm bài
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {!isReadOnly && (
          <div className="flex justify-end gap-4">
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
