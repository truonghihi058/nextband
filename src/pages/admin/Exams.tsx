import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examsApi } from "@/lib/api";
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
import {
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  Search,
  ClipboardList,
  Lock,
  Unlock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SortField = "title" | "createdAt" | "week";

export default function AdminExams() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteExam, setDeleteExam] = useState<{
    id: string;
    title: string;
    isLocked?: boolean;
  } | null>(null);  

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
      "admin-exams",
      debouncedSearch,
      sortField,
      sortOrder,
      page,
      pageSize,
    ],
    queryFn: () =>
      examsApi.list({
        page,
        limit: pageSize,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return examsApi.update(id, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      toast({ title: "Đã cập nhật trạng thái" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) =>
      examsApi.delete(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      toast({ title: "Đã xóa", description: "Bài thi đã được xóa" });
      setDeleteExam(null);
    },
  });

  const lockMutation = useMutation({
    mutationFn: async ({ id, isLocked }: { id: string; isLocked: boolean }) =>
      examsApi.update(id, { isLocked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      toast({ title: "Đã cập nhật trạng thái khóa" });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi",
        description:
          err.response?.data?.error || "Không thể cập nhật trạng thái khóa",
        variant: "destructive",
      });
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

  const exams = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quản lý bài thi</h1>
            <p className="text-sm text-muted-foreground">
              {total} bài thi trong hệ thống
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/admin/exams/create">
            <Plus className="mr-2 h-4 w-4" />
            Thêm bài thi
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
              <SortHeader field="title">Tên bài thi</SortHeader>
              <TableHead>Khóa học</TableHead>
              <SortHeader field="week">Tuần</SortHeader>
              <TableHead>Xuất bản</TableHead>
              <TableHead>Kích hoạt</TableHead>
              <TableHead>Khóa</TableHead>
              <TableHead className="w-[240px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : exams.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không tìm thấy bài thi nào
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam: any) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.course?.title || "-"}</TableCell>
                  <TableCell>Tuần {exam.week || 1}</TableCell>
                  <TableCell>
                    <Badge variant={exam.isPublished ? "default" : "secondary"}>
                      {exam.isPublished ? "Đã xuất bản" : "Nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={exam.isActive ?? true}
                      disabled={!!exam.isLocked}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: exam.id,
                          isActive: checked,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={exam.isLocked ? "secondary" : "outline"}
                            size="icon"
                            onClick={() =>
                              lockMutation.mutate({
                                id: exam.id,
                                isLocked: !exam.isLocked,
                              })
                            }
                            disabled={lockMutation.isPending}
                            aria-label={exam.isLocked ? "Mở khóa" : "Khóa"}
                          >
                            {exam.isLocked ? (
                              <Unlock className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {exam.isLocked ? "Mở khóa" : "Khóa"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                disabled={!!exam.isLocked}
                                aria-label="Sửa bài thi"
                              >
                                <Link to={`/admin/exams/${exam.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Sửa</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-1.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  disabled={
                                    !!exam.isLocked ||
                                    (exam as any)._count?.submissions > 0
                                  }
                                  aria-label="Xóa bài thi"
                                  onClick={() =>
                                    setDeleteExam({
                                      id: exam.id,
                                      title: exam.title,
                                      isLocked: !!exam.isLocked,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {exam.isLocked
                                ? "Đang khóa, cần mở khóa trước khi xóa"
                                : (exam as any)._count?.submissions > 0
                                ? `Không thể xóa — đã có ${(exam as any)._count.submissions} bài nộp`
                                : "Xóa"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
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

      <DeleteConfirmDialog
        open={!!deleteExam}
        onOpenChange={(open) => !open && setDeleteExam(null)}
        onConfirm={(payload) =>
          deleteExam &&
          payload?.password &&
          deleteMutation.mutate({ id: deleteExam.id, password: payload.password })
        }
        loading={deleteMutation.isPending}
        title="Xóa bài thi?"
        description={`Bạn có chắc chắn muốn xóa bài thi "${deleteExam?.title}"? Dữ liệu sẽ mất vĩnh viễn.`}
        confirmKeyword="XOA"
        requirePassword
      />
    </div>
  );
}
