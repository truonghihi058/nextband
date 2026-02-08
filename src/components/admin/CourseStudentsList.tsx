import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentsApi, usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Search, User, Loader2 } from "lucide-react";

interface CourseStudentsListProps {
  courseId: string;
}

export default function CourseStudentsList({
  courseId,
}: CourseStudentsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch enrolled students
  const { data: enrollmentsData, isLoading } = useQuery({
    queryKey: ["course-enrollments", courseId],
    queryFn: () => enrollmentsApi.listByCourse(courseId),
    enabled: !!courseId,
  });

  const enrollments = enrollmentsData?.data || [];

  // Fetch available users (not enrolled)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["available-users", courseId, searchTerm],
    queryFn: () => usersApi.list({ search: searchTerm, limit: 20 }),
    enabled: open,
  });

  const enrolledIds = enrollments.map((e: any) => e.studentId);
  const availableUsers = (usersData?.data || []).filter(
    (u: any) => !enrolledIds.includes(u.id),
  );

  // Add student mutation
  const addMutation = useMutation({
    mutationFn: (studentId: string) =>
      enrollmentsApi.enrollUser(courseId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course-enrollments", courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["available-users", courseId],
      });
      toast({
        title: "Thành công",
        description: "Đã thêm học viên vào khóa học",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    },
  });

  // Remove student mutation
  const removeMutation = useMutation({
    mutationFn: (enrollmentId: string) => enrollmentsApi.delete(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course-enrollments", courseId],
      });
      toast({
        title: "Thành công",
        description: "Đã xóa học viên khỏi khóa học",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Học viên đã đăng ký</CardTitle>
          <CardDescription>{enrollments?.length || 0} học viên</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Thêm học viên
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm học viên</DialogTitle>
              <DialogDescription>
                Chọn học viên để thêm vào khóa học
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo email hoặc tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {usersLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : availableUsers && availableUsers.length > 0 ? (
                  availableUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {user.fullName || "Chưa đặt tên"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addMutation.mutate(user.id)}
                        disabled={addMutation.isPending}
                      >
                        Thêm
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    {searchTerm
                      ? "Không tìm thấy học viên"
                      : "Nhập tên hoặc email để tìm kiếm"}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Đang tải...</p>
        ) : enrollments && enrollments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học viên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead>Tiến độ</TableHead>
                <TableHead className="w-[80px]">Xóa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment: any) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={enrollment.student?.avatarUrl || undefined}
                        />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {enrollment.student?.fullName || "Chưa đặt tên"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{enrollment.student?.email}</TableCell>
                  <TableCell>
                    {new Date(enrollment.enrolledAt).toLocaleDateString(
                      "vi-VN",
                    )}
                  </TableCell>
                  <TableCell>{enrollment.progressPercent || 0}%</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeMutation.mutate(enrollment.id)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            Chưa có học viên nào đăng ký
          </p>
        )}
      </CardContent>
    </Card>
  );
}
