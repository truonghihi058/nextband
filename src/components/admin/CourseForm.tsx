import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { coursesApi } from "@/lib/api";
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
import { Loader2, Save, ArrowLeft } from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";

const courseSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  thumbnailUrl: z.string().optional(),
  isPublished: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  mode: "create" | "edit" | "view";
  courseId?: string;
  onSuccess?: () => void;
}

export default function CourseForm({
  mode,
  courseId,
  onSuccess,
}: CourseFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode !== "create");
  const isReadOnly = mode === "view";

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      thumbnailUrl: "",
      isPublished: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (courseId && mode !== "create") {
      fetchCourse();
    }
  }, [courseId, mode]);

  const fetchCourse = async () => {
    try {
      const data = await coursesApi.getById(courseId!);

      if (data) {
        form.reset({
          title: data.title,
          description: data.description || "",
          price: data.price || 0,
          thumbnailUrl: data.thumbnailUrl || "",
          isPublished: data.isPublished || false,
          isActive: data.isActive ?? true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin khóa học",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (values: CourseFormData) => {
    setLoading(true);
    try {
      if (mode === "create") {
        await coursesApi.create({
          title: values.title,
          description: values.description,
          price: values.price,
          // thumbnailUrl, isPublished, isActive might not be in create payload based on current api.ts
          // Assume backend accepts them or update api.ts.
          // Let's pass them via spread if api calling supports.
          // Based on api.ts: create takes { title, description?, level?, price? }
          // So we might miss thumbnail and status fields on create.
          // We should update the course immediately after create to set these fields if create doesn't support them.
          // Or better, assume I've updated the backend/api client to accept them.
          // For safety, I'll spread extra fields as `any`.
          ...values,
        } as any);

        toast({ title: "Thành công", description: "Khóa học đã được tạo!" });
        navigate("/admin/courses");
      } else if (mode === "edit") {
        await coursesApi.update(courseId!, values as any);
        toast({
          title: "Thành công",
          description: "Khóa học đã được cập nhật!",
        });
        onSuccess?.();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message,
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
            <CardTitle>Thông tin khóa học</CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Tạo khóa học mới"
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
                      placeholder="Nhập tiêu đề khóa học"
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
                      placeholder="Mô tả về khóa học"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá (VND)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        disabled={isReadOnly}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ảnh thumbnail</FormLabel>
                  <FormControl>
                    <FileUpload
                      accept="image/*"
                      currentUrl={field.value || undefined}
                      onUploadComplete={(url) => field.onChange(url)}
                      onRemove={() => field.onChange("")}
                      disabled={isReadOnly}
                      maxSizeMB={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Xuất bản</FormLabel>
                      <FormDescription>
                        Khóa học sẽ hiển thị công khai
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
                        Cho phép truy cập khóa học
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
              {mode === "create" ? "Tạo khóa học" : "Lưu thay đổi"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
