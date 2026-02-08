import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, User, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/admin/DataTablePagination";

type SortField = "fullName" | "email" | "createdAt";

export default function AdminUsers() {
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
      "admin-users",
      debouncedSearch,
      sortField,
      sortOrder,
      page,
      pageSize,
    ],
    queryFn: () =>
      usersApi.list({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return usersApi.update(id, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Đã cập nhật trạng thái người dùng" });
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

  const users = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý người dùng</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo email hoặc tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="fullName">Người dùng</SortHeader>
              <SortHeader field="email">Email</SortHeader>
              <TableHead>Vai trò</TableHead>
              <SortHeader field="createdAt">Ngày tạo</SortHeader>
              <TableHead>Kích hoạt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không tìm thấy người dùng nào
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.fullName || "Chưa đặt tên"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles?.map((role: string) => (
                      <Badge key={role} variant="outline" className="mr-1">
                        {role}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.isActive ?? true}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: user.id,
                          isActive: checked,
                        })
                      }
                    />
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
