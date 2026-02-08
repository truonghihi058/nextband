import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { submissionsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Search,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  in_progress: { label: "Đang làm", variant: "secondary", icon: Clock },
  submitted: { label: "Đã nộp", variant: "outline", icon: AlertCircle },
  graded: { label: "Đã chấm", variant: "default", icon: CheckCircle2 },
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "in_progress", label: "Đang làm" },
  { value: "submitted", label: "Đã nộp" },
  { value: "graded", label: "Đã chấm" },
];

export default function MySubmissions() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search
  const debounceTimer = useMemo(
    () => ({ id: null as ReturnType<typeof setTimeout> | null }),
    [],
  );
  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer.id) clearTimeout(debounceTimer.id);
      debounceTimer.id = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
    },
    [debounceTimer],
  );

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["my-submissions", page, pageSize, debouncedSearch, statusFilter],
    queryFn: () =>
      submissionsApi.list({
        page,
        limit: pageSize,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    enabled: isAuthenticated,
  });

  const submissions = data?.data || [];
  const totalItems = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || Math.ceil(totalItems / pageSize);

  // Client-side search filter
  const filteredSubmissions = debouncedSearch
    ? submissions.filter((s: any) => {
        const term = debouncedSearch.toLowerCase();
        return (
          s.exam?.title?.toLowerCase().includes(term) ||
          s.exam?.course?.title?.toLowerCase().includes(term)
        );
      })
    : submissions;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Bài Đã Làm</h1>
        <p className="text-muted-foreground">
          Xem lại lịch sử và kết quả các bài thi bạn đã thực hiện
        </p>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên bài thi hoặc khóa học..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredSubmissions.length > 0 ? (
        <div className="space-y-2">
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bài thi</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-center">Điểm</TableHead>
                  <TableHead>Ngày làm</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission: any) => {
                  const status =
                    statusConfig[submission.status || "in_progress"];
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.exam?.title || "Không rõ"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {submission.exam?.course?.title || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {submission.status === "graded" &&
                        submission.totalScore != null ? (
                          <span className="font-semibold text-primary">
                            {submission.totalScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {submission.startedAt
                          ? format(
                              new Date(submission.startedAt),
                              "dd/MM/yyyy HH:mm",
                              { locale: vi },
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {submission.status === "in_progress" ? (
                          <Button size="sm" asChild>
                            <Link to={`/exam/${submission.examId}`}>
                              Tiếp tục
                            </Link>
                          </Button>
                        ) : submission.status === "graded" ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/submissions/${submission.id}`}>
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              Xem kết quả
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Chờ chấm
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        <div className="text-center py-16 border rounded-2xl bg-muted/30">
          <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {debouncedSearch || statusFilter !== "all"
              ? "Không tìm thấy bài thi nào phù hợp"
              : "Bạn chưa làm bài thi nào"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {debouncedSearch || statusFilter !== "all"
              ? "Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
              : "Hãy vào khóa học và bắt đầu làm bài thi đầu tiên của bạn"}
          </p>
          {!debouncedSearch && statusFilter === "all" && (
            <Button asChild>
              <Link to="/">Khám phá khóa học</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
