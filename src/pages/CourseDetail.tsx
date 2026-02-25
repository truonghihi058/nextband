import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi, examsApi, enrollmentsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  GraduationCap,
  Headphones,
  FileText,
  Mic,
  PenTool,
  Play,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const sectionIcons: Record<string, any> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
  general: FileText,
};

const sectionColors: Record<string, string> = {
  listening: "bg-listening text-white",
  reading: "bg-reading text-white",
  writing: "bg-writing text-white",
  speaking: "bg-speaking text-white",
  general: "bg-primary text-primary-foreground",
};

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 6;

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => coursesApi.getById(slug!),
    enabled: !!slug,
  });

  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ["course-exams", slug, page],
    queryFn: () =>
      examsApi.list({
        courseId: slug,
        page,
        limit,
        isPublished: true,
        isActive: true,
      }),
    enabled: !!slug,
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentsApi.list(),
    enabled: isAuthenticated,
  });

  const exams = examsData?.data || [];
  const meta = examsData?.meta;
  const totalPages = meta?.totalPages || 1;

  // Check if user is enrolled in this course
  const enrollmentList = enrollmentsData?.data || [];
  const enrollment = enrollmentList.find(
    (e: any) => e.courseId === slug || e.course?.id === slug,
  );

  if (courseLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy khóa học</h2>
        <Button asChild variant="outline">
          <Link to="/">Quay về trang chủ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" asChild className="-ml-2">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Link>
      </Button>

      {/* Course Header */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {course.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {course.description}
            </p>
          </div>

          {/* Course Description */}
          {course.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Nội dung khóa học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {course.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enrollment Card */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              {course.thumbnailUrl && (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <CardTitle className="text-2xl">
                {course.price
                  ? `${course.price.toLocaleString()} VND`
                  : "Miễn phí"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollment ? (
                <Button className="w-full" size="lg" disabled>
                  <Play className="mr-2 h-4 w-4" />
                  Đã đăng ký
                </Button>
              ) : (
                <div className="text-center space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>
                      Liên hệ giáo viên hoặc quản trị viên để được thêm vào khóa
                      học này.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Exams Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Bài thi trong khóa học</h2>

        {examsLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : exams && exams.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((exam: any) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    {exam.week && (
                      <Badge variant="outline">Tuần {exam.week}</Badge>
                    )}
                  </div>
                  {exam.description && (
                    <CardDescription>{exam.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {exam.sections?.map((section: any) => {
                      const Icon =
                        sectionIcons[section.sectionType] || FileText;
                      const colorCls =
                        sectionColors[section.sectionType] ||
                        sectionColors.general;
                      return (
                        <Badge key={section.id} className={colorCls}>
                          <Icon className="mr-1 h-3 w-3" />
                          {section.sectionType === "general"
                            ? "Grammar"
                            : section.sectionType}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      {exam.durationMinutes || 60} phút
                    </div>
                    {enrollment && (
                      <Button size="sm" asChild>
                        <Link to={`/exam/${exam.id}`}>
                          <Play className="mr-1 h-4 w-4" />
                          Làm bài
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Chưa có bài thi nào</p>
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className={
                      page <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={page === i + 1}
                      onClick={() => setPage(i + 1)}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    className={
                      page >= totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
