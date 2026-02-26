import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi, examsApi, enrollmentsApi, submissionsApi } from "@/lib/api";
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
  CheckCircle2,
  ClipboardCheck,
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

  // Fetch tất cả submissions của chính user hiện tại (truyền studentId để admin
  // cũng chỉ lấy submissions của bản thân, không phải toàn bộ học sinh)
  const { data: submissionsData } = useQuery({
    queryKey: ["my-submissions", user?.id],
    queryFn: () =>
      submissionsApi.list({
        limit: 100,
        ...(user?.id ? { studentId: user.id } : {}),
      }),
    enabled: isAuthenticated && !!user?.id,
  });

  const exams = examsData?.data || [];
  const meta = examsData?.meta;
  const totalPages = meta?.totalPages || 1;

  // Check if user is enrolled in this course
  const enrollmentList = enrollmentsData?.data || [];
  const enrollment = enrollmentList.find(
    (e: any) => e.courseId === slug || e.course?.id === slug,
  );

  // Tạo map: examId → trạng thái submission mới nhất (submitted / graded / in_progress)
  const submissionStatusMap = (() => {
    const submissions: any[] = submissionsData?.data || [];
    const map: Record<string, string> = {};
    // Duyệt theo thứ tự ưu tiên: graded > submitted > in_progress
    const priority: Record<string, number> = {
      graded: 3,
      submitted: 2,
      in_progress: 1,
    };
    for (const sub of submissions) {
      const examId = sub.exam?.id || sub.examId;
      if (!examId) continue;
      const existing = map[examId];
      if (!existing || (priority[sub.status] ?? 0) > (priority[existing] ?? 0)) {
        map[examId] = sub.status;
      }
    }
    return map;
  })();

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
            {exams
              .filter((e: any) => e.isPublished && e.isActive)
              .map((exam: any) => {
                const examStatus = submissionStatusMap[exam.id];
                const isGraded = examStatus === "graded";
                const isSubmitted = examStatus === "submitted";
                const isInProgress = examStatus === "in_progress";
                const isDone = isGraded || isSubmitted;

                return (
                  <Card
                    key={exam.id}
                    className={`hover:shadow-md transition-all duration-200 ${isDone ? "border-green-200 bg-green-50/30 dark:border-green-800/40 dark:bg-green-900/10" : ""
                      }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {isGraded && (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          )}
                          {isSubmitted && (
                            <ClipboardCheck className="h-5 w-5 text-amber-500 shrink-0" />
                          )}
                          {exam.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 shrink-0">
                          {exam.week && (
                            <Badge variant="outline">Tuần {exam.week}</Badge>
                          )}
                        </div>
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

                        {/* Trạng thái & nút hành động */}
                        <div className="flex items-center gap-2">
                          {isGraded && (
                            <>
                              <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Đã hoàn thành
                              </Badge>
                              {enrollment && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link to={`/exam/${exam.id}`}>
                                    <Play className="mr-1 h-3.5 w-3.5" />
                                    Làm lại
                                  </Link>
                                </Button>
                              )}
                            </>
                          )}
                          {isSubmitted && (
                            <>
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1">
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                Chờ chấm
                              </Badge>
                              {enrollment && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link to={`/exam/${exam.id}`}>
                                    <Play className="mr-1 h-3.5 w-3.5" />
                                    Làm lại
                                  </Link>
                                </Button>
                              )}
                            </>
                          )}
                          {isInProgress && enrollment && (
                            <Button size="sm" variant="default" asChild>
                              <Link to={`/exam/${exam.id}`}>
                                <Play className="mr-1 h-3.5 w-3.5" />
                                Tiếp tục
                              </Link>
                            </Button>
                          )}
                          {!examStatus && enrollment && (
                            <Button size="sm" asChild>
                              <Link to={`/exam/${exam.id}`}>
                                <Play className="mr-1 h-3.5 w-3.5" />
                                Làm bài
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
