import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowUpDown,
  Users,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

type SortField = "name" | "createdAt";

export default function AdminClasses() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteClass, setDeleteClass] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-classes",
      debouncedSearch,
      sortField,
      sortOrder,
      page,
      pageSize,
    ],
    queryFn: () =>
      classesApi.list({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortOrder,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      classesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      toast({ title: "Đã tạo lớp học mới" });
      setCreateOpen(false);
      setCreateForm({ name: "", description: "" });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo lớp học",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      toast({ title: "Đã xóa", description: "Lớp học đã được xóa" });
      setDeleteClass(null);
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

  const classes = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý lớp học</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm lớp học
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
              <SortHeader field="name">Tên lớp</SortHeader>
              <TableHead>Giáo viên</TableHead>
              <TableHead>Số học viên</TableHead>
              <SortHeader field="createdAt">Ngày tạo</SortHeader>
              <TableHead className="w-[140px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không tìm thấy lớp học nào
                </TableCell>
              </TableRow>
            ) : (
              classes.map((cls: any) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>
                    {cls.teacher?.fullName || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {cls._count?.students || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(cls.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="space-x-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/classes/${cls.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        setDeleteClass({ id: cls.id, name: cls.name })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lớp học mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên lớp *</Label>
              <Input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="VD: IELTS Foundation 01"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                placeholder="Mô tả lớp học..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => createMutation.mutate(createForm)}
              disabled={!createForm.name || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tạo lớp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteClass}
        onOpenChange={(open) => !open && setDeleteClass(null)}
        onConfirm={() => deleteClass && deleteMutation.mutate(deleteClass.id)}
        loading={deleteMutation.isPending}
        title="Xóa lớp học?"
        description={`Bạn có chắc chắn muốn xóa lớp "${deleteClass?.name}"? Tất cả học viên sẽ bị gỡ khỏi lớp.`}
      />
    </div>
  );
}
