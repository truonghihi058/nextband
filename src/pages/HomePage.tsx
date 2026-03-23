import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "@/lib/api";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseFilters } from "@/components/courses/CourseFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { SEO } from "@/components/common/SEO";

const PAGE_SIZE = 6;

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["courses", searchQuery],
    queryFn: () =>
      coursesApi.list({
        search: searchQuery || undefined,
        limit: 200,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const allCourses = data?.data || [];

  const totalPages = Math.max(1, Math.ceil(allCourses.length / PAGE_SIZE));

  // Reset về trang 1 khi đổi search
  const safePage = Math.min(currentPage, totalPages);

  const pagedCourses = useMemo(
    () => allCourses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [allCourses, safePage],
  );

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <SEO
        title="Trang chủ"
        description="NextBand - Nền tảng luyện thi IELTS thông minh. Khám phá các khóa học IELTS chất lượng cao, luyện thi Reading, Listening, Writing, Speaking."
      />
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
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
      />

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(PAGE_SIZE)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : pagedCourses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pagedCourses.map((course: any) => (
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

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="h-9 px-3"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const isActive = page === safePage;
            const isNear =
              Math.abs(page - safePage) <= 1 || page === 1 || page === totalPages;
            if (!isNear) {
              // Dấu ...
              if (page === 2 && safePage > 3) return <span key={page} className="px-1 text-muted-foreground text-sm">…</span>;
              if (page === totalPages - 1 && safePage < totalPages - 2) return <span key={page} className="px-1 text-muted-foreground text-sm">…</span>;
              return null;
            }
            return (
              <Button
                key={page}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`h-9 w-9 p-0 text-sm font-medium ${isActive ? "" : "text-muted-foreground"}`}
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="h-9 px-3"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Info */}
      {!isLoading && allCourses.length > 0 && (
        <p className="text-center text-xs text-muted-foreground -mt-4">
          Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–
          {Math.min(safePage * PAGE_SIZE, allCourses.length)} / {allCourses.length} khóa học
        </p>
      )}
    </div>
  );
}
