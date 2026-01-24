import { useSearchParams } from 'react-router-dom';
import ExamForm from '@/components/admin/ExamForm';

export default function AdminExamCreate() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course_id') || undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tạo bài thi mới</h1>
      <ExamForm mode="create" defaultCourseId={courseId} />
    </div>
  );
}
