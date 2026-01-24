import CourseForm from '@/components/admin/CourseForm';

export default function AdminCourseCreate() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tạo khóa học mới</h1>
      <CourseForm mode="create" />
    </div>
  );
}
