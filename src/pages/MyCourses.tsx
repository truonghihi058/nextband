import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "@/lib/api";
import { CourseCard } from "@/components/courses/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function MyCourses() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentsApi.list(),
    enabled: isAuthenticated,
  });

  const enrollments = data?.data || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Khóa Học Của Tôi
        </h1>
        <p className="text-muted-foreground">
          Quản lý và tiếp tục học các khóa học bạn đã đăng ký
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : enrollments && enrollments.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment: any) => (
            <CourseCard
              key={enrollment.id}
              course={enrollment.course}
              progress={enrollment.progressPercent || 0}
              enrolled
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-2xl bg-muted/30">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Bạn chưa đăng ký khóa học nào
          </h3>
          <p className="text-muted-foreground mb-6">
            Khám phá các khóa học IELTS chất lượng cao của chúng tôi
          </p>
          <Button asChild>
            <Link to="/">
              <BookOpen className="mr-2 h-4 w-4" />
              Khám phá khóa học
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
