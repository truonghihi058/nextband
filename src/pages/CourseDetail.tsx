import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, Clock, GraduationCap, Headphones, FileText, Mic, PenTool, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const levelLabels: Record<string, string> = {
  beginner: "Người mới",
  intermediate: "Trung cấp",
  ielts_5: "IELTS 5.0",
  ielts_5_5: "IELTS 5.5",
  ielts_6: "IELTS 6.0",
  ielts_6_5: "IELTS 6.5",
  ielts_7: "IELTS 7.0",
  ielts_7_5: "IELTS 7.5",
  ielts_8: "IELTS 8.0",
  ielts_8_5: "IELTS 8.5",
  ielts_9: "IELTS 9.0",
};

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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("id", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ["course-exams", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select(
          `
          *,
          exam_sections (
            id,
            section_type,
            title,
            duration_minutes
          )
        `,
        )
        .eq("course_id", slug!)
        .eq("is_published", true)
        .eq("is_active", true)
        .order("week", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", slug, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("enrollments")
        .select("*")
        .eq("course_id", slug!)
        .eq("student_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!slug,
  });

  const handleEnroll = async () => {
    if (!user) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để đăng ký khóa học",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("enrollments").insert({
      course_id: slug!,
      student_id: user.id,
    });

    if (error) {
      toast({
        title: "Đăng ký thất bại",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await queryClient.invalidateQueries({ queryKey: ["enrollment", slug, user.id] });
      toast({
        title: "Đăng ký thành công",
        description: "Bạn đã tham gia khóa học này!",
      });
    }
  };

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
            <Badge className="mb-4">{levelLabels[course.level] || course.level}</Badge>
            <h1 className="text-3xl font-bold text-foreground mb-4">{course.title}</h1>
            <p className="text-lg text-muted-foreground">{course.description}</p>
          </div>

          {/* Syllabus */}
          {course.syllabus && !(Array.isArray(course.syllabus) && course.syllabus.length === 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Nội dung khóa học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {typeof course.syllabus === "string" ? course.syllabus : JSON.stringify(course.syllabus, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enrollment Card */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <CardTitle className="text-2xl">
                {course.price ? `${course.price.toLocaleString()} VND` : 'Miễn phí'}
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>{levelLabels[course.level] || course.level}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollment ? (
                <Button className="w-full" size="lg" disabled>
                  <Play className="mr-2 h-4 w-4" />
                  Đã đăng ký
                </Button>
              ) : (
                <Button className="w-full" size="lg" onClick={handleEnroll}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Đăng ký ngay
                </Button>
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
            {exams.map((exam) => (
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
                    {exam.exam_sections?.map((section: any) => {
                      const Icon = sectionIcons[section.section_type] || FileText;
                      const colorCls = sectionColors[section.section_type] || sectionColors.general;
                      return (
                        <Badge
                          key={section.id}
                          className={colorCls}
                        >
                          <Icon className="mr-1 h-3 w-3" />
                          {section.section_type === 'general' ? 'Grammar' : section.section_type}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      {exam.duration_minutes || 60} phút
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
      </div>
    </div>
  );
}
