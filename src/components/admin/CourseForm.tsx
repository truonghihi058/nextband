import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
// Course level options
const COURSE_LEVELS = ['beginner', 'intermediate', 'ielts_5', 'ielts_5_5', 'ielts_6', 'ielts_6_5', 'ielts_7', 'ielts_7_5', 'ielts_8', 'ielts_8_5', 'ielts_9'] as const;

const courseSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  description: z.string().optional(),
  level: z.enum(COURSE_LEVELS),
  price: z.coerce.number().min(0).optional(),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  is_published: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  mode: 'create' | 'edit' | 'view';
  courseId?: string;
  onSuccess?: () => void;
}

const levelLabels: Record<string, string> = {
  beginner: 'Người mới',
  intermediate: 'Trung cấp',
  ielts_5: 'IELTS 5.0',
  ielts_5_5: 'IELTS 5.5',
  ielts_6: 'IELTS 6.0',
  ielts_6_5: 'IELTS 6.5',
  ielts_7: 'IELTS 7.0',
  ielts_7_5: 'IELTS 7.5',
  ielts_8: 'IELTS 8.0',
  ielts_8_5: 'IELTS 8.5',
  ielts_9: 'IELTS 9.0',
};

export default function CourseForm({ mode, courseId, onSuccess }: CourseFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode !== 'create');
  const isReadOnly = mode === 'view';

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      level: 'beginner',
      price: 0,
      thumbnail_url: '',
      is_published: false,
      is_active: true,
    },
  });

  useEffect(() => {
    if (courseId && mode !== 'create') {
      fetchCourse();
    }
  }, [courseId, mode]);

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId!)
        .single();

      if (error) throw error;
      if (data) {
        form.reset({
          title: data.title,
          description: data.description || '',
          level: (data.level || 'beginner') as typeof COURSE_LEVELS[number],
          price: data.price || 0,
          thumbnail_url: data.thumbnail_url || '',
          is_published: data.is_published || false,
          is_active: data.is_active ?? true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (values: CourseFormData) => {
    setLoading(true);
    try {
      const courseData = {
        title: values.title,
        description: values.description || null,
        level: values.level as any,
        price: values.price,
        thumbnail_url: values.thumbnail_url || null,
        is_published: values.is_published,
        is_active: values.is_active,
      };

      if (mode === 'create') {
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('courses')
          .insert({
            ...courseData,
            teacher_id: userData.user?.id,
          } as any);
        if (error) throw error;
        toast({ title: 'Thành công', description: 'Khóa học đã được tạo!' });
        navigate('/admin/courses');
      } else if (mode === 'edit') {
        const { error } = await supabase
          .from('courses')
          .update(courseData as any)
          .eq('id', courseId!);
        if (error) throw error;
        toast({ title: 'Thành công', description: 'Khóa học đã được cập nhật!' });
        onSuccess?.();
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
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
              {mode === 'create' ? 'Tạo khóa học mới' : mode === 'edit' ? 'Chỉnh sửa thông tin' : 'Xem chi tiết'}
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
                    <Input {...field} disabled={isReadOnly} placeholder="Nhập tiêu đề khóa học" />
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
                    <Textarea {...field} disabled={isReadOnly} placeholder="Mô tả về khóa học" rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cấp độ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn cấp độ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COURSE_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {levelLabels[level] || level}
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá (VND)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isReadOnly} placeholder="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="thumbnail_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ảnh thumbnail (URL)</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isReadOnly} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="is_published"
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
                name="is_active"
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
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Tạo khóa học' : 'Lưu thay đổi'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
