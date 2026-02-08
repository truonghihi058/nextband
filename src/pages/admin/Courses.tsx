import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/admin/DataTablePagination";

type SortField = "title" | "createdAt" | "level";

export default function AdminCourses() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-courses",
      debouncedSearch,
      sortField,
      sortOrder,
      page,
      pageSize,
    ],
    queryFn: () =>
      coursesApi.list({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortOrder,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return coursesApi.update(id, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Đã cập nhật trạng thái" });
    },
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          className={`h-3 w-3 ${sortField === field ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>
    </TableHead>
  );

  const courses = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
        <Button asChild>
          <Link to="/admin/courses/create">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khóa học
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="title">Tên khóa học</SortHeader>
              <SortHeader field="level">Cấp độ</SortHeader>
              <TableHead>Xuất bản</TableHead>
              <TableHead>Kích hoạt</TableHead>
              <TableHead className="w-[100px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không tìm thấy khóa học nào
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course: any) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{course.level}</TableCell>
                  <TableCell>
                    <Badge
                      variant={course.isPublished ? "default" : "secondary"}
                    >
                      {course.isPublished ? "Đã xuất bản" : "Nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={course.isActive ?? true}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: course.id,
                          isActive: checked,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/courses/${course.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {data && (
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}
