import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Users, FileText } from 'lucide-react';
import CourseForm from '@/components/admin/CourseForm';
import CourseExamsList from '@/components/admin/CourseExamsList';
import CourseStudentsList from '@/components/admin/CourseStudentsList';

export default function AdminCourseEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
  };

  if (!id) {
    return <div>ID không hợp lệ</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Chỉnh sửa khóa học</h1>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-2">
            <FileText className="h-4 w-4" />
            Bài thi
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            Học viên
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <CourseForm mode="edit" courseId={id} onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="exams">
          <CourseExamsList courseId={id} />
        </TabsContent>

        <TabsContent value="students">
          <CourseStudentsList courseId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
