import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi, usersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowUpDown,
  Users,
  Loader2,
  Calendar,
  GraduationCap,
  School,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

type SortField = "name" | "createdAt";

const emptyForm = {
  name: "",
  description: "",
  teacherId: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

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

  // Fetch teachers for the dropdown
  const { data: teachersData } = useQuery({
    queryKey: ["teachers-list"],
    queryFn: () => usersApi.list({ role: "teacher", limit: 100 }),
  });

  const teachers = teachersData?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: typeof emptyForm) =>
      classesApi.create({
        ...body,
        teacherId: body.teacherId || undefined,
        startDate: body.startDate || undefined,
        endDate: body.endDate || undefined,
        isActive: body.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      toast({ title: "Đã tạo lớp học mới" });
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo lớp học",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) =>
      classesApi.update(id, {
        name: body.name,
        description: body.description,
        teacherId: body.teacherId || null,
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        isActive: body.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      toast({ title: "Đã cập nhật lớp học" });
      setDialogOpen(false);
      setEditingClass(null);
      setForm(emptyForm);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật",
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

  const openCreate = () => {
    setEditingClass(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cls: any) => {
    setEditingClass(cls);
    setForm({
      name: cls.name || "",
      description: cls.description || "",
      teacherId: cls.teacherId || cls.teacher?.id || "",
      startDate: cls.startDate
        ? new Date(cls.startDate).toISOString().split("T")[0]
        : "",
      endDate: cls.endDate
        ? new Date(cls.endDate).toISOString().split("T")[0]
        : "",
      isActive: cls.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate).getTime();
      const end = new Date(form.endDate).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && start > end) {
        toast({
          title: "Lỗi",
          description: "Ngày bắt đầu không được lớn hơn ngày kết thúc",
          variant: "destructive",
        });
        return;
      }
    }
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const classes = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total || 0;

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <School className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quản lý lớp học</h1>
            <p className="text-sm text-muted-foreground">
              {total} lớp học trong hệ thống
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
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
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <SortHeader field="createdAt">Ngày tạo</SortHeader>
              <TableHead className="w-[140px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                  <TableCell className="text-sm">
                    {formatDate(cls.startDate)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(cls.endDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(cls.createdAt)}
                  </TableCell>
                  <TableCell className="space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(cls)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/classes/${cls.id}`}>
                        <Users className="h-4 w-4" />
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên lớp *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: IELTS Foundation 01"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Mô tả lớp học..."
                rows={3}
              />
            </div>

            {/* Teacher select */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Giáo viên phụ trách
              </Label>
              <Select
                value={form.teacherId}
                onValueChange={(v) =>
                  setForm({ ...form, teacherId: v === "__none__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giáo viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">
                      — Không chọn —
                    </span>
                  </SelectItem>
                  {teachers.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={t.avatarUrl || undefined} />
                          <AvatarFallback className="bg-amber-500/10 text-amber-600 text-xs">
                            <GraduationCap className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {t.fullName || "Chưa đặt tên"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t.email}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Ngày bắt đầu
                </Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Ngày kết thúc
                </Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Kích hoạt</Label>
                <div className="text-sm text-muted-foreground">
                  Cho phép truy cập lớp học
                </div>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isActive: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !form.name ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingClass ? "Lưu" : "Tạo lớp"}
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
