import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi, usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Loader2,
  Save,
  UserPlus,
  Trash2,
  Search,
  Users,
} from "lucide-react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

export default function AdminClassEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Add students dialog
  const [addStudentsOpen, setAddStudentsOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Delete student confirm
  const [removeStudent, setRemoveStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch class detail
  const { data: classData, isLoading } = useQuery({
    queryKey: ["admin-class", id],
    queryFn: () => classesApi.getById(id!),
    enabled: !!id,
  });

  // Initialize form when data loads
  if (classData && !initialized) {
    setName(classData.name || "");
    setDescription(classData.description || "");
    setInitialized(true);
  }

  // Fetch students for the add-students dialog
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users-students", studentSearch],
    queryFn: () =>
      usersApi.list({
        page: 1,
        limit: 50,
        search: studentSearch || undefined,
        role: "student",
      }),
    enabled: addStudentsOpen,
  });

  // Update class mutation
  const updateMutation = useMutation({
    mutationFn: (body: { name?: string; description?: string }) =>
      classesApi.update(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-class", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      toast({ title: "Đã cập nhật lớp học" });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật",
        variant: "destructive",
      });
    },
  });

  // Add students mutation
  const addStudentsMutation = useMutation({
    mutationFn: (studentIds: string[]) =>
      classesApi.addStudents(id!, studentIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-class", id] });
      toast({
        title: "Đã thêm học viên",
        description: `${data.added} học viên được thêm vào lớp`,
      });
      setAddStudentsOpen(false);
      setSelectedStudents([]);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm học viên",
        variant: "destructive",
      });
    },
  });

  // Remove student mutation
  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) => classesApi.removeStudent(id!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-class", id] });
      toast({ title: "Đã xóa học viên khỏi lớp" });
      setRemoveStudent(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!classData) {
    return <div className="text-center py-8">Lớp học không tồn tại</div>;
  }

  // Students already in class
  const existingStudentIds = new Set(
    (classData.students || []).map((s: any) => s.studentId),
  );

  // Available students (not yet in class)
  const availableStudents = (usersData?.data || []).filter(
    (u: any) => !existingStudentIds.has(u.id),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/classes")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{classData.name}</h1>
          <p className="text-sm text-muted-foreground">
            Giáo viên: {classData.teacher?.fullName || "Chưa có"} •{" "}
            {classData.students?.length || 0} học viên
          </p>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin lớp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tên lớp *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: IELTS Foundation 01"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả lớp học..."
              rows={3}
            />
          </div>
          <Button
            onClick={() => updateMutation.mutate({ name, description })}
            disabled={!name || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lưu thay đổi
          </Button>
        </CardContent>
      </Card>

      {/* Student Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Danh sách học viên
              </CardTitle>
              <CardDescription>
                {classData.students?.length || 0} học viên trong lớp
              </CardDescription>
            </div>
            <Button onClick={() => setAddStudentsOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Thêm học viên
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {classData.students?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có học viên nào trong lớp. Bấm "Thêm học viên" để bắt đầu.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead className="w-[80px]">Xoá</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(classData.students || []).map((cs: any) => (
                  <TableRow key={cs.id}>
                    <TableCell className="font-medium">
                      {cs.student?.fullName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cs.student?.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(cs.joinedAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          setRemoveStudent({
                            id: cs.studentId,
                            name: cs.student?.fullName || cs.student?.email,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Students Dialog */}
      <Dialog open={addStudentsOpen} onOpenChange={setAddStudentsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Thêm học viên vào lớp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedStudents.length > 0 && (
              <Badge variant="secondary">
                Đã chọn: {selectedStudents.length} học viên
              </Badge>
            )}

            <div className="flex-1 overflow-y-auto border rounded-md max-h-[350px]">
              {usersLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Đang tải...
                </div>
              ) : availableStudents.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Không tìm thấy học viên nào
                </div>
              ) : (
                <div className="divide-y">
                  {availableStudents.map((user: any) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedStudents.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents([...selectedStudents, user.id]);
                          } else {
                            setSelectedStudents(
                              selectedStudents.filter((id) => id !== user.id),
                            );
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.fullName || "Chưa có tên"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddStudentsOpen(false);
                setSelectedStudents([]);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={() => addStudentsMutation.mutate(selectedStudents)}
              disabled={
                selectedStudents.length === 0 || addStudentsMutation.isPending
              }
            >
              {addStudentsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Thêm {selectedStudents.length} học viên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Student Confirm */}
      <DeleteConfirmDialog
        open={!!removeStudent}
        onOpenChange={(open) => !open && setRemoveStudent(null)}
        onConfirm={() =>
          removeStudent && removeStudentMutation.mutate(removeStudent.id)
        }
        loading={removeStudentMutation.isPending}
        title="Xóa học viên khỏi lớp?"
        description={`Bạn có chắc chắn muốn xóa "${removeStudent?.name}" khỏi lớp này?`}
      />
    </div>
  );
}
