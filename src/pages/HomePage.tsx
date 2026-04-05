import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { coursesApi } from "@/lib/api";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseFilters } from "@/components/courses/CourseFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { SEO } from "@/components/common/SEO";
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettings,
} from "@/lib/site-settings";

const PAGE_SIZE = 6;

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    setSettings(loadSiteSettings());

    const onStorage = (event: StorageEvent) => {
      if (event.key === "nb_admin_settings") {
        setSettings(loadSiteSettings());
      }
    };

    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("storage", onStorage);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const sloganWeight =
    settings.sloganFontWeight === "light"
      ? 300
      : settings.sloganFontWeight === "regular"
        ? 400
        : 700;
  const sloganSize = isMobile
    ? settings.sloganMobileSize
    : settings.sloganDesktopSize;

  const { data, isLoading } = useQuery({
    queryKey: ["courses", searchQuery, currentPage],
    queryFn: () =>
      coursesApi.list({
        search: searchQuery || undefined,
        page: currentPage,
        limit: PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    placeholderData: keepPreviousData,
  });

  const result = data as any;
  const courses = result?.data || [];
  const meta = result?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

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
        <div
          className="relative z-10"
          style={{ textAlign: settings.sloganAlign }}
        >
          <h1
            className="mb-4"
            style={{
              fontFamily: settings.sloganFontFamily,
              fontWeight: sloganWeight,
              color: settings.sloganColor,
              fontSize: `${sloganSize}px`,
              lineHeight: settings.sloganLineHeight,
            }}
          >
            {settings.sloganText}
          </h1>
          <p
            className={`text-lg text-muted-foreground ${
              settings.sloganAlign === "center"
                ? "mx-auto"
                : settings.sloganAlign === "right"
                  ? "ml-auto"
                  : ""
            } max-w-2xl`}
          >
            Nâng cao kỹ năng tiếng Anh của bạn với các khóa học được thiết kế
            bởi đội ngũ giáo viên giàu kinh nghiệm.
          </p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
          <BookOpen className="h-48 w-48" />
        </div>
      </div>

      {/* Filters */}
      <CourseFilters searchQuery={searchQuery} onSearchChange={handleSearch} />

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
      ) : courses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => (
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
        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-9 px-3"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const isActive = page === currentPage;
            const show =
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1;

            if (!show) {
              if (page === 2 && currentPage > 3)
                return (
                  <span key={page} className="px-1 text-muted-foreground text-sm">
                    …
                  </span>
                );
              if (page === totalPages - 1 && currentPage < totalPages - 2)
                return (
                  <span key={page} className="px-1 text-muted-foreground text-sm">
                    …
                  </span>
                );
              return null;
            }

            return (
              <Button
                key={page}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="h-9 w-9 p-0 text-sm font-medium"
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-9 px-3"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Info */}
      {!isLoading && total > 0 && (
        <p className="text-center text-xs text-muted-foreground -mt-4">
          Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, total)} / {total} khóa học
        </p>
      )}
    </div>
  );
}
