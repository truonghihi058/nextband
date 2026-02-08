import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "@/lib/api";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseFilters } from "@/components/courses/CourseFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

export default function HomePage() {
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["courses", levelFilter, searchQuery],
    queryFn: () =>
      coursesApi.list({
        search: searchQuery || undefined,
        limit: 100,
      }),
  });

  // Filter by level client-side since API might not have this filter
  const courses = (data?.data || []).filter((course: any) => {
    if (levelFilter === "all") return true;
    return course.level === levelFilter;
  });

  // Only show published courses
  const publishedCourses = courses.filter((course: any) => course.isPublished);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary to-primary/5 p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Khám phá khóa học IELTS
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Nâng cao kỹ năng tiếng Anh của bạn với các khóa học được thiết kế
            bởi đội ngũ giáo viên giàu kinh nghiệm.
          </p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
          <BookOpen className="h-48 w-48" />
        </div>
      </div>

      {/* Filters */}
      <CourseFilters
        levelFilter={levelFilter}
        onLevelChange={setLevelFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : publishedCourses && publishedCourses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {publishedCourses.map((course: any) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Không tìm thấy khóa học
          </h3>
          <p className="text-muted-foreground">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      )}
    </div>
  );
}
